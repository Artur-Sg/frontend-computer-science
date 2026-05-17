import { strict as assert } from 'node:assert';
import { RGBAView } from './rgba-view';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✔ ${name}`);
  } catch (error) {
    console.error(`✘ ${name}`);
    throw error;
  }
}

test('RGBAView.write/read поддерживает #FFF', () => {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);

  RGBAView.write(view, 0, '#FFF');

  assert.deepEqual(RGBAView.read(view, 0), [255, 255, 255, 255]);
});

test('RGBAView.write/read поддерживает #EFEFEF', () => {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);

  RGBAView.write(view, 0, '#EFEFEF');

  assert.deepEqual(RGBAView.read(view, 0), [239, 239, 239, 255]);
});

test('RGBAView.mutable даёт покомпонентный доступ', () => {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);

  RGBAView.write(view, 0, '#EFEFEF');

  const pixel = RGBAView.access?.(view, 0);

  assert.ok(pixel, 'mutable view должен быть доступен');
  pixel!.red = 10;

  assert.deepEqual(RGBAView.read(view, 0), [10, 239, 239, 255]);
});

console.log('\nRGBAView tests done');
