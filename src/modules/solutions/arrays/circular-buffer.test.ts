import assert from 'node:assert/strict';
import { CircularBuffer } from './circular-buffer';

function expectArray<T>(actual: T[], expected: T[], msg: string): void {
  assert.deepEqual(actual, expected, msg);
}

// 1. Базовые свойства пустого буфера
{
  const buf = new CircularBuffer<number>(4);

  assert.equal(buf.length, 0, 'пустой буфер: length = 0');
  expectArray(buf.toArray(), [], 'пустой буфер: toArray()');
  assert.equal(buf.shift(), undefined, 'пустой буфер: shift -> undefined');
  assert.equal(buf.pop(), undefined, 'пустой буфер: pop -> undefined');
}

// 2. Простые сценарии для каждой операции
{
  const buf = new CircularBuffer<number>(4);

  buf.push(1);
  buf.push(2);
  buf.push(3);

  assert.equal(buf.length, 3, 'push увеличивает length');
  expectArray(buf.toArray(), [1, 2, 3], 'push сохраняет порядок');
}

{
  const buf = new CircularBuffer<number>(4);

  buf.unshift(3);
  buf.unshift(2);
  buf.unshift(1);

  assert.equal(buf.length, 3, 'unshift увеличивает length');
  expectArray(buf.toArray(), [1, 2, 3], 'unshift сохраняет порядок');
}

{
  const buf = new CircularBuffer<number>(4);

  buf.push(1);
  buf.push(2);
  buf.push(3);

  const shifted = buf.shift();

  assert.equal(shifted, 1, 'shift возвращает первый элемент');
  assert.equal(buf.length, 2, 'shift уменьшает length');
  expectArray(buf.toArray(), [2, 3], 'shift удаляет первый элемент');
}

{
  const buf = new CircularBuffer<number>(4);

  buf.push(1);
  buf.push(2);
  buf.push(3);

  const popped = buf.pop();

  assert.equal(popped, 3, 'pop возвращает последний элемент');
  assert.equal(buf.length, 2, 'pop уменьшает length');
  expectArray(buf.toArray(), [1, 2], 'pop удаляет последний элемент');
}

// 3. Смешанный сценарий
{
  const buf = new CircularBuffer<number>(4);

  buf.push(2);
  buf.push(3);
  buf.unshift(1);

  assert.equal(buf.shift(), 1, 'смешанный сценарий: shift');
  assert.equal(buf.pop(), 3, 'смешанный сценарий: pop');
  expectArray(buf.toArray(), [2], 'смешанный сценарий: порядок сохранён');
  assert.equal(buf.length, 1, 'смешанный сценарий: length');
}

// 4. Заворачивание по кругу
{
  const buf = new CircularBuffer<number>(4);

  buf.push(1);
  buf.push(2);
  buf.push(3);
  buf.shift();
  buf.shift();
  buf.push(4);
  buf.push(5);

  expectArray(buf.toArray(), [3, 4, 5], 'wrap-around переиспользует освобождённые слоты');
  assert.equal(buf.length, 3, 'wrap-around length');
}

// 5. Рост буфера
{
  const buf = new CircularBuffer<number>(2);

  buf.push(1);
  buf.push(2);
  buf.push(3);

  expectArray(buf.toArray(), [1, 2, 3], 'grow при заполнении');
  assert.equal(buf.length, 3, 'grow увеличивает length');
}

{
  const buf = new CircularBuffer<number>(4);

  buf.push(1);
  buf.push(2);
  buf.push(3);
  buf.shift();
  buf.shift();
  buf.push(4);
  buf.push(5);
  buf.push(6);

  expectArray(buf.toArray(), [3, 4, 5, 6], 'grow после wrap-around сохраняет порядок');
  assert.equal(buf.length, 4, 'grow после wrap-around length');
}

// 6. Сравнение с обычным массивом (псевдо-рандом)
{
  const buf = new CircularBuffer<number>(4);
  const arr: number[] = [];
  let seed = 123456789;

  const next = (): number => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;

    return seed >>> 0;
  };

  const ops = 200;

  for (let i = 0; i < ops; i++) {
    const op = next() % 4;
    const value = Number(next() % 1000);

    if (op === 0) {
      buf.push(value);
      arr.push(value);
    } else if (op === 1) {
      buf.unshift(value);
      arr.unshift(value);
    } else if (op === 2) {
      const got = buf.shift();
      const expected = arr.shift();

      assert.equal(got, expected, 'псевдо-рандом: shift возвращает то же значение');
    } else {
      const got = buf.pop();
      const expected = arr.pop();

      assert.equal(got, expected, 'псевдо-рандом: pop возвращает то же значение');
    }

    assert.equal(buf.length, arr.length, 'псевдо-рандом: length совпадает');
    expectArray(buf.toArray(), arr, 'псевдо-рандом: порядок совпадает');
  }
}

console.log('OK: тесты circular-buffer пройдены');
