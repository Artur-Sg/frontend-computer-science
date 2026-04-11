import templateHtml from './assignment-layout.html?raw';
import styles from './assignment-layout.css?raw';
import { cache } from '#decorators/cache';

const template = document.createElement('template');

template.innerHTML = `<style>${styles}</style>${templateHtml}`;

export class AssignmentLayout extends HTMLElement {
  @cache
  private get titleEl(): HTMLElement | null {
    return this.shadowRoot?.getElementById('title') ?? null;
  }

  static get observedAttributes(): string[] {
    return ['title'];
  }

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });

    root.appendChild(template.content.cloneNode(true));
  }

  connectedCallback(): void {
    this.syncTitle();
  }

  attributeChangedCallback(): void {
    this.syncTitle();
  }

  private syncTitle(): void {
    if (!this.titleEl) {
      return;
    }

    this.titleEl.textContent = this.getAttribute('title') ?? 'Задания по курсу';
  }
}

customElements.define('cs-assignment-layout', AssignmentLayout);
