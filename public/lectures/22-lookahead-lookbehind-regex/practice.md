# Практика

## 1. Найти слово перед точкой

Напишите выражение, которое находит слово `end`, только если после него стоит точка.

```js
const regex = /________________/;

console.log(regex.test('end.')); // true
console.log(regex.test('end!')); // false
```

## 2. Найти цену после знака `$`

Напишите выражение, которое находит число только после символа `$`.

```js
const regex = /________________/g;
const text = 'Price: $100, discount: 20';

console.log(text.match(regex)); // ['100']
```

## 3. Проверить наличие цифры

Напишите выражение, которое проверяет, что строка содержит хотя бы одну цифру.

```js
const regex = /________________/;

console.log(regex.test('abc1')); // true
console.log(regex.test('abc'));  // false
```
