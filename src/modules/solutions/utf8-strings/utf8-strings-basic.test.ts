import assert from 'node:assert/strict';
import { decodeStrings, encodeStrings } from './utf8-strings-basic';

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

console.log('OK: utf8-strings-basic tests passed');
