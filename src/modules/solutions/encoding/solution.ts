import { renderMarkdown } from '#shared/markdown';
import templateHtml from './solution.html?raw';
import styles from './solution.css?raw';
import { decode as decodeNaive, encode as encodeNaive } from './naive-codec';
import { decode as decodePrefix, encode as encodePrefix } from './prefix-codec';

export const template = `<style>${styles}</style>${templateHtml}`;

export function init(root: HTMLElement): void {
  const inputEl = root.querySelector<HTMLTextAreaElement>('#input');
  const naiveOutEl = root.querySelector<HTMLElement>('#naive-output');
  const smartOutEl = root.querySelector<HTMLElement>('#smart-output');
  const naiveMetaEl = root.querySelector<HTMLElement>('#naive-meta');
  const smartMetaEl = root.querySelector<HTMLElement>('#smart-meta');
  const errorsEl = root.querySelector<HTMLElement>('#errors');
  const modeEls = Array.from(root.querySelectorAll<HTMLInputElement>('input[name="mode"]'));
  const descEl = root.querySelector<HTMLElement>('#solution-description');

  if (!inputEl || !naiveOutEl || !smartOutEl || !naiveMetaEl || !smartMetaEl || !errorsEl) {return;}

  fetch('lectures/01-encoding/homework/solution.md')
    .then((res) => res.text())
    .then((md) => {
      if (descEl) {descEl.innerHTML = renderMarkdown(md);}
    })
    .catch(() => {
      if (descEl) {descEl.textContent = 'Не удалось загрузить описание решения.';}
    });

  function render(): void {
    const mode = modeEls.find((el) => el.checked)?.value || 'encode';
    const text = inputEl.value || '';
    let errors: string[] = [];

    if (mode === 'encode') {
      const naive = encodeNaive(text);
      const smart = encodePrefix(text);

      naiveOutEl.textContent = naive.output;
      smartOutEl.textContent = smart.output;
      naiveMetaEl.textContent = `Длина: ${naive.bits.length} бит`;
      smartMetaEl.textContent = `Длина: ${smart.bits.length} бит`;
      errors = [...naive.errors, ...smart.errors];
    } else {
      const naive = decodeNaive(text);
      const smart = decodePrefix(text);

      naiveOutEl.textContent = naive.output;
      smartOutEl.textContent = smart.output;
      naiveMetaEl.textContent = `Длина: ${naive.bits.length} бит`;
      smartMetaEl.textContent = `Длина: ${smart.bits.length} бит`;
      errors = [...naive.errors, ...smart.errors];
    }

    errorsEl.textContent = errors.length ? errors.join('\n') : 'Ошибок нет.';
  }

  inputEl.addEventListener('input', render);
  modeEls.forEach((el) => el.addEventListener('change', render));

  inputEl.value = `Это тестовый текст для сравнения двух схем кодирования. 
Он содержит заглавные БУКВЫ, цифры 2025, знаки препинания, 
а также редкие символы: «кавычки», — тире, № и %.
Вторая строка нужна, чтобы проверить перевод строки,
и вот табуляция:\tпосле неё идёт слово.`;

  render();
}
