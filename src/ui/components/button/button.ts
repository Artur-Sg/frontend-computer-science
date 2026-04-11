import templateHtml from './button.html?raw';
import styles from './button.css?raw';
import { cache } from '#decorators/cache';

const template = document.createElement('template');

template.innerHTML = `<style>${styles}</style>${templateHtml}`;

export class CsButton extends HTMLElement {
  @cache
  private get button(): HTMLButtonElement {
    return this.shadowRoot?.querySelector('button') as HTMLButtonElement;
  }

  static get observedAttributes(): string[] {
    return ['label', 'icon'];
  }

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });

    root.appendChild(template.content.cloneNode(true));
    this.update();
  }

  connectedCallback(): void {
    this.update();
  }

  attributeChangedCallback(): void {
    this.update();
  }

  private update(): void {
    const label = this.getAttribute('label') ?? '';

    this.button.textContent = label;
  }
}

customElements.define('cs-button', CsButton);
