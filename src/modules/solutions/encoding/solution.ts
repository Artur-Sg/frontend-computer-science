import templateHtml from './solution.html?raw';
import { decode as decodeNaive, encode as encodeNaive } from './naive-codec';
import { decode as decodePrefix, encode as encodePrefix } from './prefix-codec';

export const template = templateHtml;

export function init(root: HTMLElement): void {
  const inputEl = root.querySelector<HTMLTextAreaElement>('#input');
  const naiveOutEl = root.querySelector<HTMLElement>('#naive-output');
  const smartOutEl = root.querySelector<HTMLElement>('#smart-output');
  const naiveCard = root.querySelector<HTMLElement>('#naive-card');
  const smartCard = root.querySelector<HTMLElement>('#smart-card');
  const errorsEl = root.querySelector<HTMLElement>('#errors');
  const modeEls = Array.from(root.querySelectorAll<HTMLInputElement>('input[name="mode"]'));
  if (!inputEl || !naiveOutEl || !smartOutEl || !errorsEl || !naiveCard || !smartCard) {return;}

  function render(): void {
    const mode = modeEls.find((el) => el.checked)?.value || 'encode';
    const text = inputEl.value || '';
    let errors: string[] = [];

    if (mode === 'encode') {
      const naive = encodeNaive(text);
      const smart = encodePrefix(text);

      naiveOutEl.textContent = naive.output;
      smartOutEl.textContent = smart.output;
      naiveCard.setAttribute('meta', `Длина: ${naive.bits.length} бит`);
      smartCard.setAttribute('meta', `Длина: ${smart.bits.length} бит`);
      errors = [...naive.errors, ...smart.errors];
    } else {
      const naive = decodeNaive(text);
      const smart = decodePrefix(text);

      naiveOutEl.textContent = naive.output;
      smartOutEl.textContent = smart.output;
      naiveCard.setAttribute('meta', `Длина: ${naive.bits.length} бит`);
      smartCard.setAttribute('meta', `Длина: ${smart.bits.length} бит`);
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
