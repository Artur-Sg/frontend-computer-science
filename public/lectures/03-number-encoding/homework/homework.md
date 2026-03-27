# ДЗ 03 — Написать класс, который представляет числа в формате BCD 8421

Необходимо создать класс для хранения неотрицательных чисел в BCD-формате.
Для хранения байт следует использовать `Uint8Array`, где в одном байте нужно хранить одну цифру (со звездочкой (*) в одном байте 2 цифры).

```typescript
abstract class BCD {
    constructor(num: number) { /* ... */ }
  
    abstract toBigint(): bigint;
    abstract toNumber(): bigint;
    abstract toString(): string;

    // Возвращает значение разряда BCD числа на указанной позиции.
    // Отрицательная позиция означает разряд "с конца".
    abstract at(index: number): number;
}

const n = new BCD(65536n);

console.log(n.toBigint()); // 415030n
console.log(n.toNumber()); // 65536

console.log(n.at(0)); // 6
console.log(n.at(1)); // 5

console.log(n.at(-1)); // 6
console.log(n.at(-2)); // 3
```
