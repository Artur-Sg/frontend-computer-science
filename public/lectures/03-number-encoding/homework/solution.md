# Идея

Число хранится в **BCD**: в одном байте лежат две десятичные цифры (каждая занимает 4 бита).
Для хранения используется `Uint8Array`, что компактно и гарантирует диапазон 0–255 для каждого байта.

Ключевые моменты:

- Для нечётного количества цифр добавляется ведущий `0`, чтобы удобно упаковать пары.
- В каждом байте:
  - старшая тетрада — первая цифра пары;
  - младшая тетрада — вторая цифра пары.
- `digitsCount` хранит исходную длину числа, чтобы убрать добавленный ведущий ноль при `toString()`.
- `at(index)` возвращает цифру по позиции **с конца** (0 — последняя цифра).

### Упаковка и распаковка тетрад

Упаковка двух цифр в один байт:

```
this.data[i / 2] = (highDigit << 4) | lowDigit;
```

- `highDigit << 4` сдвигает первую цифру в **старшие 4 бита**.
- `| lowDigit` побитовым ИЛИ добавляет вторую цифру в **младшие 4 бита**.

В результате байт хранит сразу две цифры: `[highDigit][lowDigit]`.

Обратная операция при чтении:

```
const highDigit = byte >> 4;
const lowDigit = byte & 0b1111;
```

- `byte >> 4` возвращает старшую тетраду.
- `byte & 0b1111` маской `0000 1111` оставляет младшую тетраду.

## Код

```ts
export abstract class BCD {
  // Храним число как packed BCD: в одном байте две цифры.
  // Uint8Array гарантирует 0–255 и экономит память.
  protected data: Uint8Array;

  constructor(num: number | bigint) {
    // В этом ДЗ работаем только с неотрицательными значениями.
    if (num < 0) {
      throw new Error('Только неотрицательные числа');
    }
    // Пустой буфер — базовая инициализация.
    this.data = new Uint8Array();
  }

  abstract toBigint(): bigint;

  abstract toNumber(): number;

  abstract toString(): string;

  abstract at(index: number): number;
}

export class BCD8421 extends BCD {
  // Количество исходных цифр важно, чтобы корректно отбросить ведущий 0,
  // если число упаковано в байты с добавлением нуля слева.
  private digitsCount: number = 0;

  constructor(num: number | bigint) {
    super(num);

    // Преобразуем в строку, чтобы работать с десятичными цифрами напрямую.
    const decimal = String(num);

    this.digitsCount = decimal.length;

    // Для packed BCD нужно чётное количество цифр.
    // Если длина нечётная — добавляем ведущий 0.
    const hasOddLength = this.digitsCount % 2 !== 0;
    const normalized = hasOddLength ? `0${decimal}` : decimal;

    // В одном байте 2 цифры → длина/2 байта.
    this.data = new Uint8Array(normalized.length / 2);

    for (let i = 0; i < normalized.length; i += 2) {
      const highDigit = Number(normalized[i]);
      const lowDigit = Number(normalized[i + 1]);

      // Упаковка двух цифр в один байт:
      // 1) highDigit << 4 — сдвигаем первую цифру в старшие 4 бита (старшую тетраду).
      // 2) | lowDigit — побитовое ИЛИ добавляет вторую цифру в младшие 4 бита.
      // В итоге байт выглядит как: [highDigit][lowDigit].
      this.data[i / 2] = (highDigit << 4) | lowDigit;
    }
  }

  toBigint(): bigint {
    // Идём через строку, чтобы не потерять большие значения.
    return BigInt(this.toString());
  }

  toNumber(): number {
    // В number возможна потеря точности, но это ожидаемо для ДЗ.
    return Number(this.toString());
  }

  toString(): string {
    let result = '';

    for (let i = 0; i < this.data.length; i++) {
      const byte = this.data[i];
      // Декодируем байт обратно в две цифры:
      // highDigit — сдвигаем вправо на 4, чтобы получить старшую тетраду,
      // lowDigit — маска 0b1111 (15) оставляет только младшие 4 бита.
      const highDigit = byte >> 4;
      const lowDigit = byte & 0b1111;

      // Возвращаемся к строковому виду десятичных цифр.
      result += String(highDigit);
      result += String(lowDigit);
    }

    // Убираем ведущий 0, добавленный при нечётной длине.
    return result.slice(-this.digitsCount);
  }

  at(index: number): number {
    // В этом варианте индекс считается от младшего разряда.
    // Для отрицательных значений можно добавить преобразование: index = digitsCount + index.
    if (index < 0 || index >= this.digitsCount) {
      throw new RangeError('Индекс вне диапазона');
    }

    /**
     * Краткий вариант
     *
     * const stringValue = this.toString();
     *
     * return Number(stringValue[stringValue.length - 1 - index]);
     */

    // Сколько цифр реально хранится в Uint8Array (включая ведущий 0).
    const storedDigitsCount = this.data.length * 2;
    // Индекс “с конца”: 0 — последняя цифра.
    const position = storedDigitsCount - 1 - index;
    const byteIndex = Math.floor(position / 2);
    const byte = this.data[byteIndex];
    const isHighDigit = position % 2 === 0;
    const highDigit = byte >> 4;
    const lowDigit = byte & 0b1111;

    return isHighDigit ? highDigit : lowDigit;
  }
}
```
