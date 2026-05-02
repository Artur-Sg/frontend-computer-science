import Prism from 'prismjs';
import { Packr, unpackMultiple } from 'msgpackr';
import { gzipSync, zipSync } from 'fflate';

import templateHtml from './solution.html?raw';

const brotliApiPromise = import('brotli-wasm')
  .then((mod) => mod.default)
  .catch(() => null);

export const template = templateHtml;

export function init(root: HTMLElement): void {
  initDemo(root);

  const blocks = root.querySelectorAll<HTMLElement>('pre code');

  blocks.forEach((codeEl) => {
    const className = Array.from(codeEl.classList).find((name) => name.startsWith('language-'));
    const lang = className ? className.replace('language-', '') : 'markup';
    const grammar =
      Prism.languages[lang] ??
      Prism.languages.typescript ??
      Prism.languages.javascript ??
      Prism.languages.markup;
    const code = codeEl.textContent ?? '';

    codeEl.innerHTML = Prism.highlight(code, grammar, lang);
    codeEl.classList.add(`language-${lang}`);
    codeEl.parentElement?.classList.add(`language-${lang}`);
  });
}

type DemoMetrics = {
  totalMs: number;
  firstMs: number;
  peakMb: number;
  rawMb: number;
  gzMb: number | null;
  brMb: number | null;
  zipMb: number | null;
  records: number;
};

type DemoData = {
  csvText: string;
  jsonText: string;
  msgpackBytes: Uint8Array;
  sizes: {
    csvRaw: number;
    jsonRaw: number;
    msgpackRaw: number;
  };
};

function initDemo(root: HTMLElement): void {
  const runBtn = root.querySelector<HTMLButtonElement>('#df-run-btn');
  const useDefaultBtn = root.querySelector<HTMLButtonElement>('#df-use-default-btn');
  const csvFileInput = root.querySelector<HTMLInputElement>('#df-file-csv');
  const jsonFileInput = root.querySelector<HTMLInputElement>('#df-file-json');
  const msgpackFileInput = root.querySelector<HTMLInputElement>('#df-file-msgpack');
  const useBrotliInput = root.querySelector<HTMLInputElement>('#df-use-brotli');
  const calcIndicator = root.querySelector<HTMLElement>('#df-calc-indicator');
  const tableBody = root.querySelector<HTMLTableSectionElement>('#df-results-table tbody');
  const progressCsv = root.querySelector<HTMLElement>('#df-progress-csv');
  const progressJson = root.querySelector<HTMLElement>('#df-progress-json');
  const progressMsgpack = root.querySelector<HTMLElement>('#df-progress-msgpack');
  const metaCsv = root.querySelector<HTMLElement>('#df-meta-csv');
  const metaJson = root.querySelector<HTMLElement>('#df-meta-json');
  const metaMsgpack = root.querySelector<HTMLElement>('#df-meta-msgpack');
  const logCsv = root.querySelector<HTMLElement>('#df-log-csv');
  const logJson = root.querySelector<HTMLElement>('#df-log-json');
  const logMsgpack = root.querySelector<HTMLElement>('#df-log-msgpack');

  if (
    !runBtn ||
    !useDefaultBtn ||
    !csvFileInput ||
    !jsonFileInput ||
    !msgpackFileInput ||
    !useBrotliInput ||
    !calcIndicator ||
    !tableBody ||
    !progressCsv ||
    !progressJson ||
    !progressMsgpack ||
    !metaCsv ||
    !metaJson ||
    !metaMsgpack ||
    !logCsv ||
    !logJson ||
    !logMsgpack
  ) {
    return;
  }

  let metrics: Record<'csv' | 'json' | 'msgpack', DemoMetrics> = {
    csv: { totalMs: 0, firstMs: 0, peakMb: 0, rawMb: 0, gzMb: null, brMb: null, zipMb: null, records: 0 },
    json: { totalMs: 0, firstMs: 0, peakMb: 0, rawMb: 0, gzMb: null, brMb: null, zipMb: null, records: 0 },
    msgpack: { totalMs: 0, firstMs: 0, peakMb: 0, rawMb: 0, gzMb: null, brMb: null, zipMb: null, records: 0 }
  };

  const runBtnIdleText = runBtn.textContent ?? 'Run comparison';
  const defaultBtnIdleText = useDefaultBtn.textContent ?? 'Использовать демо-данные';
  const nextPaint = async (): Promise<void> =>
    new Promise((resolve) => requestAnimationFrame(() => resolve()));

  const setMeta = (el: HTMLElement, m: DemoMetrics, status: string): void => {
    el.innerHTML = [
      `Файл: ${m.records.toLocaleString()} записей`,
      `Статус: ${status}`,
      `First record: ${m.firstMs.toFixed(2)} ms`,
      `Total: ${m.totalMs.toFixed(2)} ms`,
      `Peak heap Δ: ${m.peakMb.toFixed(2)} MB`
    ].join('<br>');
  };

  const setProgress = (el: HTMLElement, percent: number): void => {
    el.style.width = `${Math.min(100, Math.max(0, percent)).toFixed(1)}%`;
  };

  const renderPlaceholderTable = (): void => {
    tableBody.innerHTML = [
      ['CSV stream', '—', '—', '—', '—', '—', '—', '—'],
      ['JSON.parse', '—', '—', '—', '—', '—', '—', '—'],
      ['MessagePack stream', '—', '—', '—', '—', '—', '—', '—']
    ].map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('');
  };

  const appendTable = (): void => {
    const rows: Array<{ label: string; m: DemoMetrics }> = [
      { label: 'CSV stream', m: metrics.csv },
      { label: 'JSON.parse', m: metrics.json },
      { label: 'MessagePack stream', m: metrics.msgpack }
    ];

    const fmt = (v: number | null): string => (v == null ? 'n/a' : v.toFixed(2));

    tableBody.innerHTML = rows.map(({ label, m }) => [
      '<tr>',
      `<td>${label}</td>`,
      `<td>${m.totalMs.toFixed(2)}</td>`,
      `<td>${m.firstMs.toFixed(2)}</td>`,
      `<td>${m.peakMb.toFixed(2)}</td>`,
      `<td>${m.rawMb.toFixed(2)}</td>`,
      `<td>${fmt(m.gzMb)}</td>`,
      `<td>${fmt(m.brMb)}</td>`,
      `<td>${fmt(m.zipMb)}</td>`,
      '</tr>'
    ].join('')).join('');
  };

  const reset = (): void => {
    setProgress(progressCsv, 0);
    setProgress(progressJson, 0);
    setProgress(progressMsgpack, 0);
    logCsv.textContent = '';
    logJson.textContent = '';
    logMsgpack.textContent = '';
    renderPlaceholderTable();
    setMeta(metaCsv, metrics.csv, 'idle');
    setMeta(metaJson, metrics.json, 'idle');
    setMeta(metaMsgpack, metrics.msgpack, 'idle');
  };

  const setDisabled = (value: boolean): void => {
    runBtn.disabled = value;
    useDefaultBtn.disabled = value;
    csvFileInput.disabled = value;
    jsonFileInput.disabled = value;
    msgpackFileInput.disabled = value;
    useBrotliInput.disabled = value;
    calcIndicator.style.display = value ? 'inline' : 'none';
    runBtn.textContent = value ? 'Считаю…' : runBtnIdleText;
    useDefaultBtn.textContent = value ? 'Готовлю данные…' : defaultBtnIdleText;
  };

  const runVisual = (): void => {
    reset();
    setDisabled(true);

    const csvSamples = ['1. Alice', '2. Bob', '3. Carol', '4. Dan', '5. Eve'];
    const jsonSamples = [
      '{ "id": 1, "name": "Alice" }',
      '{ "id": 2, "name": "Bob" }',
      '{ "id": 3, "name": "Carol" }'
    ];
    const msgpackSamples = [
      '{ "id": 1, "name": "Alice" }',
      '{ "id": 2, "name": "Bob" }',
      '{ "id": 3, "name": "Carol" }'
    ];

    const start = performance.now();
    const maxMs = Math.max(metrics.csv.totalMs, metrics.json.totalMs, metrics.msgpack.totalMs, 1);

    const tick = (): void => {
      const elapsed = performance.now() - start;
      const csvPct = Math.min(1, elapsed / Math.max(metrics.csv.totalMs, 1));
      const jsonPct = Math.min(1, elapsed / Math.max(metrics.json.totalMs, 1));
      const msgPct = Math.min(1, elapsed / Math.max(metrics.msgpack.totalMs, 1));
      const doneAll = elapsed >= maxMs;

      setProgress(progressCsv, csvPct * 100);
      setProgress(progressJson, jsonPct * 100);
      setProgress(progressMsgpack, msgPct * 100);

      setMeta(metaCsv, metrics.csv, csvPct >= 1 ? 'done' : 'streaming');
      setMeta(metaMsgpack, metrics.msgpack, msgPct >= 1 ? 'done' : 'streaming');
      setMeta(metaJson, metrics.json, jsonPct >= 1 ? 'done' : 'reading full file + parsing...');

      if (elapsed >= metrics.csv.firstMs) {
        const n = Math.max(1, Math.min(csvSamples.length, Math.ceil(csvPct * csvSamples.length)));
        logCsv.textContent = csvSamples.slice(0, n).join('\n');
      }

      if (elapsed >= metrics.msgpack.firstMs) {
        const n = Math.max(1, Math.min(msgpackSamples.length, Math.ceil(msgPct * msgpackSamples.length)));
        logMsgpack.textContent = msgpackSamples.slice(0, n).join('\n');
      }

      if (jsonPct >= 1) {
        logJson.textContent = `${jsonSamples.join('\n')}\n...\n(parsed ${metrics.json.records.toLocaleString()} records)`;
      } else {
        logJson.textContent = 'waiting...';
      }

      if (doneAll) {
        appendTable();
        setDisabled(false);
        return;
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const runReal = async (data: DemoData): Promise<void> => {
    const encoder = new TextEncoder();
    const csvBytes = encoder.encode(data.csvText);
    const jsonBytes = encoder.encode(data.jsonText);
    const msgBytes = data.msgpackBytes;
    const decoder = new TextDecoder();

    const csvStart = performance.now();
    let csvFirst = -1;
    let csvRecords = 0;
    const csvBaseMb = getHeapMb();
    let csvPeakMb = csvBaseMb;

    const csvDecodedText = decoder.decode(csvBytes);
    let lineStart = 0;
    let lineIndex = 0;

    const processCsvLine = (line: string): void => {
      if (!line) {
        return;
      }
      splitCsvLike(line);
      if (lineIndex === 0) {
        lineIndex += 1;
        return;
      }
      lineIndex += 1;
      csvRecords += 1;
      if (csvFirst < 0) {
        csvFirst = performance.now() - csvStart;
      }
      const heap = getHeapMb();
      if (heap > csvPeakMb) {
        csvPeakMb = heap;
      }
    };

    for (let i = 0; i < csvDecodedText.length; i += 1) {
      const ch = csvDecodedText.charCodeAt(i);
      if (ch === 10) {
        let line = csvDecodedText.slice(lineStart, i);
        if (line.endsWith('\r')) {
          line = line.slice(0, -1);
        }
        processCsvLine(line);
        lineStart = i + 1;
      }
    }

    if (lineStart < csvDecodedText.length) {
      processCsvLine(csvDecodedText.slice(lineStart));
    }
    const csvTotal = performance.now() - csvStart;
    const csvPeakDeltaMb = Math.max(0, csvPeakMb - csvBaseMb);

    const jsonStart = performance.now();
    const jsonBaseMb = getHeapMb();
    let jsonPeakMb = jsonBaseMb;
    const jsonDecodedText = decoder.decode(jsonBytes);
    const parsedJson = JSON.parse(jsonDecodedText) as Array<Record<string, unknown>>;
    const jsonHeap = getHeapMb();
    if (jsonHeap > jsonPeakMb) {
      jsonPeakMb = jsonHeap;
    }
    const jsonTotal = performance.now() - jsonStart;
    const jsonPeakDeltaMb = Math.max(0, jsonPeakMb - jsonBaseMb);

    const msgStart = performance.now();
    let msgFirst = -1;
    let msgRecords = 0;
    const msgBaseMb = getHeapMb();
    let msgPeakMb = msgBaseMb;

    unpackMultiple(data.msgpackBytes, () => {
      msgRecords += 1;
      if (msgFirst < 0) {
        msgFirst = performance.now() - msgStart;
      }
      const heap = getHeapMb();
      if (heap > msgPeakMb) {
        msgPeakMb = heap;
      }
    });
    const msgTotal = performance.now() - msgStart;
    const msgPeakDeltaMb = Math.max(0, msgPeakMb - msgBaseMb);

    const useBrotli = useBrotliInput.checked;
    const [csvCompressed, jsonCompressed, msgCompressed] = await Promise.all([
      computeCompressedSizes(csvBytes, 'data.csv', useBrotli),
      computeCompressedSizes(jsonBytes, 'data.json', useBrotli),
      computeCompressedSizes(msgBytes, 'data.msgpack', useBrotli)
    ]);

    metrics = {
      csv: {
        totalMs: csvTotal,
        firstMs: csvFirst < 0 ? csvTotal : csvFirst,
        peakMb: csvPeakDeltaMb,
        rawMb: bytesToMb(data.sizes.csvRaw),
        gzMb: csvCompressed.gzMb,
        brMb: csvCompressed.brMb,
        zipMb: csvCompressed.zipMb,
        records: csvRecords
      },
      json: {
        totalMs: jsonTotal,
        firstMs: jsonTotal,
        peakMb: jsonPeakDeltaMb,
        rawMb: bytesToMb(data.sizes.jsonRaw),
        gzMb: jsonCompressed.gzMb,
        brMb: jsonCompressed.brMb,
        zipMb: jsonCompressed.zipMb,
        records: parsedJson.length
      },
      msgpack: {
        totalMs: msgTotal,
        firstMs: msgFirst < 0 ? msgTotal : msgFirst,
        peakMb: msgPeakDeltaMb,
        rawMb: bytesToMb(data.sizes.msgpackRaw),
        gzMb: msgCompressed.gzMb,
        brMb: msgCompressed.brMb,
        zipMb: msgCompressed.zipMb,
        records: msgRecords
      }
    };
  };

  useDefaultBtn.addEventListener('click', async () => {
    setDisabled(true);
    try {
      await nextPaint();
      const data = buildDefaultDataset(20_000);
      await runReal(data);
      runVisual();
    } catch (error) {
      console.error(error);
      setDisabled(false);
    }
  });

  runBtn.addEventListener('click', async () => {
    setDisabled(true);
    try {
      await nextPaint();
      const csvFile = csvFileInput.files?.[0];
      const jsonFile = jsonFileInput.files?.[0];
      const msgFile = msgpackFileInput.files?.[0];

      if (!csvFile || !jsonFile || !msgFile) {
        const data = buildDefaultDataset(20_000);
        await runReal(data);
        runVisual();
        return;
      }

      const [csvText, jsonText, msgBuffer] = await Promise.all([
        csvFile.text(),
        jsonFile.text(),
        msgFile.arrayBuffer()
      ]);

      const data: DemoData = {
        csvText,
        jsonText,
        msgpackBytes: new Uint8Array(msgBuffer),
        sizes: {
          csvRaw: csvFile.size,
          jsonRaw: jsonFile.size,
          msgpackRaw: msgFile.size
        }
      };

      await runReal(data);
      runVisual();
    } catch (error) {
      console.error(error);
      setDisabled(false);
    }
  });

  reset();
  setDisabled(false);
}

function buildDefaultDataset(count: number): DemoData {
  const rows = Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    active: i % 2 === 0,
    score: 50 + (i % 50),
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    verified: i % 3 === 0,
    registered_ms: 1600000000000 + i * 1000,
    last_seen_ms: 1700000000000 + i * 2000
  }));

  const header = 'id,active,score,name,email,verified,registered_ms,last_seen_ms';
  const lines = rows.map((r) => [
    String(r.id),
    r.active ? 'TRUE' : 'FALSE',
    String(r.score),
    r.name,
    r.email,
    r.verified ? 'TRUE' : 'FALSE',
    String(r.registered_ms),
    String(r.last_seen_ms)
  ].join(','));

  const csvText = `${header}\n${lines.join('\n')}\n`;
  const jsonText = JSON.stringify(rows);
  const packr = new Packr({ useRecords: true, moreTypes: true });
  const chunks = rows.map((row) => packr.pack(row));
  const msgpackBytes = concatBytes(chunks);

  return {
    csvText,
    jsonText,
    msgpackBytes,
    sizes: {
      csvRaw: new TextEncoder().encode(csvText).byteLength,
      jsonRaw: new TextEncoder().encode(jsonText).byteLength,
      msgpackRaw: msgpackBytes.byteLength
    }
  };
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }

  return out;
}

function splitCsvLike(line: string): string[] {
  return line.split(',');
}

function bytesToMb(bytes: number): number {
  return bytes / (1024 * 1024);
}

function getHeapMb(): number {
  const maybeMemory = (performance as Performance & {
    memory?: { usedJSHeapSize: number };
  }).memory;

  if (!maybeMemory) {
    return 0;
  }

  return bytesToMb(maybeMemory.usedJSHeapSize);
}

async function computeCompressedSizes(
  bytes: Uint8Array,
  fileName: string,
  useBrotli: boolean
): Promise<{ gzMb: number; brMb: number | null; zipMb: number }> {
  const gz = gzipSync(bytes, { level: 9 });
  const zip = zipSync({ [fileName]: bytes }, { level: 9 });
  const br = useBrotli ? await brotliMaybe(bytes) : null;

  return {
    gzMb: bytesToMb(gz.byteLength),
    brMb: br == null ? null : bytesToMb(br.byteLength),
    zipMb: bytesToMb(zip.byteLength)
  };
}

async function brotliMaybe(bytes: Uint8Array): Promise<Uint8Array | null> {
  try {
    const brotliApi = await brotliApiPromise;
    if (brotliApi && typeof brotliApi.compress === 'function') {
      return brotliApi.compress(bytes);
    }
  } catch {
    // fallback ниже
  }

  if (typeof CompressionStream === 'undefined') {
    return null;
  }

  try {
    const stream = new CompressionStream('brotli');
    const writer = stream.writable.getWriter();

    await writer.write(bytes);
    await writer.close();

    const out = await new Response(stream.readable).arrayBuffer();
    return new Uint8Array(out);
  } catch {
    return null;
  }
}
