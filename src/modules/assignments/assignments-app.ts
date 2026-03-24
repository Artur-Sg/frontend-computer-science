import { assignments, type Assignment } from '#modules/assignments/constants/assignments.data';
import { fetchText } from '#shared/fetch';
import { renderMarkdown } from '#shared/markdown';
import { solutionLoaders } from '#modules/solutions/registry';
import styles from './assignments-app.css?raw';
import templateHtml from './assignments-app.html?raw';

const template = document.createElement('template');

template.innerHTML = `<style>${styles}</style>${templateHtml}`;

export class AssignmentsApp extends HTMLElement {
  private tabsEl: HTMLElement | null = null;

  private taskEl: HTMLDivElement;

  private solutionEl: HTMLDivElement;

  private activeId: string | null = null;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });

    root.appendChild(template.content.cloneNode(true));
    this.tabsEl = root.getElementById('tabs');

    this.taskEl = document.createElement('div');
    this.taskEl.className = 'content';
    this.taskEl.slot = 'task';
    this.taskEl.textContent = 'Загрузка...';

    this.solutionEl = document.createElement('div');
    this.solutionEl.className = 'content';
    this.solutionEl.slot = 'solution';
    this.solutionEl.textContent = 'Загрузка...';
  }

  connectedCallback(): void {
    if (!this.contains(this.taskEl)) {
      this.append(this.taskEl, this.solutionEl);
    }

    this.renderTabs();
    this.loadAssignment(assignments[0]);

    this.addEventListener('tab-select', (event) => {
      const {detail} = (event as CustomEvent<{ id: string }>);
      const item = assignments.find((entry) => entry.id === detail.id);

      if (item) {this.loadAssignment(item);}
    });
  }

  private renderTabs(): void {
    if (!this.tabsEl) {return;}
    this.tabsEl.innerHTML = '';

    for (const item of assignments) {
      const tab = document.createElement('cs-tab');

      tab.setAttribute('tab-id', item.id);
      tab.setAttribute('label', item.title);
      this.tabsEl.appendChild(tab);
    }
  }

  private setActive(id: string): void {
    if (!this.tabsEl) {return;}
    this.activeId = id;
    for (const tab of Array.from(this.tabsEl.children)) {
      if (tab.getAttribute('tab-id') === id) {
        tab.setAttribute('selected', 'true');
      } else {
        tab.removeAttribute('selected');
      }
    }
  }

  private async renderContent(el: HTMLElement, path: string, text: string): Promise<void> {
    el.innerHTML = renderMarkdown(text);
  }

  private async loadAssignment(item: Assignment): Promise<void> {
    if (!item) {return;}
    this.setActive(item.id);
    this.taskEl.textContent = 'Загрузка...';
    this.solutionEl.textContent = 'Загрузка...';

    try {
      const taskText = await fetchText(item.taskPath);

      await this.renderContent(this.taskEl, item.taskPath, taskText);
    } catch (err) {
      this.taskEl.textContent = 'Не удалось загрузить файл задания.';
      console.error(err);
    }

    try {
      const loader = solutionLoaders[item.solutionModule];

      if (!loader) {throw new Error(`Нет модуля решения для ${item.solutionModule}`);}
      const module = await loader();

      this.solutionEl.innerHTML = module.template;
      module.init?.(this.solutionEl);
    } catch (err) {
      this.solutionEl.textContent = 'Решение пока не добавлено.';
      console.error(err);
    }
  }
}

customElements.define('cs-assignments', AssignmentsApp);
