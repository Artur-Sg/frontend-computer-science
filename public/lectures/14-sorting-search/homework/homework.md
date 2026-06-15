# Домашнее задание

## indexOf и lastIndexOf через бинарный поиск

Необходимо реализовать функции indexOf и lastIndexOf для отсортированного массива, используя бинарный поиск. Сравните полученную реализацию с нативной.

```js
// Исходный массив должен быть отсортирован по возрасту
const ages = [12, 42, 42, 42, 56];

const users = [
  { age: 12, name: 'Bob' },
  { age: 42, name: 'Ben' },
  { age: 42, name: 'Jack' },
  { age: 42, name: 'Sam' },
  { age: 56, name: 'Bill' }
];

// Поиск по массиву чисел
indexOf(ages, 42);     // 1
lastIndexOf(ages, 42); // 3

// Поиск по массиву объектов (по полю age)
indexOf(users, 42, (item) => item.age);     // 1
lastIndexOf(users, 42, (item) => item.age); // 3

// Не найдено
indexOf(ages, 100);     // -1
lastIndexOf(ages, 100); // -1
```
