import { strict as assert } from 'node:assert';
import { Vector } from './vector';
import type { ElementView } from './types';

const U8Codec: ElementView<number> = {
  bytesPerElement: 1,

  read(view, byteOffset) {
    return view.getUint8(byteOffset);
  },

  write(view, byteOffset, value) {
    view.setUint8(byteOffset, value);
  }
};

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✔ ${name}`);
  } catch (error) {
    console.error(`✘ ${name}`);
    throw error;
  }
}

test('вектор хранит capacity и length в заголовке', () => {
  const v = new Vector(8, U8Codec);

  assert.equal(v.capacity, 8);
  assert.equal(v.length, 0);
});

test('push увеличивает length и пишет значение', () => {
  const v = new Vector(4, U8Codec);

  v.push(10);
  assert.equal(v.length, 1);
  assert.equal(v.get(0), 10);
});

test('pop возвращает последний элемент и уменьшает length', () => {
  const v = new Vector(4, U8Codec);

  v.push(1);
  v.push(2);
  assert.equal(v.pop(), 2);
  assert.equal(v.length, 1);
});

test('set/get работают по индексу', () => {
  const v = new Vector(4, U8Codec);

  v.push(1);
  v.push(2);
  v.set(1, 99);
  assert.equal(v.get(1), 99);
});

test('reserve гарантирует дополнительную ёмкость от текущей длины', () => {
  const v = new Vector(2, U8Codec);

  v.push(1);
  v.push(2);
  v.reserve(10);

  assert.ok(v.capacity >= 12);
  assert.equal(v.length, 2);
  assert.equal(v.get(0), 1);
  assert.equal(v.get(1), 2);
});

test('shrinkToFit уменьшает буфер до фактической длины', () => {
  const v = new Vector(16, U8Codec);

  v.push(1);
  v.push(2);
  v.push(3);
  v.shrinkToFit();

  assert.equal(v.capacity, 3);
  assert.equal(v.length, 3);
});

test('shift удаляет первый элемент', () => {
  const v = new Vector(4, U8Codec);

  v.push(10);
  v.push(20);
  v.push(30);

  assert.equal(v.shift(), 10);
  assert.equal(v.length, 2);
  assert.equal(v.get(0), 20);
  assert.equal(v.get(1), 30);
});

test('unshift добавляет элемент в начало', () => {
  const v = new Vector(2, U8Codec);

  v.push(20);
  v.push(30);
  v.unshift(10);

  assert.equal(v.length, 3);
  assert.equal(v.get(0), 10);
  assert.equal(v.get(1), 20);
  assert.equal(v.get(2), 30);
});

test('shift/unshift корректно работают с source byteOffset', () => {
  const original = new Vector(4, U8Codec);

  original.push(20);
  original.push(30);

  const outer = new Uint8Array(original.byteLength + 4);

  outer.set(new Uint8Array(original.buffer), 2);

  const slice = outer.subarray(2, 2 + original.byteLength);
  const vector = new Vector(0, U8Codec, slice);

  vector.unshift(10);

  assert.equal(vector.get(0), 10);
  assert.equal(vector.get(1), 20);
  assert.equal(vector.get(2), 30);

  assert.equal(vector.shift(), 10);
  assert.equal(vector.get(0), 20);
  assert.equal(vector.get(1), 30);
});

console.log('\nVector tests done');
