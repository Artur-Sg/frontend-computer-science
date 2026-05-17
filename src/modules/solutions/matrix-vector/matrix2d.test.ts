import { strict as assert } from 'node:assert';
import { Matrix2D } from './matrix2d';
import type { ElementView } from './types';

type NumberView = ElementView<number>;

const U8View: NumberView = {
  name: 'Uint8',

  bytesPerElement: 1,

  read(view: DataView, byteOffset: number): number {
    return view.getUint8(byteOffset);
  },

  write(view: DataView, byteOffset: number, value: number): void {
    view.setUint8(byteOffset, value);
  },
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

test('создание матрицы выделяет корректный буфер', () => {
  const matrix = new Matrix2D(2, 3, U8View);

  assert.equal(matrix.rows, 2);
  assert.equal(matrix.cols, 3);
  assert.equal(matrix.buffer.byteLength, 6);
  assert.equal(matrix.byteOffset, 0);
  assert.equal(matrix.byteLength, 6);
});

test('set/get по координатам работает', () => {
  const matrix = new Matrix2D(2, 3, U8View);

  matrix.set(1, 2, 42);

  assert.equal(matrix.get(1, 2), 42);
});

test('fill заполняет всю матрицу', () => {
  const matrix = new Matrix2D(2, 2, U8View);

  matrix.fill(7);

  assert.equal(matrix.get(0, 0), 7);
  assert.equal(matrix.get(0, 1), 7);
  assert.equal(matrix.get(1, 0), 7);
  assert.equal(matrix.get(1, 1), 7);
});

test('отрицательные индексы работают как доступ с конца', () => {
  const matrix = new Matrix2D(2, 2, U8View);

  matrix.set(-1, -1, 9);

  assert.equal(matrix.get(1, 1), 9);
  assert.equal(matrix.get(-1, -1), 9);
});

test('выход за границы выбрасывает RangeError', () => {
  const matrix = new Matrix2D(2, 2, U8View);

  assert.throws(() => matrix.get(2, 0), RangeError);
  assert.throws(() => matrix.get(0, 2), RangeError);
  assert.throws(() => matrix.get(-3, 0), RangeError);
  assert.throws(() => matrix.get(0, -3), RangeError);
});

test('матрица использует переданный typed array без копирования', () => {
  const source = new Uint8Array(4);
  const matrix = new Matrix2D(2, 2, U8View, source);

  matrix.set(1, 1, 255);

  assert.equal(source[3], 255);
});

test('матрица учитывает byteOffset переданного typed array', () => {
  const source = new Uint8Array(10);
  const slice = source.subarray(2, 6);

  const matrix = new Matrix2D(2, 2, U8View, slice);

  matrix.set(0, 0, 11);
  matrix.set(1, 1, 22);

  assert.equal(source[2], 11);
  assert.equal(source[5], 22);
});

test('слишком маленький источник выбрасывает RangeError', () => {
  const source = new Uint8Array(3);

  assert.throws(() => new Matrix2D(2, 2, U8View, source), RangeError);
});

test('view выбрасывает ошибку, если element view не поддерживает access', () => {
  const matrix = new Matrix2D(2, 2, U8View);

  assert.throws(() => matrix.view(0, 0), /покомпонентный доступ/);
});

test('некорректные размеры матрицы выбрасывают RangeError', () => {
  assert.throws(() => new Matrix2D(0, 2, U8View), RangeError);
  assert.throws(() => new Matrix2D(2, 0, U8View), RangeError);
  assert.throws(() => new Matrix2D(-1, 2, U8View), RangeError);
  assert.throws(() => new Matrix2D(2, -1, U8View), RangeError);
  assert.throws(() => new Matrix2D(1.5, 2, U8View), RangeError);
});

test('матрица использует переданный ArrayBuffer', () => {
  const buffer = new ArrayBuffer(4);
  const matrix = new Matrix2D(2, 2, U8View, buffer);
  const bytes = new Uint8Array(buffer);

  matrix.set(1, 1, 123);

  assert.equal(bytes[3], 123);
});

console.log('\nMatrix2D tests done');
