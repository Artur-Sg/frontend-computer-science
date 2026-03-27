// Лекция 04 — Примеры кода

// 1) Перевод числа в двоичный вид (Int32)
function toBinaryString(num) {
  const data = new Int32Array([num]);
  const bytes = new Uint8Array(data.buffer);
  let str = '';
  for (let i = bytes.length - 1; i >= 0; i -= 1) {
    const byte = bytes[i].toString(2).padStart(8, '0');
    str += byte + (i === 0 ? '' : '_');
  }
  return str;
}

console.log('Int32 в битах (42):', toBinaryString(42));
console.log('Int32 в битах (-42):', toBinaryString(-42));

// 2) Проверка знака
function isNegative(num) {
  return (num & (1 << 31)) !== 0;
}

console.log('Знак числа (42):', isNegative(42));
console.log('Знак числа (-42):', isNegative(-42));

// 3) Маска произвольного размера
function createMask(position, size) {
  let mask = 1;
  mask = (mask << size) - 1;
  mask = mask << position;
  return mask;
}

console.log('Маска 8 бит с позиции 24:', toBinaryString(createMask(24, 8)));

// 4) Чтение группы бит
function readBits(value, position, size) {
  const mask = createMask(position, size);
  return (value & mask) >>> position;
}

const value = 0b11010110_10101101_00001111_11110000;
console.log('Чтение 8 бит (24..31):', readBits(value, 24, 8));

// 5) Сдвиги
console.log('Сдвиг: 0b0101 << 2 =', (0b0101 << 2).toString(2));
console.log('Сдвиг: 0b0101 >> 2 =', (0b0101 >> 2).toString(2));
console.log('Сдвиг: -1 >>> 0 =', -1 >>> 0, '(беззнаковое)');

console.log('Сдвиг влево = умножение на 2^k: 5 << 3 =', 5 << 3, '(5 * 2^3 =', 5 * 8, ')');
console.log('Сдвиг вправо = целочисл. деление: 20 >> 2 =', 20 >> 2, '(20 / 4 =', Math.floor(20 / 4), ')');
console.log('Сдвиг на k = умножение на 2^k: 1 << 5 =', 1 << 5);

// 6) BCD чтение и запись
const bcd = (9 << 8) | (7 << 4) | 1;
console.log('BCD в битах:', toBinaryString(bcd));
console.log('BCD: вторая цифра справа =', (bcd >>> 4) & 0b1111);

// 7) Битовые флаги
const CAN_READ = 0b0001;
const CAN_WRITE = 0b0010;
const CAN_DELETE = 0b0100;

let role = CAN_READ | CAN_WRITE;
console.log('Права: can read =', (role & CAN_READ) !== 0);
role |= CAN_DELETE;
console.log('Права: can delete =', (role & CAN_DELETE) !== 0);
role &= ~CAN_WRITE;
console.log('Права: can write =', (role & CAN_WRITE) !== 0);

// 8) Побитовое НЕ
console.log('Побитовое НЕ: ~42 + 1 =', ~42 + 1); // -42

console.log('Побитовое И (&): 5 & 3 =', 5 & 3, '(0101 & 0011 = 0001)');
console.log('Побитовое ИЛИ (|): 5 | 3 =', 5 | 3, '(0101 | 0011 = 0111)');
console.log('XOR (^): 5 ^ 3 =', 5 ^ 3, '(0101 ^ 0011 = 0110)');

// 9) XOR‑сумматор
function add(a, b) {
  while (b !== 0) {
    const sum = a ^ b;
    const carry = (a & b) << 1;
    a = sum;
    b = carry;
  }
  return a;
}

console.log('XOR‑сумматор: add(5, 17) =', add(5, 17));

// 10) XorShift
class XorShift {
  constructor(seed = Date.now()) {
    this._seed = seed;
  }
  random() {
    this._seed ^= this._seed << 13;
    this._seed ^= this._seed >> 17;
    this._seed ^= this._seed << 5;
    return this._seed < 0
      ? 1.0 + this._seed / 0x80000000
      : this._seed / 0x7fffffff;
  }
}

const rand1 = new XorShift(42);
const rand2 = new XorShift(42);
console.log('XorShift: одинаковый seed =>', rand1.random() === rand2.random());

// 11) 32‑битная область
console.log('32‑бит: 2 ** 32 >>> 0 =', (2 ** 32) >>> 0);
console.log('32‑бит: (2 ** 32 + 5) >>> 0 =', (2 ** 32 + 5) >>> 0);
