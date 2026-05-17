import Prism from 'prismjs';
import templateHtml from './solution.html?raw';
import matrix2dSource from './matrix2d.ts?raw';
import vectorSource from './vector.ts?raw';

export const template = templateHtml;

export function init(root: HTMLElement): void {
  const matrix2dCodeEl = root.querySelector<HTMLElement>('#matrix2d-full-code');
  const vectorCodeEl = root.querySelector<HTMLElement>('#vector-full-code');

  if (matrix2dCodeEl) {
    matrix2dCodeEl.textContent = matrix2dSource;
  }

  if (vectorCodeEl) {
    vectorCodeEl.textContent = vectorSource;
  }

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
