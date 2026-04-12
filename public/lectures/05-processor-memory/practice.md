# Практика — Процессор и память

## 1. Row‑major vs Column‑major

```js
function rowMajor(array, size) {
  let sum = 0;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      sum += array[i * size + j];
    }
  }
  return sum;
}

function columnMajor(array, size) {
  let sum = 0;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      sum += array[j * size + i];
    }
  }
  return sum;
}
```

- Почему `rowMajor` быстрее?
- Как будет меняться разница при увеличении массива?

## 2. Кэш‑линия на пальцах

Размер кэш‑линии 64 байта.

- Сколько `uint8` значений помещается в одну линию?
- Сколько `uint32` значений?
- Как это влияет на обход массива?

## 3. Типизированные массивы

```js
const arr = new Uint8Array(10_000_000);
for (let i = 0; i < arr.length; i++) {
  arr[i] = i % 256;
}
```

- Почему это работает быстрее, чем массив объектов `{ value: number }`?

## 4. Ветвления внутри цикла

```js
let sum = 0;
for (let i = 0; i < arr.length; i++) {
  if (arr[i] > 127) {
    sum += arr[i];
  }
}
```

- Почему случайное условие хуже для производительности?

## 5. SIMD и простые циклы

```js
for (let i = 0; i < a.length; i++) {
  out[i] = a[i] + b[i];
}
```

- Почему такой код хорошо поддаётся векторизации?
- Какие изменения могут помешать оптимизации?
