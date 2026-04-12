import { performance } from 'node:perf_hooks';
import { TraverseMode, type PixelStream, type RGBA } from './arrays/pixel-stream-base.interface';
import { TypedArray } from './arrays/typed-array';
import { FlatArray } from './arrays/flat-array';
import { ArrayOfArrays } from './arrays/array-of-arrays';
import { ArrayOfObjects } from './arrays/array-of-objects';

type Factory = (width: number, height: number) => PixelStream;

type Implementation = {
  name: string;
  create: Factory;
};

type Size = {
  width: number;
  height: number;
};

type BenchmarkResult = {
  implementation: string;
  mode: 'row-major' | 'col-major' | 'random';
  operation: 'forEach' | 'setPixel' | 'getPixel';
  width: number;
  height: number;
  warmupRuns: number;
  measureRuns: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  checksum: number;
};

const implementations: Implementation[] = [
  { name: 'typed-array', create: (w, h) => new TypedArray(w, h) },
  { name: 'flat-array', create: (w, h) => new FlatArray(w, h) },
  { name: 'array-of-arrays', create: (w, h) => new ArrayOfArrays(w, h) },
  { name: 'array-of-objects', create: (w, h) => new ArrayOfObjects(w, h) }
];

/**
 * Основные кейсы, которые покрывают идею лекции:
 * - маленький размер: почти нет заметной разницы
 * - средний: разница начинает проявляться
 * - большой: row-major обычно начинает выигрывать сильнее
 *
 * Квадратные изображения удобны для сравнения.
 */
const sizes: Size[] = [
  { width: 256, height: 256 },
  { width: 512, height: 512 },
  { width: 1024, height: 1024 },
  { width: 2048, height: 2048 },
];

/**
 * Количество прогревов:
 * нужно, чтобы JIT успел оптимизировать горячий код.
 */
const WARMUP_RUNS = 3;

/**
 * Количество измеряемых прогонов:
 * одного прогона мало, нужен хотя бы небольшой набор.
 */
const MEASURE_RUNS = 5;
const RANDOM_COORDS_CAP = 200_000;

/**
 * Заполняем поток не одинаковыми значениями, а псевдо-уникальными.
 * Это полезнее, чем константный цвет:
 * - меньше шанс получить "слишком пустой" сценарий
 * - checksum становится осмысленной
 */
function fillStream(stream: PixelStream, width: number, height: number): void {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const r = (x + y) & 255;
      const g = (x * 3 + y * 5) & 255;
      const b = (x * 7 + y * 11) & 255;
      const a = 255;

      stream.setPixel(x, y, [r, g, b, a]);
    }
  }
}

/**
 * Один прогон forEach.
 *
 * Почему нужен checksum:
 * если callback пустой, бенчмарк получается слишком искусственным.
 * Небольшая арифметика делает замер ближе к реальности.
 */
function runSingleForEach(stream: PixelStream, mode: TraverseMode): { ms: number; checksum: number } {
  let checksum = 0;

  const start = performance.now();

  stream.forEach(mode, (rgba) => {
    checksum += rgba[0] + rgba[1] + rgba[2] + rgba[3];
  });

  const ms = performance.now() - start;

  return { ms, checksum };
}

function runSingleWrite(
  stream: PixelStream,
  width: number,
  height: number,
  mode: TraverseMode
): { ms: number; checksum: number } {
  let checksum = 0;
  const start = performance.now();

  if (mode === TraverseMode.RowMajor) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const r = (x + y) & 255;
        const g = (x * 3 + y * 5) & 255;
        const b = (x * 7 + y * 11) & 255;
        const a = 255;

        checksum += r + g + b + a;
        stream.setPixel(x, y, [r, g, b, a]);
      }
    }
  } else {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const r = (x + y) & 255;
        const g = (x * 3 + y * 5) & 255;
        const b = (x * 7 + y * 11) & 255;
        const a = 255;

        checksum += r + g + b + a;
        stream.setPixel(x, y, [r, g, b, a]);
      }
    }
  }

  const ms = performance.now() - start;

  return { ms, checksum };
}

function runSingleSequentialRead(
  stream: PixelStream,
  width: number,
  height: number,
  mode: TraverseMode
): { ms: number; checksum: number } {
  let checksum = 0;
  const start = performance.now();

  if (mode === TraverseMode.RowMajor) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const rgba = stream.getPixel(x, y);

        checksum += rgba[0] + rgba[1] + rgba[2] + rgba[3];
      }
    }
  } else {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const rgba = stream.getPixel(x, y);

        checksum += rgba[0] + rgba[1] + rgba[2] + rgba[3];
      }
    }
  }

  const ms = performance.now() - start;

  return { ms, checksum };
}

function runSingleRandomRead(
  stream: PixelStream,
  coords: Array<[number, number]>
): { ms: number; checksum: number } {
  let checksum = 0;
  const start = performance.now();

  for (const [x, y] of coords) {
    const rgba = stream.getPixel(x, y);

    checksum += rgba[0] + rgba[1] + rgba[2] + rgba[3];
  }

  const ms = performance.now() - start;

  return { ms, checksum };
}

/**
 * Прогрев + несколько измерений + агрегация результатов.
 */
function measureForEach(stream: PixelStream, mode: TraverseMode): {
  avgMs: number;
  minMs: number;
  maxMs: number;
  checksum: number;
} {
  // Прогрев
  for (let i = 0; i < WARMUP_RUNS; i++) {
    runSingleForEach(stream, mode);
  }

  const times: number[] = [];
  let checksum = 0;

  // Измеряемые прогоны
  for (let i = 0; i < MEASURE_RUNS; i++) {
    const result = runSingleForEach(stream, mode);

    times.push(result.ms);
    checksum = result.checksum;
  }

  const sum = times.reduce((acc, value) => acc + value, 0);
  const avgMs = sum / times.length;
  const minMs = Math.min(...times);
  const maxMs = Math.max(...times);

  return {
    avgMs,
    minMs,
    maxMs,
    checksum
  };
}

function measureWrite(
  stream: PixelStream,
  width: number,
  height: number,
  mode: TraverseMode
): {
  avgMs: number;
  minMs: number;
  maxMs: number;
  checksum: number;
} {
  for (let i = 0; i < WARMUP_RUNS; i++) {
    runSingleWrite(stream, width, height, mode);
  }

  const times: number[] = [];
  let checksum = 0;

  for (let i = 0; i < MEASURE_RUNS; i++) {
    const result = runSingleWrite(stream, width, height, mode);

    times.push(result.ms);
    checksum = result.checksum;
  }

  const sum = times.reduce((acc, value) => acc + value, 0);
  const avgMs = sum / times.length;
  const minMs = Math.min(...times);
  const maxMs = Math.max(...times);

  return {
    avgMs,
    minMs,
    maxMs,
    checksum
  };
}

function measureSequentialRead(
  stream: PixelStream,
  width: number,
  height: number,
  mode: TraverseMode
): {
  avgMs: number;
  minMs: number;
  maxMs: number;
  checksum: number;
} {
  for (let i = 0; i < WARMUP_RUNS; i++) {
    runSingleSequentialRead(stream, width, height, mode);
  }

  const times: number[] = [];
  let checksum = 0;

  for (let i = 0; i < MEASURE_RUNS; i++) {
    const result = runSingleSequentialRead(stream, width, height, mode);

    times.push(result.ms);
    checksum = result.checksum;
  }

  const sum = times.reduce((acc, value) => acc + value, 0);
  const avgMs = sum / times.length;
  const minMs = Math.min(...times);
  const maxMs = Math.max(...times);

  return {
    avgMs,
    minMs,
    maxMs,
    checksum
  };
}

function measureRandomRead(
  stream: PixelStream,
  coords: Array<[number, number]>
): {
  avgMs: number;
  minMs: number;
  maxMs: number;
  checksum: number;
} {
  for (let i = 0; i < WARMUP_RUNS; i++) {
    runSingleRandomRead(stream, coords);
  }

  const times: number[] = [];
  let checksum = 0;

  for (let i = 0; i < MEASURE_RUNS; i++) {
    const result = runSingleRandomRead(stream, coords);

    times.push(result.ms);
    checksum = result.checksum;
  }

  const sum = times.reduce((acc, value) => acc + value, 0);
  const avgMs = sum / times.length;
  const minMs = Math.min(...times);
  const maxMs = Math.max(...times);

  return {
    avgMs,
    minMs,
    maxMs,
    checksum
  };
}

function buildRandomCoords(width: number, height: number, count: number): Array<[number, number]> {
  const coords: Array<[number, number]> = [];

  let seed = 123456789;
  const next = (): number => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;

    return seed >>> 0;
  };

  for (let i = 0; i < count; i++) {
    const x = next() % width;
    const y = next() % height;

    coords.push([x, y]);
  }

  return coords;
}

function benchmarkOneImplementation(
  implementation: Implementation,
  size: Size,
  randomCoords: Array<[number, number]>
): BenchmarkResult[] {
  const stream = implementation.create(size.width, size.height);

  fillStream(stream, size.width, size.height);

  const row = measureForEach(stream, TraverseMode.RowMajor);
  const col = measureForEach(stream, TraverseMode.ColMajor);
  const rowWrite = measureWrite(stream, size.width, size.height, TraverseMode.RowMajor);
  const colWrite = measureWrite(stream, size.width, size.height, TraverseMode.ColMajor);
  const rowRead = measureSequentialRead(stream, size.width, size.height, TraverseMode.RowMajor);
  const colRead = measureSequentialRead(stream, size.width, size.height, TraverseMode.ColMajor);
  const randomRead = measureRandomRead(stream, randomCoords);

  return [
    {
      implementation: implementation.name,
      operation: 'forEach',
      mode: 'row-major',
      width: size.width,
      height: size.height,
      warmupRuns: WARMUP_RUNS,
      measureRuns: MEASURE_RUNS,
      avgMs: row.avgMs,
      minMs: row.minMs,
      maxMs: row.maxMs,
      checksum: row.checksum
    },
    {
      implementation: implementation.name,
      operation: 'forEach',
      mode: 'col-major',
      width: size.width,
      height: size.height,
      warmupRuns: WARMUP_RUNS,
      measureRuns: MEASURE_RUNS,
      avgMs: col.avgMs,
      minMs: col.minMs,
      maxMs: col.maxMs,
      checksum: col.checksum
    },
    {
      implementation: implementation.name,
      operation: 'setPixel',
      mode: 'row-major',
      width: size.width,
      height: size.height,
      warmupRuns: WARMUP_RUNS,
      measureRuns: MEASURE_RUNS,
      avgMs: rowWrite.avgMs,
      minMs: rowWrite.minMs,
      maxMs: rowWrite.maxMs,
      checksum: rowWrite.checksum
    },
    {
      implementation: implementation.name,
      operation: 'setPixel',
      mode: 'col-major',
      width: size.width,
      height: size.height,
      warmupRuns: WARMUP_RUNS,
      measureRuns: MEASURE_RUNS,
      avgMs: colWrite.avgMs,
      minMs: colWrite.minMs,
      maxMs: colWrite.maxMs,
      checksum: colWrite.checksum
    },
    {
      implementation: implementation.name,
      operation: 'getPixel',
      mode: 'row-major',
      width: size.width,
      height: size.height,
      warmupRuns: WARMUP_RUNS,
      measureRuns: MEASURE_RUNS,
      avgMs: rowRead.avgMs,
      minMs: rowRead.minMs,
      maxMs: rowRead.maxMs,
      checksum: rowRead.checksum
    },
    {
      implementation: implementation.name,
      operation: 'getPixel',
      mode: 'col-major',
      width: size.width,
      height: size.height,
      warmupRuns: WARMUP_RUNS,
      measureRuns: MEASURE_RUNS,
      avgMs: colRead.avgMs,
      minMs: colRead.minMs,
      maxMs: colRead.maxMs,
      checksum: colRead.checksum
    },
    {
      implementation: implementation.name,
      operation: 'getPixel',
      mode: 'random',
      width: size.width,
      height: size.height,
      warmupRuns: WARMUP_RUNS,
      measureRuns: MEASURE_RUNS,
      avgMs: randomRead.avgMs,
      minMs: randomRead.minMs,
      maxMs: randomRead.maxMs,
      checksum: randomRead.checksum
    }
  ];
}

function runBenchmarkSuite(): BenchmarkResult[] {
  const results: BenchmarkResult[] = [];

  for (let sizeIndex = 0; sizeIndex < sizes.length; sizeIndex += 1) {
    const size = sizes[sizeIndex];
    const randomCount = Math.min(size.width * size.height, RANDOM_COORDS_CAP);
    const randomCoords = buildRandomCoords(size.width, size.height, randomCount);

    for (const implementation of implementations) {
      const partial = benchmarkOneImplementation(implementation, size, randomCoords);

      results.push(...partial);
    }
  }

  return results;
}

function printResults(results: BenchmarkResult[]): void {
  const line = '='.repeat(90);
  const separator = '-'.repeat(90);
  const sizeDivider = '_'.repeat(90);
  const formatMs = (value: number): string => value.toFixed(2).padStart(8);

  console.log(line);
  console.log('Бенчмарк PixelStream');
  console.log(`Warmup: ${WARMUP_RUNS} run(s), Measure: ${MEASURE_RUNS} run(s)`);
  console.log(`Sizes: ${sizes.map((s) => `${s.width}x${s.height}`).join(', ')}`);
  console.log(
    'Notes: "col/row" — насколько Column-major медленнее Row-major (1.00x = одинаково).'
  );
  console.log(separator);
  console.log(
    [
      'реализация'.padEnd(18),
      'размер'.padEnd(10),
      'операция'.padEnd(10),
      'режим'.padEnd(10),
      'ср. мс'.padStart(8),
      'мин'.padStart(8),
      'макс'.padStart(8),
      'col/row'.padStart(10)
    ].join(' ')
  );
  console.log(separator);

  for (let sizeIndex = 0; sizeIndex < sizes.length; sizeIndex += 1) {
    const size = sizes[sizeIndex];

    for (const implementation of implementations) {
      const row = results.find(
        (r) =>
          r.implementation === implementation.name &&
          r.operation === 'forEach' &&
          r.width === size.width &&
          r.height === size.height &&
          r.mode === 'row-major'
      );

      const col = results.find(
        (r) =>
          r.implementation === implementation.name &&
          r.operation === 'forEach' &&
          r.width === size.width &&
          r.height === size.height &&
          r.mode === 'col-major'
      );

      const rowWrite = results.find(
        (r) =>
          r.implementation === implementation.name &&
          r.operation === 'setPixel' &&
          r.width === size.width &&
          r.height === size.height &&
          r.mode === 'row-major'
      );

      const colWrite = results.find(
        (r) =>
          r.implementation === implementation.name &&
          r.operation === 'setPixel' &&
          r.width === size.width &&
          r.height === size.height &&
          r.mode === 'col-major'
      );

      const rowRead = results.find(
        (r) =>
          r.implementation === implementation.name &&
          r.operation === 'getPixel' &&
          r.width === size.width &&
          r.height === size.height &&
          r.mode === 'row-major'
      );

      const colRead = results.find(
        (r) =>
          r.implementation === implementation.name &&
          r.operation === 'getPixel' &&
          r.width === size.width &&
          r.height === size.height &&
          r.mode === 'col-major'
      );

      const randomRead = results.find(
        (r) =>
          r.implementation === implementation.name &&
          r.operation === 'getPixel' &&
          r.width === size.width &&
          r.height === size.height &&
          r.mode === 'random'
      );

      if (!row || !col || !rowWrite || !colWrite || !rowRead || !colRead || !randomRead) {
        continue;
      }

      const ratio = col.avgMs / row.avgMs;
      const writeRatio = colWrite.avgMs / rowWrite.avgMs;
      const readRatio = colRead.avgMs / rowRead.avgMs;
      const sizeLabel = `${size.width}x${size.height}`;

      console.log(
        [
          implementation.name.padEnd(18),
          sizeLabel.padEnd(10),
          'forEach'.padEnd(10),
          'row-major'.padEnd(10),
          formatMs(row.avgMs),
          formatMs(row.minMs),
          formatMs(row.maxMs),
          '-'.padStart(10)
        ].join(' ')
      );

      console.log(
        [
          ''.padEnd(18),
          ''.padEnd(10),
          ''.padEnd(10),
          'col-major'.padEnd(10),
          formatMs(col.avgMs),
          formatMs(col.minMs),
          formatMs(col.maxMs),
          `${ratio.toFixed(2)}x`.padStart(10)
        ].join(' ')
      );

      console.log(
        [
          ''.padEnd(18),
          ''.padEnd(10),
          'setPixel'.padEnd(10),
          'row-major'.padEnd(10),
          formatMs(rowWrite.avgMs),
          formatMs(rowWrite.minMs),
          formatMs(rowWrite.maxMs),
          '-'.padStart(10)
        ].join(' ')
      );

      console.log(
        [
          ''.padEnd(18),
          ''.padEnd(10),
          ''.padEnd(10),
          'col-major'.padEnd(10),
          formatMs(colWrite.avgMs),
          formatMs(colWrite.minMs),
          formatMs(colWrite.maxMs),
          `${writeRatio.toFixed(2)}x`.padStart(10)
        ].join(' ')
      );

      console.log(
        [
          ''.padEnd(18),
          ''.padEnd(10),
          'getPixel'.padEnd(10),
          'row-major'.padEnd(10),
          formatMs(rowRead.avgMs),
          formatMs(rowRead.minMs),
          formatMs(rowRead.maxMs),
          '-'.padStart(10)
        ].join(' ')
      );

      console.log(
        [
          ''.padEnd(18),
          ''.padEnd(10),
          ''.padEnd(10),
          'col-major'.padEnd(10),
          formatMs(colRead.avgMs),
          formatMs(colRead.minMs),
          formatMs(colRead.maxMs),
          `${readRatio.toFixed(2)}x`.padStart(10)
        ].join(' ')
      );

      console.log(
        [
          ''.padEnd(18),
          ''.padEnd(10),
          'getPixel'.padEnd(10),
          'random'.padEnd(10),
          formatMs(randomRead.avgMs),
          formatMs(randomRead.minMs),
          formatMs(randomRead.maxMs),
          '-'.padStart(10)
        ].join(' ')
      );

      console.log('');
    }

    if (sizeIndex < sizes.length - 1) {
      console.log(sizeDivider);
      console.log('');
    }
  }

  console.log(line);
}

function main(): void {
  const results = runBenchmarkSuite();

  printResults(results);
}

main();
