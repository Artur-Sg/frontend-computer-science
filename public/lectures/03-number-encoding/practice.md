# Практика — Кодирование чисел

## 1. Проверка точности `number`

```js
console.log(0.1 + 0.2);
console.log(0.1 + 0.2 === 0.3);
```

- Почему результат такой?
- Попробуй сравнить через эпсилон.

## 2. Безопасные целые

```js
console.log(Number.MAX_SAFE_INTEGER);
console.log(Number.isSafeInteger(Number.MAX_SAFE_INTEGER + 1));
console.log(Number.isSafeInteger(Number.MAX_SAFE_INTEGER + 2));
```

- Объясни, почему `MAX_SAFE_INTEGER + 1` и `+ 2` ведут себя неожиданно.

## 3. Bitwise в 32‑битной зоне

```js
console.log(4294967295 >> 0);
console.log(4294967295 >>> 0);
console.log(4294967296 >> 0);
```

- Объясни, почему `>> 0` меняет знак.

## 4. Мини‑BCD (packed)

Напиши функции упаковки и распаковки двух цифр в байт:

```js
function packBCD(d1, d2) {
  // TODO
}

function unpackBCD(byte) {
  // TODO
}
```

## 5. TypedArray и обрезание

```js
const arr = new Uint8Array(1);
arr[0] = 300;
console.log(arr[0]);

arr[0] = -1;
console.log(arr[0]);
```

- Объясни, почему получились именно такие значения.

## 6. BigInt

```js
const big = 2n ** 100n;
console.log(big);
```

- Почему это нельзя сделать с обычным `number` без потери точности?
