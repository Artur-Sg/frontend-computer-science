// Лекция 05 — Примеры кода

function makeFlat(width, height) {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = i & 0xff;
  }
  return data;
}

function rowMajorSum(data, width, height) {
  let sum = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      sum += data[index];
    }
  }
  return sum;
}

function colMajorSum(data, width, height) {
  let sum = 0;
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const index = (y * width + x) * 4;
      sum += data[index];
    }
  }
  return sum;
}

const width = 1024;
const height = 1024;
const data = makeFlat(width, height);

console.time('row-major');
rowMajorSum(data, width, height);
console.timeEnd('row-major');

console.time('col-major');
colMajorSum(data, width, height);
console.timeEnd('col-major');

// Массив объектов vs typed array
const pixelsObjects = Array.from({ length: width * height }, (_, i) => ({
  r: i & 0xff,
  g: (i >> 8) & 0xff,
  b: (i >> 16) & 0xff,
  a: 255
}));

console.time('objects');
let acc = 0;
for (let i = 0; i < pixelsObjects.length; i += 1) {
  acc += pixelsObjects[i].r;
}
console.timeEnd('objects');

console.time('typed');
acc = 0;
for (let i = 0; i < data.length; i += 4) {
  acc += data[i];
}
console.timeEnd('typed');
