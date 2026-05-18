import { strict as assert } from 'node:assert';
import { Dequeue } from './dequeue';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✔ ${name}`);
  } catch (error) {
    console.error(`✘ ${name}`);
    throw error;
  }
}

test('пустая структура: length = 0, pop/shift возвращают undefined', () => {
  const deque = new Dequeue<number>(Array, 4);

  assert.equal(deque.length, 0);
  assert.equal(deque.pop(), undefined);
  assert.equal(deque.shift(), undefined);
});

test('некорректная ёмкость блока выбрасывает RangeError', () => {
  assert.throws(() => new Dequeue<number>(Array, 0), RangeError);
  assert.throws(() => new Dequeue<number>(Array, -1), RangeError);
  assert.throws(() => new Dequeue<number>(Array, 1.5), RangeError);
});

test('unshift добавляет в начало, shift удаляет из начала', () => {
  const deque = new Dequeue<number>(Array, 4);

  assert.equal(deque.unshift(1), 1);
  assert.equal(deque.unshift(2), 2);
  assert.equal(deque.unshift(3), 3);
  assert.equal(deque.length, 3);

  assert.equal(deque.shift(), 3);
  assert.equal(deque.shift(), 2);
  assert.equal(deque.shift(), 1);
  assert.equal(deque.shift(), undefined);
  assert.equal(deque.length, 0);
});

test('push добавляет в конец, pop удаляет с конца', () => {
  const deque = new Dequeue<number>(Array, 4);

  assert.equal(deque.push(10), 1);
  assert.equal(deque.push(20), 2);
  assert.equal(deque.push(30), 3);
  assert.equal(deque.length, 3);

  assert.equal(deque.pop(), 30);
  assert.equal(deque.pop(), 20);
  assert.equal(deque.pop(), 10);
  assert.equal(deque.pop(), undefined);
  assert.equal(deque.length, 0);
});

test('push + shift дают FIFO-поведение', () => {
  const deque = new Dequeue<number>(Array, 4);

  deque.push(1);
  deque.push(2);
  deque.push(3);

  assert.equal(deque.shift(), 1);
  assert.equal(deque.shift(), 2);
  assert.equal(deque.shift(), 3);
  assert.equal(deque.shift(), undefined);
  assert.equal(deque.length, 0);
});

test('unshift + pop дают FIFO-поведение с другой стороны', () => {
  const deque = new Dequeue<number>(Array, 4);

  deque.unshift(1);
  deque.unshift(2);
  deque.unshift(3);

  assert.equal(deque.pop(), 1);
  assert.equal(deque.pop(), 2);
  assert.equal(deque.pop(), 3);
  assert.equal(deque.pop(), undefined);
  assert.equal(deque.length, 0);
});

test('микс операций сохраняет корректный порядок', () => {
  const deque = new Dequeue<number>(Array, 4);

  deque.push(2); // [2]
  deque.push(3); // [2, 3]
  deque.unshift(1); // [1, 2, 3]
  deque.push(4); // [1, 2, 3, 4]

  assert.equal(deque.shift(), 1); // [2, 3, 4]
  assert.equal(deque.pop(), 4); // [2, 3]
  assert.equal(deque.pop(), 3); // [2]
  assert.equal(deque.shift(), 2); // []

  assert.equal(deque.length, 0);
  assert.equal(deque.shift(), undefined);
  assert.equal(deque.pop(), undefined);
});

test('пример из задания работает корректно', () => {
  const dequeue = new Dequeue<number>(Uint8Array, 64);

  assert.equal(dequeue.unshift(1), 1);
  assert.equal(dequeue.unshift(2), 2);
  assert.equal(dequeue.unshift(3), 3);

  assert.equal(dequeue.length, 3);
  assert.equal(dequeue.shift(), 3);

  assert.equal(dequeue.push(4), 3);
  assert.equal(dequeue.push(5), 4);
  assert.equal(dequeue.push(6), 5);

  assert.equal(dequeue.pop(), 6);
  assert.equal(dequeue.length, 4);
});

test('поддерживает обычный Array как хранилище блока', () => {
  const deque = new Dequeue<string>(Array, 4);

  deque.push('b');
  deque.unshift('a');
  deque.push('c');

  assert.equal(deque.shift(), 'a');
  assert.equal(deque.shift(), 'b');
  assert.equal(deque.shift(), 'c');
  assert.equal(deque.shift(), undefined);
});

test('поддерживает TypedArray как хранилище блока', () => {
  const deque = new Dequeue<number>(Uint8Array, 4);

  deque.push(255);
  deque.push(128);
  deque.unshift(7);

  assert.equal(deque.shift(), 7);
  assert.equal(deque.shift(), 255);
  assert.equal(deque.pop(), 128);
  assert.equal(deque.pop(), undefined);
});

test('создаёт новые блоки при push за пределы одного блока', () => {
  const deque = new Dequeue<number>(Array, 2);

  deque.push(1);
  deque.push(2);
  deque.push(3);
  deque.push(4);
  deque.push(5);

  assert.equal(deque.length, 5);

  assert.equal(deque.shift(), 1);
  assert.equal(deque.shift(), 2);
  assert.equal(deque.shift(), 3);
  assert.equal(deque.shift(), 4);
  assert.equal(deque.shift(), 5);
  assert.equal(deque.shift(), undefined);
  assert.equal(deque.length, 0);
});

test('создаёт новые блоки при unshift за пределы одного блока', () => {
  const deque = new Dequeue<number>(Array, 2);

  deque.unshift(1);
  deque.unshift(2);
  deque.unshift(3);
  deque.unshift(4);
  deque.unshift(5);

  assert.equal(deque.length, 5);

  assert.equal(deque.pop(), 1);
  assert.equal(deque.pop(), 2);
  assert.equal(deque.pop(), 3);
  assert.equal(deque.pop(), 4);
  assert.equal(deque.pop(), 5);
  assert.equal(deque.pop(), undefined);
  assert.equal(deque.length, 0);
});

test('работает при blockCapacity = 1', () => {
  const deque = new Dequeue<number>(Array, 1);

  deque.push(1);
  deque.push(2);
  deque.unshift(0);

  assert.equal(deque.length, 3);

  assert.equal(deque.shift(), 0);
  assert.equal(deque.pop(), 2);
  assert.equal(deque.pop(), 1);
  assert.equal(deque.pop(), undefined);
  assert.equal(deque.length, 0);
});

test('корректно переживает большое число операций', () => {
  const deque = new Dequeue<number>(Array, 16);

  for (let i = 0; i < 10_000; i += 1) {
    deque.push(i);
  }

  assert.equal(deque.length, 10_000);

  for (let i = 0; i < 5_000; i += 1) {
    assert.equal(deque.shift(), i);
  }

  for (let i = 0; i < 5_000; i += 1) {
    deque.unshift(-(i + 1));
  }

  assert.equal(deque.length, 10_000);

  assert.equal(deque.shift(), -5_000);
  assert.equal(deque.pop(), 9_999);
});

console.log('\nDequeue tests done');
