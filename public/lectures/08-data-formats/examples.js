// Лекция 08 — Примеры кода

import * as fs from 'node:fs';
import * as zlib from 'node:zlib';
import * as readline from 'node:readline';

// 1) Текст это байты
const text = 'hello мир';
const utf8 = new TextEncoder().encode(text);
console.log('chars:', text.length, 'bytes:', utf8.length);

// 2) Размер исходных данных и gzip
function fileStats(path) {
  const raw = fs.readFileSync(path);
  const gz = zlib.gzipSync(raw);
  return { raw: raw.byteLength, gzip: gz.byteLength };
}

// 3) Потоковое чтение CSV (без кавычек)
export async function parseCsvStream(path, sep = ',') {
  const rows = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(path),
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    rows.push(line.split(sep));
  }

  return rows;
}

// 4) Нативный JSON.parse (целиком)
export function parseJsonWhole(path) {
  const textData = fs.readFileSync(path, 'utf8');
  return JSON.parse(textData);
}

// 5) Пример сравнения размеров
// console.log('csv:', fileStats('./dataset.csv'));
// console.log('json:', fileStats('./dataset.json'));
