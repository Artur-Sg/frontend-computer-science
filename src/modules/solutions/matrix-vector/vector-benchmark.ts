import { performance } from 'node:perf_hooks';
import { RGBAView, type RGBAColor } from './rgba-view';
import { Vector } from './vector';

type RGBAObject = {
  red: number;
  green: number;
  blue: number;
  alpha: number;
};

type MemorySample = {
  heapUsedMb: number;
  arrayBuffersMb: number;
  externalMb: number;
};

type ScenarioResult = {
  name: string;
  vectorMs: number;
  arrayMs: number;
  vectorChecksum: number;
  arrayChecksum: number;
};

const BASIC_COUNT = 200_000;
const STRESS_CYCLES = 20;
const STRESS_PUSH = 10_000;
const STRESS_POP = 5_000;

function mb(bytes: number): number {
  return bytes / (1024 * 1024);
}

function sampleMemory(): MemorySample {
  const m = process.memoryUsage();

  return {
    heapUsedMb: mb(m.heapUsed),
    arrayBuffersMb: mb(m.arrayBuffers),
    externalMb: mb(m.external)
  };
}

function forceGcIfAvailable(): void {
  if (typeof globalThis.gc === 'function') {
    globalThis.gc();
    globalThis.gc();
  }
}

function makeColor(i: number): RGBAColor {
  return [
    i & 255,
    (i * 3) & 255,
    (i * 7) & 255,
    255
  ];
}

function runBasicVector(): { ms: number; checksum: number } {
  const start = performance.now();
  const v = new Vector(BASIC_COUNT, RGBAView);

  for (let i = 0; i < BASIC_COUNT; i += 1) {
    v.push(makeColor(i));
  }

  let checksum = 0;

  for (let i = 0; i < v.length; i += 1) {
    const [r, g, b, a] = v.get(i);

    checksum += r + g + b + a;
  }

  for (let i = 0; i < v.length; i += 1000) {
    v.set(i, [255, 0, 0, 255]);
  }

  while (v.length > 0) {
    const px = v.pop();

    if (px) {
      checksum += px[0];
    }
  }

  return { ms: performance.now() - start, checksum };
}

function runBasicArray(): { ms: number; checksum: number } {
  const start = performance.now();
  const a: RGBAObject[] = [];

  for (let i = 0; i < BASIC_COUNT; i += 1) {
    const [red, green, blue, alpha] = makeColor(i);

    a.push({ red, green, blue, alpha });
  }

  let checksum = 0;

  for (let i = 0; i < a.length; i += 1) {
    const px = a[i];

    checksum += px.red + px.green + px.blue + px.alpha;
  }

  for (let i = 0; i < a.length; i += 1000) {
    a[i] = { red: 255, green: 0, blue: 0, alpha: 255 };
  }

  while (a.length > 0) {
    const px = a.pop();

    if (px) {
      checksum += px.red;
    }
  }

  return { ms: performance.now() - start, checksum };
}

function runStressVector(): { ms: number; checksum: number } {
  const start = performance.now();
  const v = new Vector(16, RGBAView);
  let checksum = 0;

  for (let cycle = 0; cycle < STRESS_CYCLES; cycle += 1) {
    for (let i = 0; i < STRESS_PUSH; i += 1) {
      v.push(makeColor(i + cycle));
    }

    for (let i = 0; i < STRESS_POP; i += 1) {
      const px = v.pop();

      if (px) {
        checksum += px[1];
      }
    }

    v.shrinkToFit();
  }

  return { ms: performance.now() - start, checksum };
}

function runStressArray(): { ms: number; checksum: number } {
  const start = performance.now();
  const a: RGBAObject[] = [];
  let checksum = 0;

  for (let cycle = 0; cycle < STRESS_CYCLES; cycle += 1) {
    for (let i = 0; i < STRESS_PUSH; i += 1) {
      const [red, green, blue, alpha] = makeColor(i + cycle);

      a.push({ red, green, blue, alpha });
    }

    for (let i = 0; i < STRESS_POP; i += 1) {
      const px = a.pop();

      if (px) {
        checksum += px.green;
      }
    }

    // Аналог "поджать память": пересоздаём массив в текущем размере.
    // Это не точный эквивалент shrinkToFit у Vector, но близкий по смыслу.
    const compact = a.slice();

    a.length = 0;
    a.push(...compact);
  }

  return { ms: performance.now() - start, checksum };
}

function printScenario(result: ScenarioResult): void {
  console.table([
    {
      scenario: result.name,
      vector_ms: Number(result.vectorMs.toFixed(2)),
      array_ms: Number(result.arrayMs.toFixed(2)),
      ratio_array_over_vector: Number((result.arrayMs / result.vectorMs).toFixed(2)),
      vector_checksum: result.vectorChecksum,
      array_checksum: result.arrayChecksum
    }
  ]);
}

function runMemoryProbe(): void {
  console.log('\n=== Memory/GC probe ===');

  forceGcIfAvailable();
  const before = sampleMemory();

  const vector = new Vector(16, RGBAView);

  for (let cycle = 0; cycle < STRESS_CYCLES; cycle += 1) {
    for (let i = 0; i < STRESS_PUSH; i += 1) {
      vector.push(makeColor(i + cycle));
    }
    for (let i = 0; i < STRESS_POP; i += 1) {
      vector.pop();
    }
    vector.shrinkToFit();
  }

  const midVector = sampleMemory();

  forceGcIfAvailable();
  const afterVectorGc = sampleMemory();

  const arr: RGBAObject[] = [];

  for (let cycle = 0; cycle < STRESS_CYCLES; cycle += 1) {
    for (let i = 0; i < STRESS_PUSH; i += 1) {
      const [red, green, blue, alpha] = makeColor(i + cycle);

      arr.push({ red, green, blue, alpha });
    }
    for (let i = 0; i < STRESS_POP; i += 1) {
      arr.pop();
    }
  }

  const midArray = sampleMemory();

  forceGcIfAvailable();
  const afterArrayGc = sampleMemory();

  console.table([
    {
      stage: 'before',
      heap_mb: Number(before.heapUsedMb.toFixed(2)),
      array_buffers_mb: Number(before.arrayBuffersMb.toFixed(2)),
      external_mb: Number(before.externalMb.toFixed(2))
    },
    {
      stage: 'after_vector',
      heap_mb: Number(midVector.heapUsedMb.toFixed(2)),
      array_buffers_mb: Number(midVector.arrayBuffersMb.toFixed(2)),
      external_mb: Number(midVector.externalMb.toFixed(2))
    },
    {
      stage: 'after_vector_gc',
      heap_mb: Number(afterVectorGc.heapUsedMb.toFixed(2)),
      array_buffers_mb: Number(afterVectorGc.arrayBuffersMb.toFixed(2)),
      external_mb: Number(afterVectorGc.externalMb.toFixed(2))
    },
    {
      stage: 'after_array',
      heap_mb: Number(midArray.heapUsedMb.toFixed(2)),
      array_buffers_mb: Number(midArray.arrayBuffersMb.toFixed(2)),
      external_mb: Number(midArray.externalMb.toFixed(2))
    },
    {
      stage: 'after_array_gc',
      heap_mb: Number(afterArrayGc.heapUsedMb.toFixed(2)),
      array_buffers_mb: Number(afterArrayGc.arrayBuffersMb.toFixed(2)),
      external_mb: Number(afterArrayGc.externalMb.toFixed(2))
    }
  ]);
}

function main(): void {
  console.log('Benchmark: Vector<RGBAView> vs Array<RGBAObject>');
  console.log(`Basic: ${BASIC_COUNT.toLocaleString()} элементов`);
  console.log(`Stress: ${STRESS_CYCLES} циклов, +${STRESS_PUSH}/-${STRESS_POP} на цикл`);
  console.log(`GC exposed: ${typeof globalThis.gc === 'function' ? 'yes' : 'no'}\n`);

  const basicVector = runBasicVector();
  const basicArray = runBasicArray();

  printScenario({
    name: 'basic: push -> get/set -> pop',
    vectorMs: basicVector.ms,
    arrayMs: basicArray.ms,
    vectorChecksum: basicVector.checksum,
    arrayChecksum: basicArray.checksum
  });

  const stressVector = runStressVector();
  const stressArray = runStressArray();

  printScenario({
    name: 'stress: many push/pop/shrink',
    vectorMs: stressVector.ms,
    arrayMs: stressArray.ms,
    vectorChecksum: stressVector.checksum,
    arrayChecksum: stressArray.checksum
  });

  runMemoryProbe();
}

main();
