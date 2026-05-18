import { performance } from 'node:perf_hooks';
import { Dequeue } from './dequeue';
import { ReallocDequeue } from './realloc-dequeue';

type ScenarioResult = {
  scenario: string;
  blocksMs: number;
  reallocMs: number;
  ratioReallocOverBlocks: number;
  checksumBlocks: number;
  checksumRealloc: number;
};

const WARMUP = 2;
const RUNS = 5;

function avg(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function measure(fn: () => number): { ms: number; checksum: number } {
  let checksum = 0;
  const start = performance.now();

  checksum = fn();

  return { ms: performance.now() - start, checksum };
}

function runPushPopBlocks(n: number): number {
  const dq = new Dequeue<number>(Array, 64);
  let checksum = 0;

  for (let i = 0; i < n; i += 1) {
    dq.push(i);
  }
  for (let i = 0; i < n; i += 1) {
    checksum += dq.pop() ?? 0;
  }

  return checksum;
}

function runPushPopRealloc(n: number): number {
  const dq = new ReallocDequeue<number>(64);
  let checksum = 0;

  for (let i = 0; i < n; i += 1) {
    dq.push(i);
  }
  for (let i = 0; i < n; i += 1) {
    checksum += dq.pop() ?? 0;
  }

  return checksum;
}

function runUnshiftShiftBlocks(n: number): number {
  const dq = new Dequeue<number>(Array, 64);
  let checksum = 0;

  for (let i = 0; i < n; i += 1) {
    dq.unshift(i);
  }
  for (let i = 0; i < n; i += 1) {
    checksum += dq.shift() ?? 0;
  }

  return checksum;
}

function runUnshiftShiftRealloc(n: number): number {
  const dq = new ReallocDequeue<number>(64);
  let checksum = 0;

  for (let i = 0; i < n; i += 1) {
    dq.unshift(i);
  }
  for (let i = 0; i < n; i += 1) {
    checksum += dq.shift() ?? 0;
  }

  return checksum;
}

function runMixedBlocks(n: number): number {
  const dq = new Dequeue<number>(Array, 64);
  let checksum = 0;

  for (let i = 0; i < n; i += 1) {
    dq.push(i);
    dq.unshift(-i);
  }

  for (let i = 0; i < n; i += 1) {
    checksum += dq.pop() ?? 0;
    checksum += dq.shift() ?? 0;
  }

  return checksum;
}

function runMixedRealloc(n: number): number {
  const dq = new ReallocDequeue<number>(64);
  let checksum = 0;

  for (let i = 0; i < n; i += 1) {
    dq.push(i);
    dq.unshift(-i);
  }

  for (let i = 0; i < n; i += 1) {
    checksum += dq.pop() ?? 0;
    checksum += dq.shift() ?? 0;
  }

  return checksum;
}

function runStressGrowthBlocks(cycles: number, batch: number): number {
  const dq = new Dequeue<number>(Array, 32);
  let checksum = 0;

  for (let c = 0; c < cycles; c += 1) {
    for (let i = 0; i < batch; i += 1) {
      dq.push(i + c);
      dq.unshift(-(i + c));
    }
    for (let i = 0; i < batch; i += 1) {
      checksum += dq.shift() ?? 0;
      checksum += dq.pop() ?? 0;
    }
  }

  return checksum;
}

function runStressGrowthRealloc(cycles: number, batch: number): number {
  const dq = new ReallocDequeue<number>(32);
  let checksum = 0;

  for (let c = 0; c < cycles; c += 1) {
    for (let i = 0; i < batch; i += 1) {
      dq.push(i + c);
      dq.unshift(-(i + c));
    }
    for (let i = 0; i < batch; i += 1) {
      checksum += dq.shift() ?? 0;
      checksum += dq.pop() ?? 0;
    }
  }

  return checksum;
}

function compareScenario(name: string, a: () => number, b: () => number): ScenarioResult {
  for (let i = 0; i < WARMUP; i += 1) {
    a();
    b();
  }

  const blocksTimes: number[] = [];
  const reallocTimes: number[] = [];
  let checksumBlocks = 0;
  let checksumRealloc = 0;

  for (let i = 0; i < RUNS; i += 1) {
    const r1 = measure(a);
    const r2 = measure(b);

    blocksTimes.push(r1.ms);
    reallocTimes.push(r2.ms);
    checksumBlocks = r1.checksum;
    checksumRealloc = r2.checksum;
  }

  const blocksMs = avg(blocksTimes);
  const reallocMs = avg(reallocTimes);

  return {
    scenario: name,
    blocksMs,
    reallocMs,
    ratioReallocOverBlocks: reallocMs / blocksMs,
    checksumBlocks,
    checksumRealloc,
  };
}

function main(): void {
  const n = 200_000;

  console.log('Benchmark: Dequeue on linked blocks vs ReallocDequeue');
  console.log(`Warmup: ${WARMUP}, Runs: ${RUNS}`);

  const results = [
    compareScenario(
      'push/pop',
      () => runPushPopBlocks(n),
      () => runPushPopRealloc(n)
    ),
    compareScenario(
      'unshift/shift',
      () => runUnshiftShiftBlocks(n),
      () => runUnshiftShiftRealloc(n)
    ),
    compareScenario(
      'mixed',
      () => runMixedBlocks(100_000),
      () => runMixedRealloc(100_000)
    ),
    compareScenario(
      'stress growth',
      () => runStressGrowthBlocks(30, 10_000),
      () => runStressGrowthRealloc(30, 10_000)
    ),
  ];

  console.table(
    results.map((r) => ({
      scenario: r.scenario,
      blocks_ms: Number(r.blocksMs.toFixed(2)),
      realloc_ms: Number(r.reallocMs.toFixed(2)),
      ratio_realloc_over_blocks: Number(r.ratioReallocOverBlocks.toFixed(2)),
      checksum_blocks: r.checksumBlocks,
      checksum_realloc: r.checksumRealloc,
    }))
  );
}

main();
