import * as fs from 'node:fs';
import * as path from 'node:path';
import { performance } from 'node:perf_hooks';
import { UnpackrStream } from 'msgpackr';
import { parseCSV } from './csv-parser';

type BenchResult = {
  format: 'csv-stream' | 'json-parse' | 'msgpack-stream';
  file: string;
  records: number;
  totalMs: number;
  firstRecordMs: number;
  peakHeapMb: number;
  sizeRawMb: number;
  sizeGzipMb: number | null;
  sizeBrotliMb: number | null;
  sizeZipMb: number | null;
};

type SizeInfo = {
  rawMb: number;
  gzMb: number | null;
  brMb: number | null;
  zipMb: number | null;
};

const DATASET_DIR = path.resolve('src/modules/solutions/data-formats/datasets');

const CSV_FILE = path.join(DATASET_DIR, 'data-200k-canonical.csv');
const JSON_FILE = path.join(DATASET_DIR, 'data-200k.json');
const MSGPACK_FILE = path.join(DATASET_DIR, 'data-200k-canonical.msgpack');

function bytesToMb(bytes: number): number {
  return bytes / (1024 * 1024);
}

function statMbOrNull(file: string): number | null {
  try {
    return bytesToMb(fs.statSync(file).size);
  } catch {
    return null;
  }
}

function getSizeInfo(file: string): SizeInfo {
  return {
    rawMb: bytesToMb(fs.statSync(file).size),
    gzMb: statMbOrNull(`${file}.gz`),
    brMb: statMbOrNull(`${file}.br`),
    zipMb: statMbOrNull(`${file}.zip`),
  };
}

function startPeakTracker(intervalMs = 25): { stop: () => number } {
  let maxHeap = process.memoryUsage().heapUsed;

  const timer = setInterval(() => {
    maxHeap = Math.max(maxHeap, process.memoryUsage().heapUsed);
  }, intervalMs);

  return {
    stop: () => {
      clearInterval(timer);
      maxHeap = Math.max(maxHeap, process.memoryUsage().heapUsed);
      
return bytesToMb(maxHeap);
    },
  };
}

async function benchmarkCsvStream(file: string, separator = ','): Promise<BenchResult> {
  global.gc?.();

  const sizes = getSizeInfo(file);
  const start = performance.now();
  const peak = startPeakTracker();

  let records = 0;
  let firstRecordMs = -1;
  let isHeader = true;

  await new Promise<void>((resolve, reject) => {
    parseCSV(file, separator, (err, row) => {
      if (err) {
        reject(err);
        
return;
      }

      if (row === undefined) {
        resolve();
        
return;
      }

      if (isHeader) {
        isHeader = false;
        
return;
      }

      records += 1;

      if (firstRecordMs < 0) {
        firstRecordMs = performance.now() - start;
      }
    });
  });

  const totalMs = performance.now() - start;
  const peakHeapMb = peak.stop();

  return {
    format: 'csv-stream',
    file: path.basename(file),
    records,
    totalMs,
    firstRecordMs: firstRecordMs < 0 ? totalMs : firstRecordMs,
    peakHeapMb,
    sizeRawMb: sizes.rawMb,
    sizeGzipMb: sizes.gzMb,
    sizeBrotliMb: sizes.brMb,
    sizeZipMb: sizes.zipMb,
  };
}

async function benchmarkJsonParse(file: string): Promise<BenchResult> {
  global.gc?.();

  const sizes = getSizeInfo(file);
  const start = performance.now();
  const peak = startPeakTracker();

  const jsonText = fs.readFileSync(file, 'utf8');
  const afterReadHeap = bytesToMb(process.memoryUsage().heapUsed);

  const data = JSON.parse(jsonText) as unknown[];
  const afterParseHeap = bytesToMb(process.memoryUsage().heapUsed);

  const records = Array.isArray(data) ? data.length : 0;
  const totalMs = performance.now() - start;
  const firstRecordMs = records > 0 ? totalMs : -1;

  const intervalPeak = peak.stop();
  const peakHeapMb = Math.max(intervalPeak, afterReadHeap, afterParseHeap);

  return {
    format: 'json-parse',
    file: path.basename(file),
    records,
    totalMs,
    firstRecordMs: firstRecordMs < 0 ? totalMs : firstRecordMs,
    peakHeapMb,
    sizeRawMb: sizes.rawMb,
    sizeGzipMb: sizes.gzMb,
    sizeBrotliMb: sizes.brMb,
    sizeZipMb: sizes.zipMb,
  };
}

async function benchmarkMsgpackStream(file: string): Promise<BenchResult> {
  global.gc?.();

  const sizes = getSizeInfo(file);
  const start = performance.now();
  const peak = startPeakTracker();

  let records = 0;
  let firstRecordMs = -1;

  const unpack = new UnpackrStream();

  const done = new Promise<void>((resolve, reject) => {
    unpack.on('data', () => {
      records += 1;

      if (firstRecordMs < 0) {
        firstRecordMs = performance.now() - start;
      }
    });

    unpack.on('end', resolve);
    unpack.on('error', reject);
  });

  fs.createReadStream(file).pipe(unpack);

  await done;

  const totalMs = performance.now() - start;
  const peakHeapMb = peak.stop();

  return {
    format: 'msgpack-stream',
    file: path.basename(file),
    records,
    totalMs,
    firstRecordMs: firstRecordMs < 0 ? totalMs : firstRecordMs,
    peakHeapMb,
    sizeRawMb: sizes.rawMb,
    sizeGzipMb: sizes.gzMb,
    sizeBrotliMb: sizes.brMb,
    sizeZipMb: sizes.zipMb,
  };
}

function formatMb(value: number | null): string {
  return value == null ? 'n/a' : value.toFixed(2);
}

function printResults(results: BenchResult[]): void {
  console.log('================================================================================');
  console.log('БЕНЧМАРК: CSV stream vs JSON.parse vs MessagePack stream');
  console.log('Метрики: total time, first-record latency, peak heap, raw/compressed size');
  console.log('================================================================================');

  console.table(
    results.map((r) => ({
      format: r.format,
      file: r.file,
      records: r.records,
      total_ms: Number(r.totalMs.toFixed(2)),
      first_record_ms: Number(r.firstRecordMs.toFixed(2)),
      peak_heap_mb: Number(r.peakHeapMb.toFixed(2)),
      raw_mb: Number(r.sizeRawMb.toFixed(2)),
      gz_mb: formatMb(r.sizeGzipMb),
      br_mb: formatMb(r.sizeBrotliMb),
      zip_mb: formatMb(r.sizeZipMb),
    }))
  );

  console.log('Примечание: JSON.parse не потоковый, поэтому latency до первой записи близка к total.');
  console.log('Примечание: CSV first_record_ms считается до первой строки данных после header.');
}

async function main(): Promise<void> {
  for (const file of [CSV_FILE, JSON_FILE, MSGPACK_FILE]) {
    if (!fs.existsSync(file)) {
      throw new Error(`Файл не найден: ${file}`);
    }
  }

  const csv = await benchmarkCsvStream(CSV_FILE, ',');
  const json = await benchmarkJsonParse(JSON_FILE);
  const msgpack = await benchmarkMsgpackStream(MSGPACK_FILE);

  printResults([csv, json, msgpack]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
