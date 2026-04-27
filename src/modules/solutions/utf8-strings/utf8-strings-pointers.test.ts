import assert from 'node:assert/strict';
import {
  decodeStrings,
  encodeStrings
} from './utf8-strings-pointers';

{
  const src = ['hello', 'мир', ''];
  const buffer = encodeStrings(src);

  assert.equal(buffer.at(0), 'hello', 'at(0)');
  assert.equal(buffer.at(1), 'мир', 'at(1)');
  assert.equal(buffer.at(-1), '', 'at(-1)');
  assert.deepEqual(decodeStrings(buffer), src, 'decode(encode(strings))');
}

{
  const src = ['', '', ''];
  const buffer = encodeStrings(src);

  assert.equal(buffer.at(0), '', 'empty strings at(0)');
  assert.equal(buffer.at(-1), '', 'empty strings at(-1)');
  assert.deepEqual(decodeStrings(buffer), src, 'all-empty strings');
}

{
  const src = ['a', '🙂', 'кириллица'];
  const buffer = encodeStrings(src);

  assert.equal(buffer.at(1), '🙂', 'emoji support');
  assert.deepEqual(decodeStrings(buffer), src, 'unicode support');
}

{
  const src: string[] = [];
  const buffer = encodeStrings(src);

  assert.deepEqual(decodeStrings(buffer), src, 'empty array');
}

{
  const src = ['hello', 'мир', ''];
  const buffer = encodeStrings(src);

  if (typeof buffer.set === 'function') {
    buffer.set(0, 'Привет, ');
    buffer.set(-1, '!');
    assert.equal(buffer.at(0), 'Привет, ', 'set(0, ...)');
    assert.equal(buffer.at(-1), '!', 'set(-1, ...)');
  } else {
    console.log('INFO: set(index, value) не реализован (опционально, задание со звездочкой)');
  }
}

console.log('OK: utf8-strings-pointers tests passed');
