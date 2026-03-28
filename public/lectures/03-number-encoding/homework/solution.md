# Идея

Число хранится в **BCD**: в одном байте лежат две десятичные цифры (каждая занимает 4 бита).
Для хранения используется `Uint8Array`.

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
export class BCD8421 extends BCD {
  // Количество исходных цифр
  private digitsCount: number = 0;

  constructor(num: number | bigint) {
    super(num);

    // Преобразуем в строку, чтобы работать с десятичными цифрами напрямую
    const decimal = String(num);

    this.digitsCount = decimal.length;

    // Для BCD нужно чётное количество цифр
    // Если длина нечётная — добавляем ведущий 0
    const hasOddLength = this.digitsCount % 2 !== 0;
    const normalized = hasOddLength ? `0${decimal}` : decimal;

    // В одном байте 2 цифры → длина/2 байта
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
    return BigInt(this.toString());
  }

  toNumber(): number {
    return Number(this.toString());
  }

  toString(): string {
    let result = '';

    for (let i = 0; i < this.data.length; i++) {
      const byte = this.data[i];
      // Декодируем байт обратно в две цифры:
      // highDigit - сдвигаем вправо на 4, чтобы получить старшую тетраду,
      // lowDigit - маска 0b1111 (15) оставляет только младшие 4 бита
      const highDigit = byte >> 4;
      const lowDigit = byte & 0b1111;

      // Собираем всё вместе
      result += String(highDigit);
      result += String(lowDigit);
    }

    // Убираем ведущий 0, добавленный при нечётной длине
    return result.slice(-this.digitsCount);
  }

  at(index: number): number {
    if (index < 0) {
      index = -index - 1;
    }

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

    // Общее количество цифр, которое физически хранится (включая возможный ведущий 0)
    const storedDigitsCount = this.data.length * 2;

    // Сколько "лишних" цифр добавлено слева (0 или 1)
    const offset = storedDigitsCount - this.digitsCount;

    // Переводим index (от младшего разряда) в позицию слева направо
    // 1) digitsCount - 1 - index → позиция в реальном числе
    // 2) + offset → сдвиг в нормализованное (с offset) представление
    const position = offset + (this.digitsCount - 1 - index);

    // Находим, в каком байте лежит нужная цифра (по 2 цифры на байт)
    const byteIndex = Math.floor(position / 2);

    // Берём сам байт
    const byte = this.data[byteIndex];

    // Определяем, это старшая (левая) или младшая (правая) цифра в байте
    const isHighDigit = position % 2 === 0;

    // Извлекаем старшую цифру (сдвигаем байт вправо на 4 бита)
    const highDigit = byte >> 4;

    // Извлекаем младшую цифру (оставляем только последние 4 бита)
    const lowDigit = byte & 0b1111;

    // Возвращаем нужную цифру
    return isHighDigit ? highDigit : lowDigit;
  }
}
```
