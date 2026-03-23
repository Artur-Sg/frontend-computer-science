(function () {
  const textarea = document.getElementById('program');
  const runBtn = document.getElementById('run');
  const output = document.getElementById('output');

  if (!textarea || !runBtn || !output) return;
  if (!window.Bytecode) return;

  const { instructions, execute } = window.Bytecode;
  const descEl = document.getElementById('solution-description');
  if (window.renderMarkdown && descEl) {
    fetch('lectures/02-languages/homework/solution.md')
      .then((res) => res.text())
      .then((md) => { descEl.innerHTML = window.renderMarkdown(md); })
      .catch(() => { descEl.textContent = 'Не удалось загрузить описание решения.'; });
  }

  const defaultProgram = `[
  "SET A",
  10,
  "PRINT A",
  "IFN A",
  "RET",
  0,
  "DEC A",
  "JMP",
  2
]`;

  textarea.value = defaultProgram;

  function parseProgram(text) {
    const cleaned = text
      .replace(/\/\/.*$/gm, '')
      .replace(/\s+/g, ' ')
      .trim();

    const data = JSON.parse(cleaned);
    if (!Array.isArray(data)) throw new Error('Программа должна быть массивом');

    const program = data.map((item) => {
      if (typeof item === 'string') {
        if (!(item in instructions)) {
          throw new Error(`Неизвестная инструкция: ${item}`);
        }
        return instructions[item];
      }
      return item;
    });

    return program;
  }

  function run() {
    try {
      const program = parseProgram(textarea.value);
      const result = execute(program);
      const lines = result.out.join('\n');
      const ret = result.returnValue;

      output.textContent = `${lines}\nRESULT: ${ret}`.trim();
    } catch (err) {
      output.textContent = `Ошибка: ${err.message}`;
    }
  }

  runBtn.addEventListener('click', run);

  run();
})();
