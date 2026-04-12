import { assignments, type Assignment } from '#modules/assignments/constants/assignments.data';
import { TabList } from '#ui/components';
import { createHashRouter, type HashRouter } from './services/router';
import { loadSolutionMarkdown, loadSolutionModule, loadTaskMarkdown } from './services/loader';
import { createAssignmentSlots, type AssignmentSlots } from './services/slots';

const template = document.createElement('template');

template.innerHTML = `<cs-assignment-layout title="Задания по курсу"></cs-assignment-layout>`;

export class AssignmentsPage extends HTMLElement {
  private layoutEl: HTMLElement | null = null;

  private tabsEl: TabList | null = null;

  private slots: AssignmentSlots;

  private activeId: string | null = null;

  private loadToken = 0;

  private readonly router: HashRouter;

  constructor() {
    super();
    this.router = createHashRouter(assignments);
    this.slots = createAssignmentSlots();
  }

  connectedCallback(): void {
    if (!this.layoutEl) {
      this.appendChild(template.content.cloneNode(true));
      this.layoutEl = this.querySelector('cs-assignment-layout');
    }

    if (this.layoutEl && !this.layoutEl.contains(this.slots.taskEl)) {
      if (!this.tabsEl) {
        this.tabsEl = document.createElement('cs-tab-list') as TabList;
        this.tabsEl.slot = 'tabs';
        this.tabsEl.items = assignments.map((item) => ({ id: item.id, title: item.title }));
      }

      this.layoutEl.append(
        this.tabsEl,
        this.slots.taskEl,
        this.slots.solutionTldrEl,
        this.slots.solutionDescriptionEl,
        this.slots.solutionEl
      );
    }

    this.loadAssignment(this.router.getInitialAssignment());

    this.addEventListener('tab-select', (event) => {
      const { detail } = event as CustomEvent<{ id: string }>;
      const item = assignments.find((entry) => entry.id === detail.id);

      if (item) {
        this.loadAssignment(item);
      }
    });

    this.router.start((item) => {
      if (item.id !== this.activeId) {
        this.loadAssignment(item);
      }
    });
  }

  disconnectedCallback(): void {
    this.router.stop();
  }

  private setActive(id: string): void {
    if (!this.tabsEl) {
      return;
    }

    this.activeId = id;
    this.tabsEl.setActive(id);
  }

  private async loadAssignment(item: Assignment): Promise<void> {
    if (!item) {
      return;
    }
    const token = this.loadToken + 1;

    this.loadToken = token;

    this.setActive(item.id);
    this.router.updateUrl(item.id);
    this.slots.taskEl.textContent = 'Загрузка...';
    this.slots.solutionTldrEl.textContent = '';
    this.slots.solutionDescriptionEl.textContent = 'Загрузка...';
    this.slots.solutionEl.textContent = 'Загрузка...';

    try {
      const taskHtml = await loadTaskMarkdown(item.taskPath);

      if (this.loadToken !== token) {
        return;
      }
      this.slots.taskEl.innerHTML = taskHtml;
    } catch (err) {
      this.slots.taskEl.textContent = 'Не удалось загрузить файл задания.';
      console.error(err);
    }

    try {
      const descriptionHtml = await loadSolutionMarkdown(item.taskPath);

      if (this.loadToken !== token) {
        return;
      }
      this.slots.solutionDescriptionEl.innerHTML = descriptionHtml;
    } catch (err) {
      this.slots.solutionDescriptionEl.textContent = 'Не удалось загрузить описание решения.';
      console.error(err);
    }

    if (item.id === 'hw-05') {
      this.slots.solutionTldrEl.innerHTML =
        '<p><strong>TL;DR:</strong> Построчный обход (row-major) быстрее обхода по столбцам ' +
        '(column-major) на больших данных за счёт лучшей локальности доступа к памяти. ' +
        'Плотные структуры (TypedArray, FlatArray) показывают наиболее стабильную и высокую ' +
        'производительность. Случайный доступ является самым дорогим сценарием и сильнее всего ' +
        'деградирует на структурах с индирекцией (ArrayOfArrays, ArrayOfObjects). JIT ускоряет ' +
        'выполнение, но не влияет на основные тренды. В данном эксперименте влияние JIT ' +
        'оказалось значительно ниже, чем влияние локальности доступа к памяти, что указывает ' +
        'на то, что задача ограничена скоростью работы с памятью.</p>';
    }

    try {
      const module = await loadSolutionModule(item.solutionModule);

      if (this.loadToken !== token) {
        return;
      }
      this.slots.solutionEl.innerHTML = module.template;
      module.init?.(this.slots.solutionEl);
    } catch (err) {
      this.slots.solutionEl.textContent = 'Решение пока не добавлено.';
      console.error(err);
    }
  }
}

customElements.define('cs-assignments-app', AssignmentsPage);
