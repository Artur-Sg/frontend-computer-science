import templateHtml from './tab-list.html?raw';
import styles from './tab-list.css?raw';

type TabItem = {
  id: string;
  title: string;
};

const template = document.createElement('template');

template.innerHTML = `<style>${styles}</style>${templateHtml}`;

export class TabList extends HTMLElement {
  private container: HTMLDivElement | null = null;

  private tabs: TabItem[] = [];

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });

    root.appendChild(template.content.cloneNode(true));
    this.container = root.querySelector<HTMLDivElement>('.tabs');
  }

  set items(value: TabItem[]) {
    this.tabs = Array.isArray(value) ? value : [];
    this.render();
  }

  get items(): TabItem[] {
    return this.tabs;
  }

  connectedCallback(): void {
    this.render();
  }

  setActive(id: string): void {
    if (!this.container) {
      return;
    }

    for (const tab of Array.from(this.container.children)) {
      if (tab.getAttribute('tab-id') === id) {
        tab.setAttribute('selected', 'true');
      } else {
        tab.removeAttribute('selected');
      }
    }
  }

  private render(): void {
    if (!this.container) {
      return;
    }

    this.container.innerHTML = '';

    for (const item of this.tabs) {
      const tab = document.createElement('cs-tab');

      tab.setAttribute('tab-id', item.id);
      tab.setAttribute('label', item.title);
      tab.addEventListener('tab-select', (event) => {
        this.dispatchEvent(
          new CustomEvent('tab-select', {
            detail: (event as CustomEvent).detail,
            bubbles: true,
            composed: true
          })
        );
      });
      this.container.appendChild(tab);
    }
  }
}

customElements.define('cs-tab-list', TabList);
