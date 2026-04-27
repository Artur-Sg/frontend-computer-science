import { performance } from 'node:perf_hooks';

import { encodeStrings as encodeBasic } from './utf8-strings-basic';
import { encodeStrings as encodePointers } from './utf8-strings-pointers';

const SIZES = [10, 50, 100, 500, 1000, 5000, 10000];
const ITERATIONS = 5000;
const WARMUP = 1000;

function createStrings(size: number): string[] {
  return Array.from({ length: size }, (_, i) => {
    if (i % 10 === 0) {return '';}
    if (i % 10 === 1) {return 'мир';}
    if (i % 10 === 2) {return '🙂';}

    return `string-${i}`;
  });
}

function measure(fn: () => unknown) {
  for (let i = 0; i < WARMUP; i++) {fn();}

  globalThis.gc?.();

  const times: number[] = [];

  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();

    fn();
    times.push((performance.now() - start) * 1000);
  }

  times.sort((a, b) => a - b);

  return {
    mean: times.reduce((a, b) => a + b, 0) / times.length,
    p50: times[Math.floor(times.length * 0.5)],
    p95: times[Math.floor(times.length * 0.95)],
  };
}

function format(n: number): string {
  return n.toFixed(2).padStart(10);
}

function runCase(label: string, getIndex: (size: number) => number) {
  console.log(`\n${  '='.repeat(90)}`);
  console.log(`AT: ${label}`);
  console.log('='.repeat(90));
  console.log('+----------+---------------+------------+------------+------------+------------+');
  console.log('| Size     | Impl          | Mean mks   | P50 mks    | P95 mks    | Ratio      |');
  console.log('+----------+---------------+------------+------------+------------+------------+');

  for (const size of SIZES) {
    const strings = createStrings(size);
    const basic = encodeBasic(strings);
    const pointers = encodePointers(strings);
    const index = getIndex(size);

    const basicStats = measure(() => basic.at(index));
    const pointerStats = measure(() => pointers.at(index));

    const ratio = basicStats.mean / pointerStats.mean;

    console.log(
      `| ${String(size).padEnd(8)} | ${'basic'.padEnd(13)} | ${format(basicStats.mean)} | ${format(basicStats.p50)} | ${format(basicStats.p95)} | ${'1.00x'.padEnd(10)} |`,
    );

    console.log(
      `| ${String(size).padEnd(8)} | ${'pointers'.padEnd(13)} | ${format(pointerStats.mean)} | ${format(pointerStats.p50)} | ${format(pointerStats.p95)} | ${`${ratio.toFixed(2)}x`.padEnd(10)} |`,
    );

    console.log('+----------+---------------+------------+------------+------------+------------+');
  }
}

console.log('\nUTF-8 strings at(index) benchmark');
console.log(`Iterations: ${ITERATIONS}`);
console.log(`Warmup: ${WARMUP}`);
console.log('Units: microseconds');

runCase('at(0)', () => 0);
runCase('at(mid)', (size) => Math.floor(size / 2));
runCase('at(-1)', () => -1);

console.log(`
Вывод:
- basic.at(0) быстрый, потому что нужная строка лежит сразу после count.
- basic.at(mid) и basic.at(-1) замедляются с ростом массива, потому что нужно пройти предыдущие строки.
- pointers.at(index) почти не зависит от позиции, потому что сразу вычисляет entryOffset = 4 + index * 8.
- Сложность basic.at(index): O(index) + декодирование строки.
- Сложность pointers.at(index): O(1) + декодирование строки.
`);
