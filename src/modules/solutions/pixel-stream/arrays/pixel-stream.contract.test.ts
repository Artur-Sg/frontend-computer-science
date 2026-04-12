import assert from 'node:assert/strict';
import { TraverseMode, type PixelStream, type RGBA } from './pixel-stream-base.interface';
import { TypedArray } from './typed-array';
import { FlatArray } from './flat-array';
import { ArrayOfArrays } from './array-of-arrays';
import { ArrayOfObjects } from './array-of-objects';

type Factory = (width: number, height: number) => PixelStream;

type Implementation = {
  name: string;
  create: Factory;
};

const implementations: Implementation[] = [
  { name: 'TypedArray', create: (w, h) => new TypedArray(w, h) },
  { name: 'FlatArray', create: (w, h) => new FlatArray(w, h) },
  { name: 'ArrayOfArrays', create: (w, h) => new ArrayOfArrays(w, h) },
  { name: 'ArrayOfObjects', create: (w, h) => new ArrayOfObjects(w, h) }
];

const sampleA: RGBA = [10, 20, 30, 255];
const sampleB: RGBA = [5, 15, 25, 35];
const sampleC: RGBA = [99, 1, 2, 3];

function expectDeepEqual(actual: RGBA, expected: RGBA, message: string): void {
  assert.deepEqual(actual, expected, message);
}

function expectThrows(fn: () => void, message: string): void {
  assert.throws(fn, RangeError, message);
}

function fillUniquePixels(stream: PixelStream, width: number, height: number): void {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const id = y * width + x;

      stream.setPixel(x, y, [id, 0, 0, 255]);
    }
  }
}

function runContract(name: string, create: Factory): void {
  // === Конструктор ===
  create(1, 1);
  create(2, 2);
  create(3, 2);

  expectThrows(() => create(0, 1), `${name}: width=0 должен бросать RangeError`);
  expectThrows(() => create(1, 0), `${name}: height=0 должен бросать RangeError`);
  expectThrows(() => create(-1, 1), `${name}: width<0 должен бросать RangeError`);
  expectThrows(() => create(1, -1), `${name}: height<0 должен бросать RangeError`);

  // === setPixel + getPixel ===
  {
    const stream = create(2, 2);

    stream.setPixel(0, 0, sampleA);
    expectDeepEqual(stream.getPixel(0, 0), sampleA, `${name}: set/get (0,0)`);
  }

  // === Несколько независимых пикселей ===
  {
    const stream = create(2, 2);

    stream.setPixel(0, 0, sampleA);
    stream.setPixel(1, 0, sampleB);
    stream.setPixel(0, 1, sampleC);

    expectDeepEqual(stream.getPixel(0, 0), sampleA, `${name}: пиксели не должны затираться (0,0)`);
    expectDeepEqual(stream.getPixel(1, 0), sampleB, `${name}: пиксели не должны затираться (1,0)`);
    expectDeepEqual(stream.getPixel(0, 1), sampleC, `${name}: пиксели не должны затираться (0,1)`);
  }

  // === Последний пиксель ===
  {
    const stream = create(3, 2);

    stream.setPixel(2, 1, sampleB);
    expectDeepEqual(stream.getPixel(2, 1), sampleB, `${name}: последний пиксель (2,1)`);
  }

  // === Повторная запись ===
  {
    const stream = create(2, 2);

    stream.setPixel(1, 1, sampleA);
    stream.setPixel(1, 1, sampleC);
    expectDeepEqual(stream.getPixel(1, 1), sampleC, `${name}: повторная запись перезаписывает`);
  }

  // === Границы координат ===
  {
    const stream = create(2, 2);

    expectThrows(() => stream.getPixel(-1, 0), `${name}: getPixel x<0`);
    expectThrows(() => stream.getPixel(0, -1), `${name}: getPixel y<0`);
    expectThrows(() => stream.getPixel(2, 0), `${name}: getPixel x>=width`);
    expectThrows(() => stream.getPixel(0, 2), `${name}: getPixel y>=height`);

    expectThrows(() => stream.setPixel(-1, 0, sampleA), `${name}: setPixel x<0`);
    expectThrows(() => stream.setPixel(0, -1, sampleA), `${name}: setPixel y<0`);
    expectThrows(() => stream.setPixel(2, 0, sampleA), `${name}: setPixel x>=width`);
    expectThrows(() => stream.setPixel(0, 2, sampleA), `${name}: setPixel y>=height`);
  }

  // === forEach: порядок обхода ===
  {
    const width = 3;
    const height = 2;
    const stream = create(width, height);

    fillUniquePixels(stream, width, height);

    const rowOrder: Array<[number, number, number]> = [];

    stream.forEach(TraverseMode.RowMajor, (rgba, x, y) => {
      rowOrder.push([x, y, rgba[0]]);
    });

    const expectedRow: Array<[number, number, number]> = [
      [0, 0, 0],
      [1, 0, 1],
      [2, 0, 2],
      [0, 1, 3],
      [1, 1, 4],
      [2, 1, 5]
    ];

    assert.deepEqual(rowOrder, expectedRow, `${name}: порядок RowMajor`);
  }

  {
    const width = 3;
    const height = 2;
    const stream = create(width, height);

    fillUniquePixels(stream, width, height);

    const colOrder: Array<[number, number, number]> = [];

    stream.forEach(TraverseMode.ColMajor, (rgba, x, y) => {
      colOrder.push([x, y, rgba[0]]);
    });

    const expectedCol: Array<[number, number, number]> = [
      [0, 0, 0],
      [0, 1, 3],
      [1, 0, 1],
      [1, 1, 4],
      [2, 0, 2],
      [2, 1, 5]
    ];

    assert.deepEqual(colOrder, expectedCol, `${name}: порядок ColMajor`);
  }

  // === forEach: количество вызовов ===
  {
    const width = 3;
    const height = 2;
    const stream = create(width, height);
    let count = 0;

    stream.forEach(TraverseMode.RowMajor, () => {
      count += 1;
    });
    assert.equal(count, width * height, `${name}: forEach RowMajor count`);

    count = 0;
    stream.forEach(TraverseMode.ColMajor, () => {
      count += 1;
    });
    assert.equal(count, width * height, `${name}: forEach ColMajor count`);
  }
}

for (const impl of implementations) {
  runContract(impl.name, impl.create);
}

console.log('OK: PixelStream тесты пройдены');
