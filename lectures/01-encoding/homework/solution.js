(function () {
  const inputEl = document.getElementById('input');
  const naiveOutEl = document.getElementById('naive-output');
  const smartOutEl = document.getElementById('smart-output');
  const naiveMetaEl = document.getElementById('naive-meta');
  const smartMetaEl = document.getElementById('smart-meta');
  const errorsEl = document.getElementById('errors');
  const modeEls = Array.from(document.querySelectorAll('input[name="mode"]'));
  const descEl = document.getElementById('solution-description');

  if (!inputEl || !naiveOutEl || !smartOutEl) return;
  if (!window.NaiveCodec || !window.PrefixCodec) return;
  if (!window.renderMarkdown) return;

  fetch('lectures/01-encoding/homework/solution.md')
    .then((res) => res.text())
    .then((md) => {
      if (descEl) descEl.innerHTML = window.renderMarkdown(md);
    })
    .catch(() => {
      if (descEl) descEl.textContent = 'Не удалось загрузить описание решения.';
    });

  function render() {
    const mode = modeEls.find((el) => el.checked)?.value || 'encode';
    const text = inputEl.value || '';
    let errors = [];

    if (mode === 'encode') {
      const naive = window.NaiveCodec.encode(text);
      const smart = window.PrefixCodec.encode(text);

      naiveOutEl.textContent = naive.output;
      smartOutEl.textContent = smart.output;
      naiveMetaEl.textContent = `Длина: ${naive.bits.length} бит`;
      smartMetaEl.textContent = `Длина: ${smart.bits.length} бит`;
      errors = [...naive.errors, ...smart.errors];
    } else {
      const naive = window.NaiveCodec.decode(text);
      const smart = window.PrefixCodec.decode(text);

      naiveOutEl.textContent = naive.output;
      smartOutEl.textContent = smart.output;
      naiveMetaEl.textContent = `Длина: ${naive.bits.length} бит`;
      smartMetaEl.textContent = `Длина: ${smart.bits.length} бит`;
      errors = [...naive.errors, ...smart.errors];
    }

    errorsEl.textContent = errors.length ? errors.join('\n') : 'Ошибок нет.';
  }

  inputEl.addEventListener('input', render);
  modeEls.forEach((el) => el.addEventListener('change', render));

  inputEl.value = `Это тестовый текст для сравнения двух схем кодирования. 
Он содержит заглавные БУКВЫ, цифры 2025, знаки препинания, 
а также редкие символы: «кавычки», — тире, № и %.
Вторая строка нужна, чтобы проверить перевод строки,
и вот табуляция:\tпосле неё идёт слово.`;
  render();
})();
