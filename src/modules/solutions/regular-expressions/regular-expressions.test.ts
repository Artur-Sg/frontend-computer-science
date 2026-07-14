import { strict as assert } from 'node:assert';
import { dateRegex, emailRegex, numberRegex } from './regex';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✔ ${name}`);
  } catch (error) {
    console.error(`✘ ${name}`);
    throw error;
  }
}

function collectMatches(regex: RegExp, text: string): string[] {
  regex.lastIndex = 0;

  return text.match(regex) ?? [];
}

test('emailRegex принимает корректные email-адреса', () => {
  assert.equal(emailRegex.test('user@example.com'), true);
  assert.equal(emailRegex.test('test@mail.ru'), true);
  assert.equal(emailRegex.test('user123@domain.org'), true);
  assert.equal(emailRegex.test('john.doe_42@sub-domain.net'), true);
});

test('emailRegex отклоняет некорректные email-адреса', () => {
  assert.equal(emailRegex.test('invalid-email'), false);
  assert.equal(emailRegex.test('user@.com'), false);
  assert.equal(emailRegex.test('user@domain'), false);
  assert.equal(emailRegex.test('user@domain.c'), false);
  assert.equal(emailRegex.test('user@@domain.com'), false);
});

test('numberRegex находит целые и дробные числа', () => {
  const text = 'The price is 100.5 dollars, -5 degrees, .5 bonus and 42 points.';

  assert.deepEqual(collectMatches(numberRegex, text), ['100.5', '-5', '.5', '42']);
});

test('numberRegex не захватывает числа внутри слов', () => {
  const text = 'version2 is out, build42beta is ignored, but -7 and 3.14 are valid';

  assert.deepEqual(collectMatches(numberRegex, text), ['-7', '3.14']);
});

test('dateRegex находит даты в двух форматах', () => {
  const text = 'Today is 15.01.2025 and tomorrow is 2025-01-16.';

  assert.deepEqual(collectMatches(dateRegex, text), ['15.01.2025', '2025-01-16']);
});

test('dateRegex игнорирует даты с неверным диапазоном дня и месяца', () => {
  const text = 'Invalid: 32.13.2025, 2025-00-10, 2025-12-40, valid: 01.12.2025';

  assert.deepEqual(collectMatches(dateRegex, text), ['01.12.2025']);
});

console.log('Regular expressions tests done');
