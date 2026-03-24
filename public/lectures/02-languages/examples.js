// Lecture 02 — runnable examples

const { performance } = require('perf_hooks');

const sep = () => console.log('---');

console.log('1) Текстовый интерпретатор (VAR/SET/SHOW)');
{
  function execText(code) {
    const variables = {};

    code
      .split(/[\n;]+/)
      .map((op) => op.trim())
      .filter(Boolean)
      .forEach((op) => {
        const parts = op.split(/\s+/);
        const cmd = parts[0];
        const name = parts[1];
        const value = parts[2];

        switch (cmd) {
          case 'VAR':
            if (!/^[a-z]+$/.test(name)) throw new SyntaxError('Invalid variable name');
            variables[name] = undefined;
            break;
          case 'SET':
            if (!/^[a-z]+$/.test(name)) throw new SyntaxError('Invalid variable name');
            if (!/^-?\d+$/.test(value)) throw new SyntaxError('Invalid value');
            variables[name] = parseInt(value, 10);
            break;
          case 'SHOW':
            if (!/^[a-z]+$/.test(name)) throw new SyntaxError('Invalid variable name');
            console.log(variables[name]);
            break;
          default:
            throw new SyntaxError(`Unknown opcode: ${cmd}`);
        }
      });
  }

  execText(`
VAR a
SET a 42
SHOW a
`);
}

sep();

console.log('2) Байткод-интерпретатор (VAR/SET/SHOW)');
{
  const VAR = 1;
  const SET = 2;
  const SHOW = 3;

  function execBytecode(code) {
    const variables = {};

    for (let ptr = 0; ptr < code.length; ptr++) {
      const op = code[ptr];

      switch (op) {
        case VAR: {
          const name = String.fromCodePoint(code[++ptr]);
          variables[name] = undefined;
          break;
        }
        case SET: {
          const name = String.fromCodePoint(code[++ptr]);
          const value = code[++ptr];
          variables[name] = value;
          break;
        }
        case SHOW: {
          const name = String.fromCodePoint(code[++ptr]);
          console.log(variables[name]);
          break;
        }
        default:
          throw new Error(`Unknown opcode: ${op}`);
      }
    }
  }

  execBytecode(new Uint32Array([
    VAR, 'a'.codePointAt(0),
    SET, 'a'.codePointAt(0), 42,
    SHOW, 'a'.codePointAt(0)
  ]));
}

sep();

console.log('3) JIT-разогрев: с eval и без eval');
{
  function measureTime(fn, iterations = 100000, description = '') {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) fn();
    const end = performance.now();
    const totalTime = end - start;
    const avgTime = totalTime / iterations;

    console.log(`${description}:`);
    console.log(` Всего: ${totalTime.toFixed(3)} мс (${iterations.toLocaleString()} итераций)`);
    console.log(` Среднее: ${(avgTime * 1000).toFixed(3)} нс на итерацию`);
    console.log(` Операций/сек: ${Math.floor(iterations / (totalTime / 1000)).toLocaleString()}`);

    return { totalTime, avgTime };
  }

  function mathFn(x) {
    let result = 0;
    for (let i = 0; i < 10; i++) {
      result += Math.sin(x) * Math.cos(x) + Math.sqrt(Math.abs(x));
    }
    return result;
  }

  function mathFnWithEval(x) {
    let result = 0;
    for (let i = 0; i < 10; i++) {
      eval('result += Math.sin(x) * Math.cos(x) + Math.sqrt(Math.abs(x))');
    }
    return result;
  }

  console.log('Без eval:');
  const coldMath = measureTime(() => mathFn(42.5), 100000, ' Холодный запуск');
  const hotMath = measureTime(() => mathFn(42.5), 100000, ' Горячий запуск');
  console.log(` Ускорение: ${(coldMath.avgTime / hotMath.avgTime).toFixed(2)}x`);

  sep();

  console.log('С eval (обычно блокирует оптимизации JIT):');
  const coldEval = measureTime(() => mathFnWithEval(42.5), 100000, ' Холодный запуск');
  const hotEval = measureTime(() => mathFnWithEval(42.5), 100000, ' Горячий запуск');
  console.log(` Ускорение: ${(coldEval.avgTime / hotEval.avgTime).toFixed(2)}x`);
}
