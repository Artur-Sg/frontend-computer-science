import { marked } from 'marked';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';

declare global {
  interface Window {
    renderMarkdown?: (md: string) => string;
  }
}

export function renderMarkdown(md: string): string {
  const html = marked.parse(md) as string;

  return highlightMarkdown(html);
}

export function exposeMarkdownRenderer(): void {
  window.renderMarkdown = renderMarkdown;
}

function highlightMarkdown(html: string): string {
  const container = document.createElement('div');

  container.innerHTML = html;

  const blocks = container.querySelectorAll<HTMLElement>('pre code');

  blocks.forEach((codeEl) => {
    const className = Array.from(codeEl.classList).find((name) => name.startsWith('language-'));
    const lang = className ? className.replace('language-', '') : 'markup';
    const grammar = Prism.languages[lang] ?? Prism.languages.markup;
    const code = codeEl.textContent ?? '';

    codeEl.innerHTML = Prism.highlight(code, grammar, lang);
    codeEl.classList.add(`language-${lang}`);
    codeEl.parentElement?.classList.add(`language-${lang}`);
  });

  return container.innerHTML;
}
