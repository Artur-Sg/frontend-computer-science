import { strict as assert } from 'node:assert';
import { calc, format, zipStr } from './advanced-regular-expressions';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✔ ${name}`);
  } catch (error) {
    console.error(`✘ ${name}`);
    throw error;
  }
}

test('zipStr схлопывает подряд идущие повторения символов', () => {
  assert.equal(zipStr('abbaabbafffbezza'), 'abafbeza');
  assert.equal(zipStr('aaabbbccc'), 'abc');
  assert.equal(zipStr('a'), 'a');
  assert.equal(zipStr(''), '');
});

test('format подставляет значения из объекта в шаблон', () => {
  assert.equal(
    format('Hello, ${user}! Your age is ${age}.', { user: 'Bob', age: 10 }),
    'Hello, Bob! Your age is 10.',
  );
  assert.equal(
    format('${greeting}, ${name}!', { greeting: 'Hi', name: 'Alice' }),
    'Hi, Alice!',
  );
});

test('format оставляет неизвестные плейсхолдеры без падения', () => {
  assert.equal(
    format('Hello, ${user}! ${missing}', { user: 'Bob' }),
    'Hello, Bob! ${missing}',
  );
});

test('calc вычисляет арифметические выражения в строке', () => {
  assert.equal(
    calc(`
Какой-то текст (10 + 15 - 24) ** 2
Еще какой-то текст 2 * 10
`),
    `
Какой-то текст 1
Еще какой-то текст 20
`,
  );
});

test('calc оставляет строки без выражений как есть', () => {
  assert.equal(calc('Просто текст без вычислений'), 'Просто текст без вычислений');
});

console.log('Advanced regular expressions tests done');
