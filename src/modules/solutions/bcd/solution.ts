import { renderMarkdown } from '#shared/markdown';
import templateHtml from './solution.html?raw';
import { BCD8421 } from './bcd';

export const template = templateHtml;

type PackedResult = {
  raw: string;
  normalized: string;
  digitsCount: number;
  bytes: Uint8Array;
  model: BCD8421;
};

function buildPacked(value: string): PackedResult {
  const raw = value.trim();

  if (!raw) {
    throw new Error('Введите число.');
  }
  if (!/^\d+$/.test(raw)) {
    throw new Error('Разрешены только неотрицательные целые числа.');
  }

  const digitsCount = raw.length;
  const normalized = digitsCount % 2 === 0 ? raw : `0${raw}`;
  const model = new BCD8421(BigInt(raw));
  const bytes = (model as unknown as { data: Uint8Array }).data;

  return {
    raw,
    normalized,
    digitsCount,
    bytes,
    model
  };
}

function formatByte(byte: number): string {
  const hex = byte.toString(16).padStart(2, '0').toUpperCase();
  const bin = byte.toString(2).padStart(8, '0');
  const highDigit = Math.floor(byte / 16);
  const lowDigit = byte % 16;

  return `0x${hex}  0b${bin}  -> [${highDigit}][${lowDigit}]`;
}

function getDigitAt(result: PackedResult, index: number): number {
  return result.model.at(index);
}

export function init(root: HTMLElement): void {
  const descEl = root.querySelector<HTMLElement>('#solution-description');
  const inputEl = root.querySelector<HTMLInputElement>('#bcd-input');
  const normalizedEl = root.querySelector<HTMLElement>('#bcd-normalized');
  const bytesEl = root.querySelector<HTMLElement>('#bcd-bytes');
  const valuesEl = root.querySelector<HTMLElement>('#bcd-values');
  const atIndexEl = root.querySelector<HTMLInputElement>('#bcd-index');
  const atResultEl = root.querySelector<HTMLElement>('#bcd-at-result');

  let lastPacked: PackedResult | null = null;

  const renderPacked = (value: string): void => {
    if (!normalizedEl || !bytesEl || !valuesEl) {
      return;
    }

    try {
      const packed = buildPacked(value);

      lastPacked = packed;

      normalizedEl.textContent = [
        `Исходное: ${packed.raw}`,
        `Цифр: ${packed.digitsCount}`,
        `Нормализовано: ${packed.normalized}`
      ].join('\n');

      const byteLines = Array.from(packed.bytes, (byte, idx) => `#${idx}  ${formatByte(byte)}`);

      bytesEl.textContent = byteLines.join('\n');

      valuesEl.textContent = [
        `toString: ${packed.model.toString()}`,
        `toNumber: ${packed.model.toNumber()}`,
        `toBigint: ${packed.model.toBigint()}`
      ].join('\n');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка ввода.';

      normalizedEl.textContent = message;
      bytesEl.textContent = '';
      valuesEl.textContent = '';
      lastPacked = null;
    }
  };

  const renderAt = (): void => {
    if (!atIndexEl || !atResultEl) {
      return;
    }
    if (!lastPacked) {
      atResultEl.textContent = 'Сначала постройте BCD.';

      return;
    }

    const index = Number(atIndexEl.value);

    if (!Number.isInteger(index)) {
      atResultEl.textContent = 'Индекс должен быть целым числом.';

      return;
    }

    try {
      const digit = getDigitAt(lastPacked, index);

      atResultEl.textContent = `${digit}`;
    } catch (error) {
      atResultEl.textContent = error instanceof Error ? error.message : 'Ошибка индекса.';
    }
  };

  fetch('lectures/03-number-encoding/homework/solution.md')
    .then((res) => res.text())
    .then((md) => {
      if (descEl) {
        descEl.innerHTML = renderMarkdown(md);
      }
    })
    .catch(() => {
      if (descEl) {
        descEl.textContent = 'Не удалось загрузить описание решения.';
      }
    });

  if (inputEl) {
    renderPacked(inputEl.value);
  }

  let debounceId: number | null = null;

  const scheduleRender = (): void => {
    if (!inputEl) {
      return;
    }
    if (debounceId !== null) {
      window.clearTimeout(debounceId);
    }
    debounceId = window.setTimeout(() => {
      renderPacked(inputEl.value);
    }, 250);
  };

  inputEl?.addEventListener('input', scheduleRender);
  atIndexEl?.addEventListener('input', renderAt);
}
