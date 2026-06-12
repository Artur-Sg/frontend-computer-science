import Prism from 'prismjs';
import templateHtml from './solution.html?raw';
import matrix from './matrix.ts?raw';
import graph from './graph.ts?raw';

export const template = templateHtml;

export function init(root: HTMLElement): void {
  const matrixEl = root.querySelector<HTMLElement>('#matrix-code');
  const graphEl = root.querySelector<HTMLElement>('#graph-code');

  if (matrixEl) {
    matrixEl.textContent = matrix;
  }

  if (graphEl) {
    graphEl.textContent = graph;
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
