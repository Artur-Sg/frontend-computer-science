import templateHtml from './card.html?raw';
import styles from './card.css?raw';
import { cache } from '#decorators/cache';

const template = document.createElement('template');

template.innerHTML = `<style>${styles}</style>${templateHtml}`;

export class Card extends HTMLElement {
  @cache
  private get titleEl(): HTMLElement | null {
    return this.shadowRoot?.getElementById('title') ?? null;
  }

  @cache
  private get metaEl(): HTMLElement | null {
    return this.shadowRoot?.getElementById('meta') ?? null;
  }

  static get observedAttributes(): string[] {
    return ['title', 'meta', 'wrap'];
  }

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });

    root.appendChild(template.content.cloneNode(true));
  }

  connectedCallback(): void {
    this.sync();
  }

  attributeChangedCallback(): void {
    this.sync();
  }

  private sync(): void {
    if (this.titleEl) {
      this.titleEl.textContent = this.getAttribute('title') ?? '';
    }

    if (this.metaEl) {
      const meta = this.getAttribute('meta');

      this.metaEl.textContent = meta ?? '';
      this.metaEl.dataset.visible = meta ? 'true' : 'false';
    }

    const wrap = this.getAttribute('wrap');

    if (wrap === 'soft') {
      this.setAttribute('wrap', 'soft');
    } else {
      this.removeAttribute('wrap');
    }
  }
}

customElements.define('cs-card', Card);
