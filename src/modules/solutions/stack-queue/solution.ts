import Prism from 'prismjs';
import templateHtml from './solution.html?raw';
import dequeueSource from './dequeue.ts?raw';
import reallocDequeueSource from './realloc-dequeue.ts?raw';

export const template = templateHtml;

export function init(root: HTMLElement): void {
  const dequeueCodeEl = root.querySelector<HTMLElement>('#dequeue-code');
  const reallocDequeueCodeEl = root.querySelector<HTMLElement>('#realloc-dequeue-code');

  if (dequeueCodeEl) {
    dequeueCodeEl.textContent = dequeueSource;
  }

  if (reallocDequeueCodeEl) {
    reallocDequeueCodeEl.textContent = reallocDequeueSource;
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
