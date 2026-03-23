const assignments = [
  {
    id: 'hw-01',
    title: 'ДЗ №1. Кодирование',
    taskPath: 'lectures/01-encoding/homework/homework.md',
    solutionPath: 'lectures/01-encoding/homework/solution.html',
    solutionScripts: [
      'lectures/01-encoding/homework/naive-codec.js',
      'lectures/01-encoding/homework/prefix-codec.js',
      'lectures/01-encoding/homework/solution.js'
    ]
  },
  {
    id: 'hw-02',
    title: 'ДЗ №2. Интерпретатор байткода',
    taskPath: 'lectures/02-languages/homework/homework.md',
    solutionPath: 'lectures/02-languages/homework/solution.html',
    solutionScripts: [
      'lectures/02-languages/homework/execute.js',
      'lectures/02-languages/homework/solution.js'
    ]
  }
];

const tabsEl = document.getElementById('tabs');
const taskEl = document.getElementById('task-content');
const solutionEl = document.getElementById('solution-content');


function setActive(id) {
  for (const btn of tabsEl.querySelectorAll('button')) {
    btn.setAttribute('aria-selected', btn.dataset.id === id ? 'true' : 'false');
  }
}

async function loadText(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.text();
}

function renderMarkdown(md) {
  return window.marked.parse(md);
}

function renderContent(el, path, text) {
  if (path.endsWith('.html')) {
    el.innerHTML = text;
  } else {
    el.innerHTML = renderMarkdown(text);
  }
}

window.renderMarkdown = renderMarkdown;

function removeScripts(prefix) {
  document.querySelectorAll(`script[data-solution=\"${prefix}\"]`).forEach((el) => el.remove());
}

async function loadScripts(paths, prefix) {
  if (!paths || !paths.length) return;
  removeScripts(prefix);

  for (const path of paths) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = path;
      script.async = false;
      script.dataset.solution = prefix;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }
}

async function loadAssignment(item) {
  setActive(item.id);
  taskEl.textContent = 'Загрузка...';
  solutionEl.textContent = 'Загрузка...';

  try {
    const taskText = await loadText(item.taskPath);
    renderContent(taskEl, item.taskPath, taskText);
  } catch (err) {
    taskEl.textContent = 'Не удалось загрузить файл задания.';
    console.error(err);
  }

  try {
        const solutionText = await loadText(item.solutionPath);
        renderContent(solutionEl, item.solutionPath, solutionText);
        await loadScripts(item.solutionScripts, item.id);
      } catch (err) {
        solutionEl.textContent = 'Решение пока не добавлено.';
        console.error(err);
      }
}

for (const item of assignments) {
  const btn = document.createElement('button');
  btn.className = 'tab';
  btn.type = 'button';
  btn.role = 'tab';
  btn.dataset.id = item.id;
  btn.textContent = item.title;
  btn.addEventListener('click', () => loadAssignment(item));
  tabsEl.appendChild(btn);
}

loadAssignment(assignments[0]);
