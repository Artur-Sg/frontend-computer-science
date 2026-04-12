// Лекция 06 — Примеры кода

// 1) Дырки в массиве
const a = [];
a[100] = 42;
console.log('holey length:', a.length);

// 2) Предварительная длина
const n = 100_000;
const arr = new Array(n);
for (let i = 0; i < n; i++) {
  arr[i] = i;
}
console.log('filled length:', arr.length);

// 3) Операции массива
const ops = [1, 2, 3];
ops.push(4);
ops.pop();
ops.unshift(0);
ops.shift();
console.log('ops:', ops);

// 4) Ограничение длины
try {
  // eslint-disable-next-line no-new
  new Array(2 ** 32);
} catch (err) {
  console.log('RangeError on 2^32 length');
}
