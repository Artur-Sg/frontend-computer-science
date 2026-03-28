import { renderMarkdown } from '#shared/markdown';
import templateHtml from './solution.html?raw';
import styles from './solution.css?raw';
import { cyclicLeftShift, cyclicRightShift } from './cyclic-shift';

export const template = `<style>${styles}</style>${templateHtml}`;

function parseValue(raw: string): number {
  const cleaned = raw.replace(/_/g, '').trim();

  if (!cleaned) {
    throw new Error('Введите число.');
  }

  if (/^0b[01]+$/i.test(cleaned)) {
    return parseInt(cleaned.slice(2), 2);
  }

  if (/^\d+$/.test(cleaned)) {
    return Number(cleaned);
  }

  throw new Error('Введите десятичное число или двоичное с префиксом 0b.');
}

function toBinary(value: number): string {
  return (value >>> 0).toString(2).padStart(32, '0');
}

function toDecimal(value: number): string {
  return (value >>> 0).toString(10);
}

export function init(root: HTMLElement): void {
  const descEl = root.querySelector<HTMLElement>('#solution-description');
  const valueEl = root.querySelector<HTMLInputElement>('#shift-value');
  const amountEl = root.querySelector<HTMLInputElement>('#shift-amount');
  const originalDecEl = root.querySelector<HTMLElement>('#original-dec');
  const leftBinEl = root.querySelector<HTMLElement>('#left-bin');
  const leftDecEl = root.querySelector<HTMLElement>('#left-dec');
  const rightBinEl = root.querySelector<HTMLElement>('#right-bin');
  const rightDecEl = root.querySelector<HTMLElement>('#right-dec');

  let debounceId: number | null = null;

  const render = (): void => {
    if (
      !valueEl ||
      !amountEl ||
      !originalDecEl ||
      !leftBinEl ||
      !leftDecEl ||
      !rightBinEl ||
      !rightDecEl
    ) {
      return;
    }

    try {
      const value = parseValue(valueEl.value);
      const shift = Number(amountEl.value) || 0;
      const left = cyclicLeftShift(value, shift);
      const right = cyclicRightShift(value, shift);

      originalDecEl.textContent = toDecimal(value);
      leftBinEl.textContent = toBinary(left);
      leftDecEl.textContent = toDecimal(left);
      rightBinEl.textContent = toBinary(right);
      rightDecEl.textContent = toDecimal(right);
    } catch (error) {
      originalDecEl.textContent = '';
      leftBinEl.textContent = '';
      leftDecEl.textContent = '';
      rightBinEl.textContent = '';
      rightDecEl.textContent = '';
    }
  };

  const scheduleRender = (): void => {
    if (debounceId !== null) {
      window.clearTimeout(debounceId);
    }
    debounceId = window.setTimeout(render, 200);
  };

  fetch('lectures/04-bit-operations/homework/solution.md')
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

  render();
  valueEl?.addEventListener('input', scheduleRender);
  amountEl?.addEventListener('input', scheduleRender);
}
