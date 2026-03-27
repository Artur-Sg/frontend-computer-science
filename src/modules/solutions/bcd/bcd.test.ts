import assert from 'node:assert/strict';
import { BCD8421 } from './bcd';

function expectEqual(actual: unknown, expected: unknown, msg: string) {
  assert.equal(actual, expected, msg);
}

// === Базовый кейс из задания ===
const n = new BCD8421(65536n);

expectEqual(n.toBigint(), 65536n, 'toBigint() должен вернуть 65536n');
expectEqual(n.toNumber(), 65536, 'toNumber() должен вернуть 65536');
expectEqual(n.toString(), '65536', 'toString() должен вернуть "65536"');

expectEqual(n.at(0), 6, 'at(0) -> 6');
expectEqual(n.at(1), 3, 'at(1) -> 3');
expectEqual(n.at(2), 5, 'at(2) -> 5');
expectEqual(n.at(3), 5, 'at(3) -> 5');
expectEqual(n.at(4), 6, 'at(4) -> 6');

expectEqual(n.at(-1), 6, 'at(-1) -> 6');
expectEqual(n.at(-2), 3, 'at(-2) -> 3');
expectEqual(n.at(-3), 5, 'at(-3) -> 5');
expectEqual(n.at(-4), 5, 'at(-4) -> 5');
expectEqual(n.at(-5), 6, 'at(-5) -> 6');

// === Выход за границы ===
assert.throws(() => n.at(5), RangeError, 'at(5) должен бросать RangeError');
assert.throws(() => n.at(-6), RangeError, 'at(-6) должен бросать RangeError');

// === Ноль ===
const z = new BCD8421(0);
expectEqual(z.toString(), '0', 'toString(0) -> "0"');
expectEqual(z.toBigint(), 0n, 'toBigint(0) -> 0n');
expectEqual(z.toNumber(), 0, 'toNumber(0) -> 0');
expectEqual(z.at(0), 0, 'at(0) для 0 -> 0');
expectEqual(z.at(-1), 0, 'at(-1) для 0 -> 0');
assert.throws(() => z.at(1), RangeError, 'at(1) для 0 вне диапазона');
assert.throws(() => z.at(-2), RangeError, 'at(-2) для 0 вне диапазона');

// === Одна цифра ===
const single = new BCD8421(7);
expectEqual(single.toString(), '7', 'одна цифра toString');
expectEqual(single.toBigint(), 7n, 'одна цифра toBigint');
expectEqual(single.toNumber(), 7, 'одна цифра toNumber');
expectEqual(single.at(0), 7, 'at(0) для одной цифры');
expectEqual(single.at(-1), 7, 'at(-1) для одной цифры');
assert.throws(() => single.at(1), RangeError);
assert.throws(() => single.at(-2), RangeError);

// === Нечётная длина ===
const odd = new BCD8421(12345);
expectEqual(odd.toString(), '12345', 'нечётная длина корректно восстанавливается');
expectEqual(odd.toBigint(), 12345n, 'нечётная длина toBigint');
expectEqual(odd.toNumber(), 12345, 'нечётная длина toNumber');

expectEqual(odd.at(0), 5, 'odd at(0)');
expectEqual(odd.at(1), 4, 'odd at(1)');
expectEqual(odd.at(2), 3, 'odd at(2)');
expectEqual(odd.at(3), 2, 'odd at(3)');
expectEqual(odd.at(4), 1, 'odd at(4)');

expectEqual(odd.at(-1), 5, 'odd at(-1)');
expectEqual(odd.at(-2), 4, 'odd at(-2)');
expectEqual(odd.at(-3), 3, 'odd at(-3)');
expectEqual(odd.at(-4), 2, 'odd at(-4)');
expectEqual(odd.at(-5), 1, 'odd at(-5)');

// === Чётная длина ===
const even = new BCD8421(1234);
expectEqual(even.toString(), '1234', 'чётная длина');
expectEqual(even.at(0), 4, 'even at(0)');
expectEqual(even.at(1), 3, 'even at(1)');
expectEqual(even.at(2), 2, 'even at(2)');
expectEqual(even.at(3), 1, 'even at(3)');

expectEqual(even.at(-1), 4, 'even at(-1)');
expectEqual(even.at(-2), 3, 'even at(-2)');
expectEqual(even.at(-3), 2, 'even at(-3)');
expectEqual(even.at(-4), 1, 'even at(-4)');

// === Большое число (bigint) ===
const big = new BCD8421(1234567890n);
expectEqual(big.toString(), '1234567890', 'toString() для bigint');
expectEqual(big.toBigint(), 1234567890n, 'toBigint() для bigint');

// === Число с нулями внутри ===
const middleZeros = new BCD8421(9005);
expectEqual(middleZeros.toString(), '9005', 'число с нулями внутри');
expectEqual(middleZeros.at(0), 5, '9005 at(0)');
expectEqual(middleZeros.at(1), 0, '9005 at(1)');
expectEqual(middleZeros.at(2), 0, '9005 at(2)');
expectEqual(middleZeros.at(3), 9, '9005 at(3)');

expectEqual(middleZeros.at(-1), 5, '9005 at(-1)');
expectEqual(middleZeros.at(-2), 0, '9005 at(-2)');
expectEqual(middleZeros.at(-3), 0, '9005 at(-3)');
expectEqual(middleZeros.at(-4), 9, '9005 at(-4)');

console.log('OK: все тесты пройдены');
