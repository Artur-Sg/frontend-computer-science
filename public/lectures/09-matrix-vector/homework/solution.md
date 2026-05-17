Решение построено вокруг общей абстракции `ElementView` — контракта, который описывает, как один элемент хранится в бинарном буфере:

```ts
export type ElementView<TValue, TInput = TValue, TAccess = unknown> = {
  readonly bytesPerElement: number;
  read(view: DataView, byteOffset: number): TValue;
  write(view: DataView, byteOffset: number, value: TInput): void;
  access?(view: DataView, byteOffset: number): TAccess;
};
```

Контейнеры `Matrix2D` и `Vector` не знают, что именно хранится в элементе (RGBA, числа, структуры).
Они знают только:

- размер элемента в байтах (`bytesPerElement`);
- как посчитать `byteOffset`.

Чтение/запись/покомпонентный доступ делегируются в `ElementView`.

Разделение ответственности:

- `Matrix2D / Vector` — где лежит элемент в памяти;
- `ElementView` — как прочитать/записать элемент;
- `RGBAView` — конкретный формат RGBA.

Реализованы две структуры на базе `ArrayBuffer` и контрактов `view`:

1. `Matrix2D` с универсальным `ElementView` и реализацией `RGBAView`.
2. `Vector` с заголовком в буфере (`capacity`, `length`) и поддержкой `push/pop`, `reserve`, `shrinkToFit`, `shift/unshift`.

Для проверки сделаны отдельные бенчмарки:

- `npm run bench:matrix` — сравнение `Matrix2D binary` vs `JSON flat` vs `JSON nested`.
- `npm run bench:vector` — сравнение `Vector<RGBAView>` vs `Array<RGBAObject>`.

### RGBAView

`RGBAView` использует 4 байта на элемент (`red`, `green`, `blue`, `alpha`) и поддерживает:

- чтение/запись кортежа `[r, g, b, a]`;
- запись HEX-строки (`#FFF`, `#EFEFEF`, `#RRGGBBAA`);
- `access(...)` для покомпонентного доступа без копирования.

`access` возвращает объект с getter/setter, который читает и пишет прямо в исходный буфер.

### Matrix2D

`Matrix2D` хранит данные линейно в `row-major`:

- `index = row * cols + col`
- `byteOffset = index * bytesPerElement`

Поддерживаются отрицательные индексы (через `normalizeIndex`), а также работа поверх внешнего буфера (например, `imageData.data` из Canvas) без дополнительного копирования.

### Vector

`Vector` хранит заголовок прямо в буфере:

- байты `0..3` — `capacity` (`Uint32`);
- байты `4..7` — `length` (`Uint32`);
- с байта `8` — данные элементов.

Смещение элемента:

- `byteOffset = HEADER_SIZE + index * bytesPerElement`

`push` использует геометрический рост capacity (коэффициент ~1.5), `pop` не делает realloc, `reserve` гарантирует дополнительное место, `shrinkToFit` ужимает буфер до текущей длины.
Методы со звёздочкой (`shift/unshift`) реализованы через сдвиг диапазонов `copyWithin` (сложность `O(n)`).

## Реализация

Ниже — основные реализации, использованные в задании.

<details>
<summary><code>types.ts</code> — контракт <code>ElementView</code></summary>

```ts
export type ElementView<TValue, TInput = TValue, TAccess = unknown> = {
  readonly bytesPerElement: number;
  read(view: DataView, byteOffset: number): TValue;
  write(view: DataView, byteOffset: number, value: TInput): void;
  access?(view: DataView, byteOffset: number): TAccess;
};

export function normalizeIndex(index: number, length: number): number {
  const normalized = index < 0 ? length + index : index;

  if (normalized < 0 || normalized >= length) {
    throw new RangeError(`Index out of bounds: ${index}`);
  }

  return normalized;
}
```

</details>

<details>
<summary><code>rgba-view.ts</code> — ElementView для RGBA</summary>

```ts
export const RGBAView: ElementView<RGBAColor, RGBAInput, RGBAAccess> = {
  bytesPerElement: 4,

  read(view: DataView, byteOffset: number): RGBAColor {
    return [
      view.getUint8(byteOffset),
      view.getUint8(byteOffset + 1),
      view.getUint8(byteOffset + 2),
      view.getUint8(byteOffset + 3),
    ];
  },

  write(view: DataView, byteOffset: number, value: RGBAInput): void {
    const [red, green, blue, alpha] = normalizeColor(value);

    view.setUint8(byteOffset, red);
    view.setUint8(byteOffset + 1, green);
    view.setUint8(byteOffset + 2, blue);
    view.setUint8(byteOffset + 3, alpha);
  },

  access(view: DataView, byteOffset: number): RGBAAccess {
    return {
      get red() { return view.getUint8(byteOffset); },
      set red(value: number) { view.setUint8(byteOffset, value); },
      get green() { return view.getUint8(byteOffset + 1); },
      set green(value: number) { view.setUint8(byteOffset + 1, value); },
      get blue() { return view.getUint8(byteOffset + 2); },
      set blue(value: number) { view.setUint8(byteOffset + 2, value); },
      get alpha() { return view.getUint8(byteOffset + 3); },
      set alpha(value: number) { view.setUint8(byteOffset + 3, value); },
    };
  },
};
```

</details>

<details>
<summary><code>matrix2d.ts</code> — универсальная двумерная матрица</summary>

```ts
export class Matrix2D<TValue, TInput = TValue, TAccess = TValue> {
  readonly rows: number;
  readonly cols: number;
  readonly buffer: ArrayBufferLike;
  readonly byteOffset: number;
  readonly byteLength: number;
  readonly #elementView: ElementView<TValue, TInput, TAccess>;
  readonly #data: DataView;

  get(row: number, col: number): TValue {
    const byteOffset = this.#getByteOffset(row, col);
    return this.#elementView.read(this.#data, byteOffset);
  }

  set(row: number, col: number, value: TInput): void {
    const byteOffset = this.#getByteOffset(row, col);
    this.#elementView.write(this.#data, byteOffset, value);
  }

  fill(value: TInput): void {
    for (let byteOffset = 0; byteOffset < this.byteLength; byteOffset += this.#elementView.bytesPerElement) {
      this.#elementView.write(this.#data, byteOffset, value);
    }
  }

  view(row: number, col: number): TAccess {
    if (this.#elementView.access === undefined) {
      throw new Error('Для этого типа элемента недоступен покомпонентный доступ');
    }

    const byteOffset = this.#getByteOffset(row, col);
    return this.#elementView.access(this.#data, byteOffset);
  }
}
```

</details>

<details>
<summary><code>vector.ts</code> — универсальный вектор с заголовком в буфере</summary>

```ts
const HEADER_SIZE = 8;
const CAPACITY_OFFSET = 0;
const LENGTH_OFFSET = 4;

export class Vector<TValue, TInput = TValue, TAccess = TValue> {
  buffer: ArrayBufferLike;
  byteOffset: number;
  byteLength: number;

  get capacity(): number {
    return this.#data.getUint32(CAPACITY_OFFSET, true);
  }

  get length(): number {
    return this.#data.getUint32(LENGTH_OFFSET, true);
  }

  push(value: TInput): number { /* ... */ }
  pop(): TValue | undefined { /* ... */ }
  shift(): TValue | undefined { /* ... */ }
  unshift(value: TInput): number { /* ... */ }
  reserve(extraCapacity: number): void { /* ... */ }
  shrinkToFit(): void { /* ... */ }
  get(index: number): TValue { /* ... */ }
  set(index: number, value: TInput): void { /* ... */ }
  fill(value: TInput): void { /* ... */ }
  view(index: number): TAccess { /* ... */ }
}
```

</details>

## Бенчмарк Matrix2D
Результаты бенчмарка `Matrix2D binary vs JSON flat vs JSON nested`.

### Результаты

#### Matrix 512x512

| Формат | Raw (MB) | Gzip (MB) | Serialize (ms) | Deserialize (ms) |
|---|---:|---:|---:|---:|
| Matrix2D binary | 1.00 | 0.43 | 0.13 | 0.01 |
| JSON flat | 3.68 | 0.60 | 15.75 | 12.88 |
| JSON nested | 4.18 | 0.63 | 20.03 | 30.39 |

#### Matrix 1024x1024

| Формат | Raw (MB) | Gzip (MB) | Serialize (ms) | Deserialize (ms) |
|---|---:|---:|---:|---:|
| Matrix2D binary | 4.00 | 0.89 | 0.30 | ~0 |
| JSON flat | 14.71 | 1.22 | 56.79 | 51.39 |
| JSON nested | 16.71 | 1.28 | 93.13 | 152.72 |

### Выводы по Matrix2D

- `JSON flat` в raw примерно в `3.68x` больше binary (`14.71 / 4`).
- `JSON nested` в raw примерно в `4.18x` больше binary (`16.71 / 4`).
- После `gzip` JSON сжимается хорошо, но binary всё равно меньше (`0.89 MB` против `1.22–1.28 MB`).
- По скорости binary на порядок быстрее, особенно на десериализации, так как создаётся `view` поверх буфера, а не парсится текст JSON.
- `JSON nested` самый тяжёлый по времени и размеру из-за вложенности и дополнительных аллокаций.

Важная оговорка: в текущем варианте binary хранит только сырые RGBA-байты. `rows/cols` и тип элемента считаются внешними метаданными.

## Бенчмарк Vector
Результаты бенчмарка `Vector<RGBAView> vs Array<RGBAObject>`.

### Результаты

#### Базовый сценарий (`push -> get/set -> pop`)

| Структура | Время (ms) | Соотношение |
|---|---:|---:|
| Vector<RGBAView> | 11.52 | 1.00x |
| Array<RGBAObject> | 17.21 | 1.49x |

`checksum` совпал (`153010712`), значит вычисления эквивалентны.

#### Стресс-сценарий (много `push/pop/shrinkToFit`)

| Структура | Время (ms) | Соотношение |
|---|---:|---:|
| Vector<RGBAView> | 6.60 | 1.00x |
| Array<RGBAObject> | 20.25 | 3.07x |

#### Память и GC

| Этап | heap (MB) | arrayBuffers (MB) | external (MB) |
|---|---:|---:|---:|
| before | 6.42 | 0.02 | 2.33 |
| after_vector | 11.77 | 5.50 | 7.81 |
| after_vector_gc | 6.43 | 0.02 | 2.33 |
| after_array | 17.73 | 0.02 | 2.33 |
| after_array_gc | 6.43 | 0.02 | 2.33 |

### Выводы по Vector

- В базовом сценарии массив объектов медленнее примерно в `1.49x`.
- В стресс-сценарии разница растёт до `3.07x` в пользу `Vector`.
- `Vector` хранит данные в `ArrayBuffer`, поэтому заметен рост `arrayBuffers`.
- `Array<RGBAObject>` создаёт больше JS-объектов и сильнее нагружает `heapUsed`.
- После принудительного GC память возвращается близко к исходной, но профиль нагрузки до GC отличается.

## Итог

Практика подтверждает идею лекции:

- Плоский бинарный буфер с чётким контрактом доступа эффективнее высокоуровневых вложенных JS-структур для больших однотипных данных.
- `Matrix2D` даёт компактное хранение и дешёвую десериализацию.
- `Vector` с заголовком (`capacity`, `length`) в буфере показывает более предсказуемое поведение по скорости и памяти, чем массив объектов.
