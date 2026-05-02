import Prism from 'prismjs';
import templateHtml from './solution.html?raw';

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
  gzMb: number;
  brMb: number;
  zipMb: number;
  records: number;
};

function initDemo(root: HTMLElement): void {
  const runBtn = root.querySelector<HTMLButtonElement>('#df-run-btn');
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

  const metrics: Record<'csv' | 'json' | 'msgpack', DemoMetrics> = {
    csv: {
      totalMs: 60.59,
      firstMs: 1.17,
      peakMb: 8.33,
      rawMb: 16.17,
      gzMb: 5.58,
      brMb: 3.99,
      zipMb: 5.47,
      records: 200_000
    },
    json: {
      totalMs: 150.88,
      firstMs: 150.88,
      peakMb: 83.87,
      rawMb: 38.87,
      gzMb: 6.29,
      brMb: 4.31,
      zipMb: 6.29,
      records: 200_000
    },
    msgpack: {
      totalMs: 55.44,
      firstMs: 3.24,
      peakMb: 17.78,
      rawMb: 12.07,
      gzMb: 5.43,
      brMb: 4.16,
      zipMb: 5.43,
      records: 200_000
    }
  };

  const setMeta = (el: HTMLElement, m: DemoMetrics, status: string): void => {
    el.innerHTML = [
      `Файл: ${m.records.toLocaleString()} записей`,
      `Статус: ${status}`,
      `First record: ${m.firstMs.toFixed(2)} ms`,
      `Total: ${m.totalMs.toFixed(2)} ms`,
      `Peak heap: ${m.peakMb.toFixed(2)} MB`
    ].join('<br>');
  };

  const setProgress = (el: HTMLElement, percent: number): void => {
    el.style.width = `${Math.min(100, Math.max(0, percent)).toFixed(1)}%`;
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

    tableBody.innerHTML = rows.map(({ label, m }) => [
      '<tr>',
      `<td>${label}</td>`,
      `<td>${m.totalMs.toFixed(2)}</td>`,
      `<td>${m.firstMs.toFixed(2)}</td>`,
      `<td>${m.peakMb.toFixed(2)}</td>`,
      `<td>${m.rawMb.toFixed(2)}</td>`,
      `<td>${m.gzMb.toFixed(2)}</td>`,
      `<td>${m.brMb.toFixed(2)}</td>`,
      `<td>${m.zipMb.toFixed(2)}</td>`,
      '</tr>'
    ].join('')).join('');
  };

  let frameId = 0;

  runBtn.addEventListener('click', () => {
    frameId += 1;
    const currentFrame = frameId;

    reset();
    runBtn.disabled = true;

    const start = performance.now();
    const maxMs = Math.max(metrics.csv.totalMs, metrics.json.totalMs, metrics.msgpack.totalMs);
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

    const tick = (): void => {
      if (currentFrame !== frameId) {
        return;
      }
      const elapsed = performance.now() - start;
      const k = elapsed / maxMs;

      const csvPct = Math.min(1, elapsed / metrics.csv.totalMs);
      const msgPct = Math.min(1, elapsed / metrics.msgpack.totalMs);
      const jsonPct = Math.min(1, elapsed / metrics.json.totalMs);

      setProgress(progressCsv, csvPct * 100);
      setProgress(progressMsgpack, msgPct * 100);
      setProgress(progressJson, jsonPct * 100);

      if (elapsed >= metrics.csv.firstMs) {
        setMeta(metaCsv, metrics.csv, csvPct >= 1 ? 'done' : 'streaming');
        const count = Math.max(1, Math.min(csvSamples.length, Math.ceil(csvPct * csvSamples.length)));

        logCsv.textContent = csvSamples.slice(0, count).join('\n');
      } else {
        setMeta(metaCsv, metrics.csv, 'reading');
      }

      if (elapsed >= metrics.msgpack.firstMs) {
        setMeta(metaMsgpack, metrics.msgpack, msgPct >= 1 ? 'done' : 'streaming');
        const count = Math.max(1, Math.min(msgpackSamples.length, Math.ceil(msgPct * msgpackSamples.length)));

        logMsgpack.textContent = msgpackSamples.slice(0, count).join('\n');
      } else {
        setMeta(metaMsgpack, metrics.msgpack, 'reading');
      }

      if (elapsed >= metrics.json.totalMs) {
        setMeta(metaJson, metrics.json, 'done');
        logJson.textContent = `${jsonSamples.join('\n')}\n...\n(parsed 200000 records)`;
      } else {
        setMeta(metaJson, metrics.json, 'reading full file + parsing...');
        logJson.textContent = 'waiting...';
      }

      if (k < 1) {
        requestAnimationFrame(tick);
      } else {
        appendTable();
        runBtn.disabled = false;
      }
    };

    requestAnimationFrame(tick);
  });

  reset();
}
