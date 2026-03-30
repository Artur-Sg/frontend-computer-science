# Идея

Число хранится в **BCD**: в одном байте лежат две десятичные цифры (каждая занимает 4 бита).
Для хранения используется `Uint8Array`.

Ключевые моменты:

- Для нечётного количества цифр добавляется ведущий `0`, чтобы удобно упаковать пары.
- В каждом байте:
  - старшая тетрада — первая цифра пары;
  - младшая тетрада — вторая цифра пары.
- `digitsCount` хранит реальное количество цифр, чтобы корректно работать с представлением числа.
- `at(index)` возвращает цифру по позиции **с конца** (0 — последняя цифра).

---

## Упаковка и распаковка тетрад

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

---

## Преобразования

- `toNumber()` собирает число в десятичной системе:
  - `result = result * 10 + digit`
- `toBigint()` интерпретирует BCD как последовательность 4-битных блоков:
  - `result = (result << 4n) | digit`
  - по сути формируется число в шестнадцатеричном виде (`0x...`), где каждая цифра занимает 4 бита

Важно:

- ведущий `0`, добавленный при нечётной длине, не влияет на результат:
  - в `toNumber()` он даёт `0 * 10 + x = x`
  - в `toBigint()` добавляет только нулевые старшие биты

---

## Код

```ts
export abstract class BCD {
  // Храним число как BCD: в одном байте две цифры.
  protected data: Uint8Array;

  constructor(num: number | bigint) {
    // В этом ДЗ работаем только с неотрицательными значениями.
    if (typeof num === 'number') {
      // Приводим number к bigint, чтобы дальше работать в одной числовой системе
      num = BigInt(num);
    }

    if (num < 0n) {
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
  // если число упаковано в байты с добавлением нуля слева
  private digitsCount: number = 0;

  constructor(num: number | bigint) {
    super(num);

    const digits: number[] = [];

    if (typeof num === 'number') {
      // Приводим к bigint, чтобы использовать % 10n и / 10n
      num = BigInt(num);
    }

    // Извлекаем цифры числа:
    // num % 10n — последняя цифра
    // num /= 10n — "сдвигаем" число вправо на один разряд
    // Цифры получаются в обратном порядке (с конца)
    do {
      const digit = num % 10n;

      digits.push(Number(digit));
      num /= 10n;

    } while (num > 0n);

    // Запоминаем реальное количество цифр
    this.digitsCount = digits.length;

    // Для BCD нужно чётное количество цифр
    // Если длина нечётная — добавляем ведущий 0
    const hasOddLength = this.digitsCount % 2 !== 0;

    if (hasOddLength) {
      // Добавляем 0 в конец, потому что далее будет reverse()
      // После разворота он окажется в начале
      digits.push(0);
    }

    // Переворачиваем, чтобы получить цифры в правильном порядке (слева направо)
    digits.reverse();

    // В одном байте 2 цифры → длина массива / 2 байта
    this.data = new Uint8Array(digits.length / 2);

    for (let i = 0; i < digits.length; i += 2) {
      const highDigit = Number(digits[i]);
      const lowDigit = Number(digits[i + 1]);

      // Упаковка двух цифр в один байт:
      // 1) highDigit << 4 — сдвигаем первую цифру в старшие 4 бита (старшую тетраду).
      // 2) | lowDigit — побитовое ИЛИ добавляет вторую цифру в младшие 4 бита.
      // В итоге байт выглядит как: [highDigit][lowDigit].
      this.data[i / 2] = (highDigit << 4) | lowDigit;
    }
  }

  toBigint(): bigint {
    let result = 0n;

    for (let i = 0; i < this.data.length; i++) {
      const byte = this.data[i];

      // Декодируем байт в две цифры (4 бита каждая)
      const highDigit = byte >> 4;
      const lowDigit = byte & 0b1111;

      // Собираем число как последовательность 4-битных блоков (BCD):
      // 1) result << 4n — сдвигаем текущий результат на 4 бита (освобождаем место)
      // 2) | digit — вставляем следующую цифру в младшие 4 бита
      result = (result << 4n) | BigInt(highDigit);
      result = (result << 4n) | BigInt(lowDigit);
    }

    // Ведущий 0 не влияет на значение, так как добавляет только нулевые старшие биты
    return result;
  }

  toNumber(): number {
    let result = 0;

    for (let i = 0; i < this.data.length; i++) {
      const byte = this.data[i];

      // Декодируем байт обратно в две цифры
      const highDigit = byte >> 4;
      const lowDigit = byte & 0b1111;

      // Собираем число в десятичной системе:
      // result * 10 — сдвиг числа на один разряд влево
      // + digit — добавляем новую цифру
      result = result * 10 + highDigit;
      result = result * 10 + lowDigit;
    }

    // Ведущий 0 (если был) не влияет на результат,
    // так как 0 * 10 + x = x
    return result;
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

      // Собираем строковое представление числа
      result += String(highDigit);
      result += String(lowDigit);
    }

    // Убираем ведущий 0, добавленный при нечётной длине
    return result.slice(-this.digitsCount);
  }

  at(index: number): number {
    if (index < 0) {
      // Отрицательные индексы считаются с конца:
      // -1 → последний разряд, -2 → предпоследний
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
