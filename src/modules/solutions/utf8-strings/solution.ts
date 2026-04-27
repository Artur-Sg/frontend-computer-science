import Prism from 'prismjs';
import { encodeStrings as encodeBasic } from './utf8-strings-basic';
import { encodeStrings as encodePointers } from './utf8-strings-pointers';
import templateHtml from './solution.html?raw';

export const template = templateHtml;

export function init(root: HTMLElement): void {
  initSandbox(root);

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

function initSandbox(root: HTMLElement): void {
  const inputEl = root.querySelector<HTMLTextAreaElement>('#utf8-input');
  const indexEl = root.querySelector<HTMLInputElement>('#utf8-index');
  const setValueEl = root.querySelector<HTMLInputElement>('#utf8-set-value');
  const runBtn = root.querySelector<HTMLButtonElement>('#utf8-run');
  const applySetBtn = root.querySelector<HTMLButtonElement>('#utf8-apply-set');
  const errorEl = root.querySelector<HTMLElement>('#utf8-error');
  const metricBasicEl = root.querySelector<HTMLElement>('#utf8-metric-basic');
  const metricPointersEl = root.querySelector<HTMLElement>('#utf8-metric-pointers');
  const metricRatioEl = root.querySelector<HTMLElement>('#utf8-metric-ratio');
  const basicLayoutEl = root.querySelector<HTMLElement>('#utf8-layout-basic');
  const basicLayoutNoteEl = root.querySelector<HTMLElement>('#utf8-layout-basic-note');
  const pointersMetaEl = root.querySelector<HTMLElement>('#utf8-layout-pointers-meta');
  const pointersDataEl = root.querySelector<HTMLElement>('#utf8-layout-pointers-data');
  const pointersLayoutNoteEl = root.querySelector<HTMLElement>('#utf8-layout-pointers-note');
  const basicBytesEl = root.querySelector<HTMLElement>('#utf8-bytes-basic');
  const pointersBytesEl = root.querySelector<HTMLElement>('#utf8-bytes-pointers');
  const basicBinaryEl = root.querySelector<HTMLElement>('#utf8-binary-basic');
  const pointersBinaryEl = root.querySelector<HTMLElement>('#utf8-binary-pointers');

  if (
    !inputEl ||
    !indexEl ||
    !setValueEl ||
    !runBtn ||
    !applySetBtn ||
    !errorEl ||
    !metricBasicEl ||
    !metricPointersEl ||
    !metricRatioEl ||
    !basicLayoutEl ||
    !basicLayoutNoteEl ||
    !pointersMetaEl ||
    !pointersDataEl ||
    !pointersLayoutNoteEl ||
    !basicBytesEl ||
    !pointersBytesEl ||
    !basicBinaryEl ||
    !pointersBinaryEl
  ) {
    return;
  }

  let currentStrings: string[] = parseInputLines(inputEl.value);

  const render = (stringsOverride?: string[]): void => {
    try {
      const strings = stringsOverride ?? parseInputLines(inputEl.value);

      currentStrings = strings;
      const atIndex = Number(indexEl.value);
      const basic = encodeBasic(strings);
      const pointers = encodePointers(strings);
      const ratio = pointers.byteLength / Math.max(1, basic.byteLength);

      errorEl.textContent = '';

      metricBasicEl.textContent = String(basic.byteLength);
      metricPointersEl.textContent = String(pointers.byteLength);
      metricRatioEl.textContent = `${ratio.toFixed(2)}x`;

      renderBasicLayout(basic.raw, basicLayoutEl, atIndex);
      basicLayoutNoteEl.textContent =
        `basic.at(${atIndex}) проходит записи последовательно до нужного индекса.`;
      renderPointersLayout(pointers.raw, pointersMetaEl, pointersDataEl, atIndex);
      pointersLayoutNoteEl.textContent =
        `pointers.at(${atIndex}) сразу читает длину/указатель из таблицы и переходит к данным строки.`;

      basicBytesEl.textContent = `HEX (basic)\n${toHexDump(basic.raw, 192)}`;
      pointersBytesEl.textContent = `HEX (pointers)\n${toHexDump(pointers.raw, 192)}`;
      basicBinaryEl.textContent = `Бинарный вывод (basic)\n${toBinaryDump(basic.raw, 96)}`;
      pointersBinaryEl.textContent = `Бинарный вывод (pointers)\n${toBinaryDump(pointers.raw, 96)}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      errorEl.textContent = `Ошибка: ${message}`;
    }
  };

  inputEl.addEventListener('input', () => render());
  indexEl.addEventListener('input', () => render());
  runBtn.addEventListener('click', () => render());
  applySetBtn.addEventListener('click', () => {
    const ptr = encodePointers(currentStrings);

    ptr.set(Number(indexEl.value), setValueEl.value);
    const updated = Array.from({ length: currentStrings.length }, (_, i) => ptr.at(i) ?? '');

    inputEl.value = updated.join('\n');
    render(updated);
  });
  render(currentStrings);
}

function parseInputLines(input: string): string[] {
  return input.split('\n').map((line) => line.replace(/\r$/, ''));
}

function renderBasicLayout(raw: ArrayBuffer, el: HTMLElement, selectedIndexRaw: number): void {
  const view = new DataView(raw);
  const decoder = new TextDecoder();
  const count = view.getUint32(0, true);
  const selectedIndex = normalizeIndexForHighlight(selectedIndexRaw, count);
  let offset = 4;
  const chips: string[] = [];

  chips.push(chip(`count:uint32`, `${count} / 4 bytes`));

  for (let i = 0; i < count; i++) {
    const len = view.getUint32(offset, true);

    offset += 4;

    const bytes = new Uint8Array(raw, offset, len);
    const sample = JSON.stringify(decoder.decode(bytes));

    chips.push(chip(`len${i}:uint32`, `${len} bytes`, i === selectedIndex));
    chips.push(chip(`bytes${i}`, sample === '""' ? 'empty' : sample, i === selectedIndex));

    offset += len;
  }

  el.innerHTML = chips.join('');
}

function renderPointersLayout(
  raw: ArrayBuffer,
  metaEl: HTMLElement,
  dataEl: HTMLElement,
  selectedIndexRaw: number
): void {
  const view = new DataView(raw);
  const decoder = new TextDecoder();
  const count = view.getUint32(0, true);
  const selectedIndex = normalizeIndexForHighlight(selectedIndexRaw, count);
  const metaChips: string[] = [chip('count:uint32', `${count} / 4 bytes`)];
  const dataChips: string[] = [];

  for (let i = 0; i < count; i++) {
    const entryOffset = 4 + i * 8;
    const len = view.getUint32(entryOffset, true);
    const ptr = view.getUint32(entryOffset + 4, true);
    const bytes = new Uint8Array(raw, ptr, len);
    const sample = JSON.stringify(decoder.decode(bytes));

    metaChips.push(chip(`len${i}`, `${len} bytes`, i === selectedIndex));
    metaChips.push(chip(`ptr${i}`, `→ ${ptr}`, i === selectedIndex));
    dataChips.push(chip(`bytes${i} @ ${ptr}`, sample === '""' ? 'empty' : sample, i === selectedIndex));
  }

  metaEl.innerHTML = metaChips.join('');
  dataEl.innerHTML = dataChips.join('');
}

function chip(title: string, sub: string, active = false): string {
  const className = active ? 'utf8-chip active' : 'utf8-chip';

  return `<div class="${className}"><div class="utf8-chip-title">${escapeHtml(title)}</div><div class="utf8-chip-sub">${escapeHtml(sub)}</div></div>`;
}

function toHexDump(raw: ArrayBuffer, maxBytes: number): string {
  const bytes = new Uint8Array(raw);
  const len = Math.min(bytes.length, maxBytes);
  const lines: string[] = [];

  for (let i = 0; i < len; i += 16) {
    const chunk = Array.from(bytes.slice(i, i + 16))
      .map((value) => value.toString(16).padStart(2, '0'))
      .join(' ');

    lines.push(`${i.toString().padStart(4, '0')}: ${chunk}`);
  }

  if (bytes.length > maxBytes) {
    lines.push(`... (${bytes.length - maxBytes} bytes omitted)`);
  }

  return lines.join('\n');
}

function toBinaryDump(raw: ArrayBuffer, maxBytes: number): string {
  const bytes = new Uint8Array(raw);
  const len = Math.min(bytes.length, maxBytes);
  const lines: string[] = [];

  for (let i = 0; i < len; i += 8) {
    const chunk = Array.from(bytes.slice(i, i + 8))
      .map((value) => value.toString(2).padStart(8, '0'))
      .join(' ');

    lines.push(`${i.toString().padStart(4, '0')}: ${chunk}`);
  }

  if (bytes.length > maxBytes) {
    lines.push(`... (${bytes.length - maxBytes} bytes omitted)`);
  }

  return lines.join('\n');
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeIndexForHighlight(index: number, count: number): number {
  const normalized = index < 0 ? count + index : index;

  if (normalized < 0 || normalized >= count) {
    return -1;
  }

  return normalized;
}
