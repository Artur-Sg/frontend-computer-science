import assert from 'node:assert/strict';
import { cyclicLeftShift, cyclicRightShift } from './cyclic-shift';

function expectEqual(actual: number, expected: number, msg: string): void {
  assert.equal(actual >>> 0, expected >>> 0, msg);
}

// === Примеры из задания ===
expectEqual(
  cyclicLeftShift(0b10000000_00000000_00000000_00000001, 1),
  0b00000000_00000000_00000000_00000011,
  'left shift example'
);

expectEqual(
  cyclicRightShift(0b10000000_00000000_00000000_00000001, 2),
  0b01100000_00000000_00000000_00000000,
  'right shift example'
);

// === Нулевой сдвиг ===
expectEqual(cyclicLeftShift(0x12345678, 0), 0x12345678, 'left shift by 0');
expectEqual(cyclicRightShift(0x12345678, 0), 0x12345678, 'right shift by 0');

// === Нормализация сдвига ===
expectEqual(cyclicLeftShift(0x12345678, 32), 0x12345678, 'left shift by 32');
expectEqual(cyclicRightShift(0x12345678, 32), 0x12345678, 'right shift by 32');

// ❗ Исправлено: 33 = 1 бит
expectEqual(cyclicLeftShift(0x12345678, 33), 0x2468ACF0, 'left shift by 33');

// ❗ Исправлено: 40 = 8 бит
expectEqual(cyclicRightShift(0x12345678, 40), 0x78123456, 'right shift by 40');

// === Несколько контрольных значений ===
expectEqual(cyclicLeftShift(0x00000001, 4), 0x00000010, 'left shift small');
expectEqual(cyclicRightShift(0x00000010, 4), 0x00000001, 'right shift small');

// Проверка цикличности: крайний бит (MSB/LSB) корректно "перепрыгивает" на противоположную сторону
expectEqual(cyclicLeftShift(0x80000000, 1), 0x00000001, 'MSB -> LSB');
expectEqual(cyclicRightShift(0x00000001, 1), 0x80000000, 'LSB -> MSB');

// все биты = 1
expectEqual(cyclicLeftShift(0xFFFFFFFF, 7), 0xFFFFFFFF, 'all ones');

// большие k
expectEqual(cyclicLeftShift(0x89ABCDEF, 64), 0x89ABCDEF, 'k=64');

// классика
expectEqual(cyclicLeftShift(0x89ABCDEF, 8), 0xABCDEF89, 'left 8');
expectEqual(cyclicRightShift(0x89ABCDEF, 8), 0xEF89ABCD, 'right 8');

console.log('OK: все тесты пройдены');
