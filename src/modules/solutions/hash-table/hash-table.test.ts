import { strict as assert } from 'node:assert';

import { HashMap } from './hash-table';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✔ ${name}`);
  } catch (error) {
    console.error(`✘ ${name}`);
    throw error;
  }
}

test('конструктор создает пустую таблицу с заданной емкостью', () => {
  const table = new HashMap(120);

  assert.equal(table.size, 0);
});

test('set/get работают со строковым ключом', () => {
  const table = new HashMap();

  table.set('foo', 1);

  assert.equal(table.get('foo'), 1);
  assert.equal(table.has('foo'), true);
  assert.equal(table.size, 1);
});

test('set/get работают с числовым ключом', () => {
  const table = new HashMap();

  table.set(42, 10);

  assert.equal(table.get(42), 10);
  assert.equal(table.has(42), true);
  assert.equal(table.size, 1);
});

test('set/get работают с объектом как ключом', () => {
  const table = new HashMap();
  const key = { type: 'document' };

  table.set(key, 100);

  assert.equal(table.get(key), 100);
  assert.equal(table.has(key), true);
  assert.equal(table.size, 1);
});

test('разные объекты с одинаковым содержимым считаются разными ключами', () => {
  const table = new HashMap();

  const key1 = { id: 1 };
  const key2 = { id: 1 };

  table.set(key1, 100);
  table.set(key2, 200);

  assert.equal(table.get(key1), 100);
  assert.equal(table.get(key2), 200);
  assert.equal(table.size, 2);
});

test('обновление существующего ключа меняет значение, но не увеличивает size', () => {
  const table = new HashMap();

  table.set('foo', 1);
  table.set('foo', 2);

  assert.equal(table.get('foo'), 2);
  assert.equal(table.size, 1);
});

test('обновление объектного ключа не увеличивает size', () => {
  const table = new HashMap();
  const key = { id: 1 };

  table.set(key, 100);
  table.set(key, 200);

  assert.equal(table.get(key), 200);
  assert.equal(table.size, 1);
});

test('delete удаляет строковый ключ и возвращает удаленное значение', () => {
  const table = new HashMap();

  table.set('foo', 1);

  assert.equal(table.delete('foo'), 1);
  assert.equal(table.has('foo'), false);
  assert.equal(table.get('foo'), undefined);
  assert.equal(table.size, 0);
});

test('delete удаляет объектный ключ и возвращает удаленное значение', () => {
  const table = new HashMap();
  const key = { type: 'document' };

  table.set(key, 100);

  assert.equal(table.delete(key), 100);
  assert.equal(table.has(key), false);
  assert.equal(table.get(key), undefined);
  assert.equal(table.size, 0);
});

test('delete отсутствующего ключа возвращает undefined', () => {
  const table = new HashMap();

  assert.equal(table.delete('missing'), undefined);
  assert.equal(table.size, 0);
});

test('коллизии не теряют данные при одинаковом hash', () => {
  const table = new HashMap(4);

  table.set('foo', 1);
  table.set('bar', 2);
  table.set('baz', 3);

  assert.equal(table.get('foo'), 1);
  assert.equal(table.get('bar'), 2);
  assert.equal(table.get('baz'), 3);
  assert.equal(table.size, 3);
});

test('delete при коллизии не удаляет другие элементы из bucket', () => {
  const table = new HashMap(4);

  table.set('foo', 1);
  table.set('bar', 2);
  table.set('baz', 3);

  assert.equal(table.delete('bar'), 2);

  assert.equal(table.get('foo'), 1);
  assert.equal(table.get('bar'), undefined);
  assert.equal(table.get('baz'), 3);
  assert.equal(table.size, 2);
});

test('таблица поддерживает расширение внутреннего буфера', () => {
  const table = new HashMap(2);

  table.set('foo', 1);
  table.set('bar', 2);
  table.set('baz', 3);

  assert.ok(table.currentCapacity > 2);
  assert.equal(table.get('foo'), 1);
  assert.equal(table.get('bar'), 2);
  assert.equal(table.get('baz'), 3);
  assert.equal(table.size, 3);
});

test('clear очищает таблицу после вставок', () => {
  const table = new HashMap();

  table.set('foo', 1);
  table.set('bar', 2);
  table.clear();

  assert.equal(table.size, 0);
  assert.equal(table.get('foo'), undefined);
  assert.equal(table.get('bar'), undefined);
  assert.equal(table.has('foo'), false);
  assert.equal(table.has('bar'), false);
});

test('таблица сохраняет много объектных ключей после расширения', () => {
  const table = new HashMap(2);
  const keys = Array.from({ length: 100 }, (_, index) => ({ index }));

  keys.forEach((key, index) => {
    table.set(key, index);
  });

  keys.forEach((key, index) => {
    assert.equal(table.get(key), index);
    assert.equal(table.has(key), true);
  });

  assert.equal(table.size, 100);
  assert.ok(table.currentCapacity > 2);
});

console.log('\HashMap tests done');
