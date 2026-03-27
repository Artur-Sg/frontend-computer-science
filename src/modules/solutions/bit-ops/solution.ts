import { renderMarkdown } from '#shared/markdown';
import templateHtml from './solution.html?raw';
import styles from './solution.css?raw';

export const template = `<style>${styles}</style>${templateHtml}`;

export function init(root: HTMLElement): void {
  const descEl = root.querySelector<HTMLElement>('#solution-description');

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
}
