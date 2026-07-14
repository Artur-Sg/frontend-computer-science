import Prism from 'prismjs';
import templateHtml from './solution.html?raw';
import code from './regex.ts?raw';

export const template = templateHtml;

export function init(root: HTMLElement): void {
  const codeEl = root.querySelector<HTMLElement>('#regex-code');

  if (codeEl) {
    codeEl.textContent = code;
  }

  const blocks = root.querySelectorAll<HTMLElement>('pre code');

  blocks.forEach((block) => {
    const className = Array.from(block.classList).find((name) => name.startsWith('language-'));
    const lang = className ? className.replace('language-', '') : 'markup';
    const grammar =
      Prism.languages[lang] ??
      Prism.languages.typescript ??
      Prism.languages.javascript ??
      Prism.languages.markup;
    const source = block.textContent ?? '';

    block.innerHTML = Prism.highlight(source, grammar, lang);
    block.classList.add(`language-${lang}`);
    block.parentElement?.classList.add(`language-${lang}`);
  });
}
