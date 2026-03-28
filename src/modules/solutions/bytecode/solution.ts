import { renderMarkdown } from '#shared/markdown';
import templateHtml from './solution.html?raw';
import { instructions, execute } from './execute';

export const template = templateHtml;

export function init(root: HTMLElement): void {
  const textarea = root.querySelector<HTMLTextAreaElement>('#program');
  const runBtn = root.querySelector<HTMLButtonElement>('#run');
  const output = root.querySelector<HTMLElement>('#output');
  const descEl = root.querySelector<HTMLElement>('#solution-description');

  if (!textarea || !runBtn || !output) {return;}

  fetch('lectures/02-languages/homework/solution.md')
    .then((res) => res.text())
    .then((md) => {
      if (descEl) {descEl.innerHTML = renderMarkdown(md);}
    })
    .catch(() => {
      if (descEl) {descEl.textContent = 'Не удалось загрузить описание решения.';}
    });

  const defaultProgram = `[
    "SET A",
    10,
    "PRINT A",
    "IFN A",
    "RET",
    0,
    "DEC A",
    "JMP",
    2
  ]`;

  textarea.value = defaultProgram;

  function parseProgram(text: string): number[] {
    const cleaned = text
      .replace(/\/\/.*$/gm, '')
      .replace(/\s+/g, ' ')
      .trim();

    const data = JSON.parse(cleaned);

    if (!Array.isArray(data)) {throw new Error('Программа должна быть массивом');}

    const program = data.map((item) => {
      if (typeof item === 'string') {
        if (!(item in instructions)) {throw new Error(`Неизвестная инструкция: ${item}`);}

        return instructions[item as keyof typeof instructions];
      }

return item;
    });

    return program;
  }

  function run(): void {
    if (!output) {
      return;
    }

    try {
      const program = parseProgram(textarea?.value ?? '');
      const result = execute(program);
      const lines = result.out.join('\n');
      const ret = result.returnValue;

      output.textContent = `${lines}\nRESULT: ${ret}`.trim();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      output.textContent = `Ошибка: ${message}`;
    }
  }

  runBtn.addEventListener('click', run);

  run();
}
