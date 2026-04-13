import { performance } from 'node:perf_hooks';
import { CircularBuffer } from './circular-buffer';

type Operation = 'push' | 'pop' | 'unshift' | 'shift';

type Result = {
  size: number;
  operation: Operation;
  avgMs: number;
  minMs: number;
  maxMs: number;
};

const OPS_COUNT = 100_000;
const SIZES = [100, 1_000, 10_000, 100_000];
const OPERATIONS: Operation[] = ['push', 'pop', 'unshift', 'shift'];
const WARMUP_RUNS = 5;
const MEASURE_RUNS = 5;
let sink = 0;

function fillBuffer(buf: CircularBuffer<number>, length: number): void {
  for (let i = 0; i < length; i++) {
    buf.push(i);
  }
}

function runOnce(size: number, operation: Operation): number {
  const baseLength = operation === 'pop' || operation === 'shift'
    ? size + OPS_COUNT
    : size;

  const buf = new CircularBuffer<number>(Math.max(8, size));

  fillBuffer(buf, baseLength);
  const start = performance.now();

  switch (operation) {
    case 'push':
      for (let i = 0; i < OPS_COUNT; i++) {
        buf.push(i);
      }
      break;
    case 'pop':
      for (let i = 0; i < OPS_COUNT; i++) {
        buf.pop();
      }
      break;
    case 'unshift':
      for (let i = 0; i < OPS_COUNT; i++) {
        buf.unshift(i);
      }
      break;
    case 'shift':
      for (let i = 0; i < OPS_COUNT; i++) {
        buf.shift();
      }
      break;
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  sink += buf.length;

  return performance.now() - start;
}

function measure(size: number, operation: Operation): Result {
  for (let i = 0; i < WARMUP_RUNS; i++) {
    runOnce(size, operation);
  }

  const times: number[] = [];

  for (let i = 0; i < MEASURE_RUNS; i++) {
    times.push(runOnce(size, operation));
  }

  const sum = times.reduce((acc, value) => acc + value, 0);
  const avgMs = sum / times.length;
  const minMs = Math.min(...times);
  const maxMs = Math.max(...times);

  return { size, operation, avgMs, minMs, maxMs };
}

function runBenchmark(): Result[] {
  const results: Result[] = [];

  for (const size of SIZES) {
    for (const operation of OPERATIONS) {
      results.push(measure(size, operation));
    }
  }

  return results;
}

function printResults(results: Result[]): void {
  const line = '='.repeat(86);
  const separator = '-'.repeat(86);
  const formatMs = (value: number): string => value.toFixed(2).padStart(8);

  console.log(line);
  console.log('Бенчмарк: CircularBuffer (100 000 операций)');
  console.log('Sizes:', SIZES.join(', '));
  console.log('Ops: push, pop, unshift, shift');
  console.log(`Warmup: ${WARMUP_RUNS}, Measure: ${MEASURE_RUNS}`);
  console.log(separator);
  console.log(
    [
      'size'.padEnd(8),
      'op'.padEnd(8),
      'avg ms'.padStart(8),
      'min'.padStart(8),
      'max'.padStart(8)
    ].join(' ')
  );
  console.log(separator);

  for (const result of results) {
    console.log(
      [
        String(result.size).padEnd(8),
        result.operation.padEnd(8),
        formatMs(result.avgMs),
        formatMs(result.minMs),
        formatMs(result.maxMs)
      ].join(' ')
    );
  }

  console.log(line);
}

printResults(runBenchmark());
