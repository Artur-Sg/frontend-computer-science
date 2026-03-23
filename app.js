const assignments = [
  {
    id: 'hw-01',
    title: 'ДЗ 01 — Кодирование',
    taskPath: 'lectures/01-encoding/homework.md',
    solutionPath: 'lectures/01-encoding/solution.html',
    solutionScripts: [
      'lectures/01-encoding/naive-codec.js',
      'lectures/01-encoding/prefix-codec.js',
      'lectures/01-encoding/solution.js'
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

function renderContent(el, path, text) {
  if (path.endsWith('.html')) {
    el.innerHTML = text;
  } else {
    el.innerHTML = renderMarkdown(text);
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inlineFormat(text) {
  let out = escapeHtml(text);
  out = out.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return out;
}

function renderMarkdown(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let i = 0;
  let inCode = false;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (!inCode) {
        inCode = true;
        html.push('<pre><code>');
      } else {
        inCode = false;
        html.push('</code></pre>');
      }
      i++;
      continue;
    }

    if (inCode) {
      html.push(escapeHtml(line));
      i++;
      continue;
    }

    if (line.trim() === '') {
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line.trim())) {
      html.push('<hr />');
      i++;
      continue;
    }

    // Tables
    const next = lines[i + 1] || '';
    const isTableHeader = line.includes('|') && /^[\s|:-]+$/.test(next);
    if (isTableHeader) {
      const headerCells = line.split('|').map((c) => c.trim()).filter(Boolean);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        const cells = lines[i].split('|').map((c) => c.trim()).filter(Boolean);
        rows.push(cells);
        i++;
      }
      html.push('<table><thead><tr>');
      for (const cell of headerCells) html.push(`<th>${inlineFormat(cell)}</th>`);
      html.push('</tr></thead><tbody>');
      for (const row of rows) {
        html.push('<tr>');
        for (const cell of row) html.push(`<td>${inlineFormat(cell)}</td>`);
        html.push('</tr>');
      }
      html.push('</tbody></table>');
      continue;
    }

    // Headings
    if (line.startsWith('#')) {
      const level = Math.min(line.match(/^#+/)[0].length, 6);
      const text = line.slice(level).trim();
      html.push(`<h${level}>${inlineFormat(text)}</h${level}>`);
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      html.push(`<blockquote>${inlineFormat(line.replace(/^>\s?/, ''))}</blockquote>`);
      i++;
      continue;
    }

    // Lists
    if (/^[-*+]\s+/.test(line)) {
      html.push('<ul>');
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        html.push(`<li>${inlineFormat(lines[i].replace(/^[-*+]\s+/, ''))}</li>`);
        i++;
      }
      html.push('</ul>');
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      html.push('<ol>');
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        html.push(`<li>${inlineFormat(lines[i].replace(/^\d+\.\s+/, ''))}</li>`);
        i++;
      }
      html.push('</ol>');
      continue;
    }

    // Paragraph
    html.push(`<p>${inlineFormat(line)}</p>`);
    i++;
  }

  return html.join('\n');
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
