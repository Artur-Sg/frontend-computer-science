import { performance } from 'node:perf_hooks';
import { gzipSync } from 'node:zlib';
import { Matrix2D } from './matrix2d';
import { RGBAView, type RGBAAccess, type RGBAColor, type RGBAInput } from './rgba-view';

type Format = 'matrix2d-binary' | 'json-flat' | 'json-nested';

type Stats = {
  format: Format;
  rawBytes: number;
  gzipBytes: number;
  serializeMs: number;
  deserializeMs: number;
};

const SIZES = [
  { rows: 512, cols: 512 },
  { rows: 1024, cols: 1024 }
];

function fillMatrix(matrix: Matrix2D<RGBAColor, RGBAInput, RGBAAccess>): void {
  for (let row = 0; row < matrix.rows; row += 1) {
    for (let col = 0; col < matrix.cols; col += 1) {
      const r = (row + col) & 255;
      const g = (row * 3 + col * 5) & 255;
      const b = (row * 7 + col * 11) & 255;
      const a = 255;

      matrix.set(row, col, [r, g, b, a]);
    }
  }
}

function serializeBinaryCopy(matrix: Matrix2D<unknown>): Uint8Array {
  return new Uint8Array(matrix.buffer, matrix.byteOffset, matrix.byteLength).slice();
}

function deserializeBinary(
  rows: number,
  cols: number,
  bytes: Uint8Array
): Matrix2D<RGBAColor, RGBAInput, RGBAAccess> {
  return new Matrix2D(rows, cols, RGBAView, bytes);
}

function serializeJsonFlat(matrix: Matrix2D<RGBAColor, RGBAInput, RGBAAccess>): string {
  const data: number[] = new Array(matrix.rows * matrix.cols * 4);
  let index = 0;

  for (let row = 0; row < matrix.rows; row += 1) {
    for (let col = 0; col < matrix.cols; col += 1) {
      const [r, g, b, a] = matrix.get(row, col);

      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = a;
      index += 4;
    }
  }

  return JSON.stringify(data);
}

function deserializeJsonFlat(
  rows: number,
  cols: number,
  json: string
): Matrix2D<RGBAColor, RGBAInput, RGBAAccess> {
  const data = JSON.parse(json) as number[];
  const matrix = new Matrix2D(rows, cols, RGBAView);

  let index = 0;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      matrix.set(row, col, [
        data[index],
        data[index + 1],
        data[index + 2],
        data[index + 3]
      ]);

      index += 4;
    }
  }

  return matrix;
}

function serializeJsonNested(matrix: Matrix2D<RGBAColor, RGBAInput, RGBAAccess>): string {
  const rows: RGBAColor[][] = [];

  for (let row = 0; row < matrix.rows; row += 1) {
    const line: RGBAColor[] = [];

    for (let col = 0; col < matrix.cols; col += 1) {
      line.push(matrix.get(row, col));
    }

    rows.push(line);
  }

  return JSON.stringify(rows);
}

function deserializeJsonNested(json: string): Matrix2D<RGBAColor, RGBAInput, RGBAAccess> {
  const data = JSON.parse(json) as RGBAColor[][];

  const rows = data.length;
  const cols = data[0]?.length ?? 0;
  const matrix = new Matrix2D(rows, cols, RGBAView);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      matrix.set(row, col, data[row][col]);
    }
  }

  return matrix;
}

function bytesToMb(bytes: number): number {
  return bytes / (1024 * 1024);
}

function runForSize(rows: number, cols: number): Stats[] {
  const matrix = new Matrix2D(rows, cols, RGBAView);

  fillMatrix(matrix);

  const tBinSerStart = performance.now();
  const bin = serializeBinaryCopy(matrix);
  const tBinSer = performance.now() - tBinSerStart;

  const tBinDesStart = performance.now();
  const matrixFromBin = deserializeBinary(rows, cols, bin);
  const tBinDes = performance.now() - tBinDesStart;

  matrixFromBin.get(rows - 1, cols - 1);

  const tFlatSerStart = performance.now();
  const flatJson = serializeJsonFlat(matrix);
  const tFlatSer = performance.now() - tFlatSerStart;

  const tFlatDesStart = performance.now();
  const matrixFromFlat = deserializeJsonFlat(rows, cols, flatJson);
  const tFlatDes = performance.now() - tFlatDesStart;

  matrixFromFlat.get(rows - 1, cols - 1);

  const tNestedSerStart = performance.now();
  const nestedJson = serializeJsonNested(matrix);
  const tNestedSer = performance.now() - tNestedSerStart;

  const tNestedDesStart = performance.now();
  const matrixFromNested = deserializeJsonNested(nestedJson);
  const tNestedDes = performance.now() - tNestedDesStart;

  matrixFromNested.get(rows - 1, cols - 1);

  const enc = new TextEncoder();
  const flatBytes = enc.encode(flatJson);
  const nestedBytes = enc.encode(nestedJson);

  return [
    {
      format: 'matrix2d-binary',
      rawBytes: bin.byteLength,
      gzipBytes: gzipSync(bin).byteLength,
      serializeMs: tBinSer,
      deserializeMs: tBinDes
    },
    {
      format: 'json-flat',
      rawBytes: flatBytes.byteLength,
      gzipBytes: gzipSync(flatBytes).byteLength,
      serializeMs: tFlatSer,
      deserializeMs: tFlatDes
    },
    {
      format: 'json-nested',
      rawBytes: nestedBytes.byteLength,
      gzipBytes: gzipSync(nestedBytes).byteLength,
      serializeMs: tNestedSer,
      deserializeMs: tNestedDes
    }
  ];
}

function printTable(rows: number, cols: number, stats: Stats[]): void {
  console.log(`\n=== Matrix ${rows}x${cols} ===`);
  console.table(
    stats.map((s) => ({
      format: s.format,
      raw_mb: Number(bytesToMb(s.rawBytes).toFixed(2)),
      gzip_mb: Number(bytesToMb(s.gzipBytes).toFixed(2)),
      serialize_ms: Number(s.serializeMs.toFixed(2)),
      deserialize_ms: Number(s.deserializeMs.toFixed(2))
    }))
  );
}

function main(): void {
  console.log('Benchmark: Matrix2D binary vs JSON flat vs JSON nested');
  console.log('Binary format here stores only raw RGBA bytes (rows/cols are external metadata).');

  for (const size of SIZES) {
    const stats = runForSize(size.rows, size.cols);

    printTable(size.rows, size.cols, stats);
  }
}

main();
