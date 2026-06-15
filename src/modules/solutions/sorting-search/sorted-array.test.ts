import { strict as assert } from 'node:assert';

import { indexOf, lastIndexOf } from './sorted-array';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✔ ${name}`);
  } catch (error) {
    console.error(`✘ ${name}`);
    throw error;
  }
}

test('indexOf находит первую позицию числа в отсортированном массиве', () => {
  const ages = [12, 42, 42, 42, 56];

  assert.equal(indexOf(ages, 42), 1);
});

test('lastIndexOf находит последнюю позицию числа в отсортированном массиве', () => {
  const ages = [12, 42, 42, 42, 56];

  assert.equal(lastIndexOf(ages, 42), 3);
});

test('indexOf возвращает -1, если число не найдено', () => {
  const ages = [12, 42, 42, 42, 56];

  assert.equal(indexOf(ages, 100), -1);
});

test('lastIndexOf возвращает -1, если число не найдено', () => {
  const ages = [12, 42, 42, 42, 56];

  assert.equal(lastIndexOf(ages, 100), -1);
});

test('indexOf находит значение в начале массива', () => {
  const values = [1, 2, 3, 4, 5];

  assert.equal(indexOf(values, 1), 0);
});

test('lastIndexOf находит значение в начале массива', () => {
  const values = [1, 2, 3, 4, 5];

  assert.equal(lastIndexOf(values, 1), 0);
});

test('indexOf находит значение в конце массива', () => {
  const values = [1, 2, 3, 4, 5];

  assert.equal(indexOf(values, 5), 4);
});

test('lastIndexOf находит значение в конце массива', () => {
  const values = [1, 2, 3, 4, 5];

  assert.equal(lastIndexOf(values, 5), 4);
});

test('indexOf возвращает -1, если target меньше минимального значения', () => {
  const values = [10, 20, 30];

  assert.equal(indexOf(values, 1), -1);
});

test('lastIndexOf возвращает -1, если target меньше минимального значения', () => {
  const values = [10, 20, 30];

  assert.equal(lastIndexOf(values, 1), -1);
});

test('indexOf возвращает -1, если target больше максимального значения', () => {
  const values = [10, 20, 30];

  assert.equal(indexOf(values, 100), -1);
});

test('lastIndexOf возвращает -1, если target больше максимального значения', () => {
  const values = [10, 20, 30];

  assert.equal(lastIndexOf(values, 100), -1);
});

test('indexOf работает по массиву объектов через selector', () => {
  const users = [
    { age: 12, name: 'Bob' },
    { age: 42, name: 'Ben' },
    { age: 42, name: 'Jack' },
    { age: 42, name: 'Sam' },
    { age: 56, name: 'Bill' },
  ];

  assert.equal(
    indexOf(users, 42, (item) => item.age),
    1
  );
});

test('lastIndexOf работает по массиву объектов через selector', () => {
  const users = [
    { age: 12, name: 'Bob' },
    { age: 42, name: 'Ben' },
    { age: 42, name: 'Jack' },
    { age: 42, name: 'Sam' },
    { age: 56, name: 'Bill' },
  ];

  assert.equal(
    lastIndexOf(users, 42, (item) => item.age),
    3
  );
});

test('indexOf работает с selector по строковому полю', () => {
  const users = [{ name: 'Ann' }, { name: 'Bob' }, { name: 'Bob' }, { name: 'Sam' }];

  assert.equal(
    indexOf(users, 'Bob', (item) => item.name),
    1
  );
});

test('lastIndexOf работает с selector по строковому полю', () => {
  const users = [{ name: 'Ann' }, { name: 'Bob' }, { name: 'Bob' }, { name: 'Sam' }];

  assert.equal(
    lastIndexOf(users, 'Bob', (item) => item.name),
    2
  );
});

test('indexOf корректно работает на пустом массиве', () => {
  assert.equal(indexOf([], 42), -1);
});

test('lastIndexOf корректно работает на пустом массиве', () => {
  assert.equal(lastIndexOf([], 42), -1);
});

test('indexOf корректно работает на массиве из одного элемента', () => {
  assert.equal(indexOf([42], 42), 0);
  assert.equal(indexOf([42], 7), -1);
});

test('lastIndexOf корректно работает на массиве из одного элемента', () => {
  assert.equal(lastIndexOf([42], 42), 0);
  assert.equal(lastIndexOf([42], 7), -1);
});

test('indexOf и lastIndexOf различаются на массиве с повторами', () => {
  const ages = [1, 2, 2, 2, 3, 3, 5];

  assert.equal(indexOf(ages, 2), 1);
  assert.equal(lastIndexOf(ages, 2), 3);
});

test('indexOf находит первый элемент, если все элементы одинаковые', () => {
  const values = [42, 42, 42, 42];

  assert.equal(indexOf(values, 42), 0);
});

test('lastIndexOf находит последний элемент, если все элементы одинаковые', () => {
  const values = [42, 42, 42, 42];

  assert.equal(lastIndexOf(values, 42), 3);
});
