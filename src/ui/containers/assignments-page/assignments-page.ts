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
        '(column-major) на больших данных, потому что данные читаются подряд из памяти. ' +
        'FlatArray и TypedArray показывают наиболее стабильную и высокую производительность. ' +
        'Случайный доступ самый дорогой и сильнее всего замедляет структуры с дополнительными ' +
        'уровнями доступа (ArrayOfArrays, ArrayOfObjects). JIT ускоряет выполнение, но не оказывает значительного влияния и не ' +
        'меняет основные закономерности - похоже всё в первую очередь упирается ' +
        'в работу с памятью.</p>';
    } else if (item.id === 'hw-06') {
      this.slots.solutionTldrEl.innerHTML =
        '<h3>TL;DR</h3>' +
        '<ul>' +
        '<li><code>push</code> и <code>pop</code> работают очень быстро и почти не зависят от размера массива.</li>' +
        '<li><code>shift</code> и <code>unshift</code> в тысячи раз медленнее, так как требуют сдвига элементов.</li>' +
        '<li>С увеличением размера массива разница становится ещё заметнее.</li>' +
        '<li>Массивы с дырками (holey) могут работать хуже, но эффект зависит от операции.</li>' +
        '<li>Во второй части (CircularBuffer) все операции остаются близкими по стоимости и почти не зависят от размера.</li>' +
        '</ul>';
    } else if (item.id === 'hw-07') {
      this.slots.solutionTldrEl.innerHTML =
        '<h3>TL;DR</h3>' +
        '<ul>' +
        '<li>Реализованы два формата: <strong>базовый</strong> и <strong>с указателями</strong>.</li>' +
        '<li>Базовый формат компактнее по памяти, но <code>at(index)</code> имеет линейную сложность.</li>' +
        '<li>В формате с указателями доступ по индексу выполняется за <code>O(1)</code> + декодирование и почти не зависит от позиции строки.</li>' +
        '<li>На размере 10 000: <code>basic.at(-1) ≈ 15.00 мкс</code>, <code>pointers.at(-1) ≈ 0.12 мкс</code> (≈ 128.7x быстрее).</li>' +
        '<li>Цена за быстрый произвольный доступ: формат с указателями занимает примерно в 1.3-1.36 раза больше памяти.</li>' +
        '<li><code>set(index, value)</code> в текущей реализации работает через полную пересборку буфера (<code>decode → изменение → encode</code>), поэтому имеет сложность <code>O(n)</code>.</li>' +
        '<li>Итог: базовый формат — экономия памяти, но медленный произвольный доступ; формат с указателями — быстрый <code>at</code>, но больше памяти; <code>set</code> пока медленный и может быть оптимизирован.</li>' +
        '</ul>';
    } else if (item.id === 'hw-08') {
      this.slots.solutionTldrEl.innerHTML =
        '<h3>TL;DR</h3>' +
        '<ul>' +
        '<li>Для больших файлов CSV выгодно парсить потоком: первая запись доступна раньше, а память расходуется стабильнее.</li>' +
        '<li><code>JSON.parse</code> проще и часто быстрый по CPU, но требует загрузки всего файла в память.</li>' +
        '<li>MessagePack обычно компактнее и эффективнее в бинарном pipeline, но добавляет сложность интеграции.</li>' +
        '<li>Результат CSV сильно зависит от реализации парсера: regex-вариант заметно медленнее, чем простой <code>split</code> на этом наборе данных.</li>' +
        '<li>Выбор формата делается по метрикам: общее время, latency до первой записи, пик памяти, размер raw/gzip.</li>' +
        '</ul>';
    } else if (item.id === 'hw-09') {
      this.slots.solutionTldrEl.innerHTML =
        '<h3>TL;DR</h3>' +
        '<ul>' +
        '<li>Бинарная <code>Matrix2D</code> (сырые RGBA-байты) значительно компактнее и быстрее JSON-представлений.</li>' +
        '<li>Для <code>1024x1024</code>: <code>binary = 4.00 MB</code>, <code>JSON flat = 14.71 MB</code>, <code>JSON nested = 16.71 MB</code>.</li>' +
        '<li>Даже после <code>gzip</code> бинарный формат меньше: <code>0.89 MB</code> против <code>1.22–1.28 MB</code>.</li>' +
        '<li><code>Vector&lt;RGBAView&gt;</code> быстрее <code>Array&lt;RGBAObject&gt;</code>: примерно <code>1.49x</code> в базовом и <code>3.07x</code> в стресс-сценарии.</li>' +
        '<li>По памяти <code>Vector</code> хранит основную часть данных в <code>ArrayBuffer</code>, а массив объектов — как множество JS-объектов в куче (<code>heapUsed</code>), поэтому массив объектов создаёт больше работы для GC.</li>' +
        '</ul>';
    } else if (item.id === 'hw-10') {
      this.slots.solutionTldrEl.innerHTML =
        '<h3>TL;DR</h3>' +
        '<ul>' +
        '<li>Реализованы две версии дека: <code>Dequeue&lt;T&gt;</code> на связном списке блоков и <code>ReallocDequeue&lt;T&gt;</code> на одном массиве с реаллокацией.</li>' +
        '<li>В большинстве сценариев блочная реализация быстрее: <code>push/pop</code> — примерно <code>1.92x</code>, <code>unshift/shift</code> — <code>1.62x</code>, <code>mixed</code> — <code>2.16x</code>.</li>' +
        '<li>В сценарии <code>stress growth</code> (много циклов "добавить большую пачку с двух сторон → удалить большую пачку с двух сторон") быстрее оказался <code>ReallocDequeue</code>: <code>1.97 ms</code> против <code>2.54 ms</code> у блочной реализации. Причина: после расширения он переиспользует один большой массив, а блочный дек часто создаёт и удаляет отдельные блоки.</li>' +
        '<li>Итог: блочный дек избегает полного копирования при росте и хорошо подходит для операций с обоих концов, но имеет накладные расходы на блоки, ссылки и аллокации узлов.</li>' +
        '</ul>';
    } else if (item.id === 'hw-11') {
      this.slots.solutionTldrEl.innerHTML =
        '<h3>TL;DR</h3>' +
        '<ul>' +
        '<li><code>Memory</code> управляет одним общим <code>ArrayBuffer</code>, разделённым на два региона: <code>stack</code> и <code>heap</code>.</li>' +
        '<li><code>stack</code> начинается с <code>offset = 0</code>, растёт вперёд до <code>stackSize</code> и работает строго по <code>LIFO</code> через <code>push/pop</code>.</li>' +
        '<li><code>heap</code> начинается после стекового региона, поддерживает <code>alloc/free</code>, переиспользует освобождённые блоки и склеивает соседние свободные диапазоны.</li>' +
        '<li><code>Pointer</code> — безопасная обёртка над <code>offset + size</code>: после <code>pop/free</code> указатель становится недействительным, а повторный <code>free()</code> выбрасывает ошибку.</li>' +
        '</ul>';
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
