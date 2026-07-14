import { strict as assert } from 'node:assert';
import { numberRegex, passwordRegex } from './lookahead-lookbehind-regex';

function skip(name: string, _fn: () => void): void {
  console.log(`○ ${name} (TODO)`);
}

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✔ ${name}`);
  } catch (error) {
    console.error(`✘ ${name}`);
    throw error;
  }
}

test('numberRegex находит целые и дробные числа', () => {
  const text = 'The price is 100.5 dollars, -5 degrees, and .5 discount.';

  assert.deepEqual(text.match(numberRegex), ['100.5', '-5', '.5']);
});

test('numberRegex не захватывает числа внутри слов и версий', () => {
  const text = 'version2 is old, version 2.0.1 is out, value is 42.';

  assert.deepEqual(text.match(numberRegex), ['42']);
});

test('passwordRegex проверяет требования сложности', () => {
  assert.equal(passwordRegex.test('Password123!'), true);
  assert.equal(passwordRegex.test('Pd123!'), false);
  assert.equal(passwordRegex.test('PASSWORD123!'), false);
  assert.equal(passwordRegex.test('Password!'), false);
  assert.equal(passwordRegex.test('Password123'), false);
});

console.log('Lookahead/lookbehind regex tests are prepared');
