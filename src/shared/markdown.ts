import { marked } from 'marked';

declare global {
  interface Window {
    renderMarkdown?: (md: string) => string;
  }
}

export function renderMarkdown(md: string): string {
  return marked.parse(md) as string;
}

export function exposeMarkdownRenderer(): void {
  window.renderMarkdown = renderMarkdown;
}
