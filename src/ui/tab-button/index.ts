import templateHtml from './tab-button.html?raw';
import styles from './tab-button.css?raw';

const template = document.createElement('template');

template.innerHTML = `<style>${styles}</style>${templateHtml}`;

export class TabButton extends HTMLElement {
  private button: HTMLButtonElement | null = null;

  static get observedAttributes(): string[] {
    return ['label', 'selected'];
  }

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });

    root.appendChild(template.content.cloneNode(true));
    this.button = root.querySelector('button');
  }

  connectedCallback(): void {
    this.button?.addEventListener('click', this.handleClick);
    this.sync();
  }

  disconnectedCallback(): void {
    this.button?.removeEventListener('click', this.handleClick);
  }

  attributeChangedCallback(): void {
    this.sync();
  }

  private handleClick = (): void => {
    const id = this.getAttribute('tab-id') || '';

    this.dispatchEvent(
      new CustomEvent('tab-select', {
        bubbles: true,
        composed: true,
        detail: { id }
      })
    );
  };

  private sync(): void {
    if (!this.button) {return;}
    const label = this.getAttribute('label') || '';
    const selected = this.hasAttribute('selected');

    this.button.textContent = label;
    this.button.dataset.selected = selected ? 'true' : 'false';
  }
}

customElements.define('cs-tab', TabButton);
