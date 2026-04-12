# Практика — Массивы

## 1. Доступ по индексу

```js
const arr = [10, 20, 30, 40];
console.log(arr[0]);
console.log(arr[3]);
```

- Почему доступ по индексу — O(1)?

## 2. Дырки в массиве

```js
const a = [];
a[100] = 42;
console.log(a.length);
```

- Почему это считается «дыркой»?
- Почему это плохо для производительности?

## 3. Предварительная длина

```js
const n = 1_000_000;
const arr = new Array(n);
for (let i = 0; i < n; i++) {
  arr[i] = i;
}
```

- Почему это быстрее, чем `push` в цикле?

## 4. Операции массива

```js
const arr = [1, 2, 3];
arr.push(4);
arr.pop();
arr.unshift(0);
arr.shift();
```

- Какие операции здесь O(1), а какие O(n)?

## 5. TypedArray vs Array

```js
const a = new Array(4).fill(0);
const b = new Uint32Array(4);
```

- Чем отличаются по хранению данных?
