// Лекция 03 — Примеры кода

// 1) Разложение числа на разряды (обычное)
function decompose(num) {
  const out = [];
  do {
    out.push(num % 10);
    num = Math.floor(num / 10);
  } while (num > 0);
  return out;
}

// 2) Разложение числа в BCD 8421
function decomposeBCD(num, len) {
  const out = [];
  for (let i = 0; i < len; i += 1) {
    const mask = 0b1111 << (i * 4);
    out.push((num & mask) >> (i * 4));
  }
  return out;
}

// Кодируем 5421 в BCD 8421
const bcd5421 = (5 << 12) | (4 << 8) | (2 << 4) | 1;

console.log('Разложение на разряды (обычное): decompose(5421) =>', decompose(5421));
console.log('Разложение на разряды (BCD): decomposeBCD(5421) =>', decomposeBCD(bcd5421, 4));

// 3) Простейший BCD-класс
class BCD {
  static LEN = 8;

  mem = 0;

  constructor(num) {
    let i = -1;
    do {
      this.mem |= (num % 10) << ((i += 1) * 4);
      num = Math.floor(num / 10);
    } while (num > 0);
  }

  toString() {
    let str = '';
    let prefix = '';
    for (let i = 0; i < BCD.LEN; i += 1) {
      const mask = 0b1111 << (i * 4);
      const s = String((this.mem & mask) >> (i * 4));
      prefix += s;
      if (s !== '0') {
        str = prefix + str;
        prefix = '';
      }
    }
    return str || '0';
  }
}

console.log('BCD: внутреннее mem (прямой код) =>', new BCD(13574));
console.log('BCD: toString() =>', new BCD(13574).toString());

// 4) number в двоичном виде (Float64)
function float64toString(num) {
  const float64 = new Float64Array([num]);
  const bytes = new Uint8Array(float64.buffer);
  let str = '';
  for (let i = bytes.length - 1; i >= 0; i -= 1) {
    str += bytes[i].toString(2).padStart(8, '0');
    if (i !== 0) str += '_';
  }
  return str;
}

console.log('Float64: 34.45656e10 =>', float64toString(34.45656e10));
console.log('Float64: Infinity =>', float64toString(Infinity));
console.log('Float64: -1 =>', float64toString(-1));
console.log('Float64: -Infinity =>', float64toString(-Infinity));
console.log('Float64: NaN =>', float64toString(NaN));

// 5) Безопасные целые
console.log('SAFE INT: MAX_SAFE_INTEGER =>', Number.MAX_SAFE_INTEGER);
console.log('SAFE INT: 2^56 - 4 === 2^56 =>', 2 ** 56 - 4 === 2 ** 56);

// 6) NaN и Infinity
console.log('Infinity: 42 / 0 === Infinity =>', 42 / 0 === Infinity);
console.log('NaN: NaN !== NaN =>', NaN !== NaN);
console.log('NaN: Number.isNaN(0 / 0) =>', Number.isNaN(0 / 0));

// 7) Типизированные массивы и преобразования
const arr = new Uint8Array([-10, 42.19, 321]);
console.log('Uint8Array: [-10, 42.19, 321] =>', [...arr], '(обрезание/переполнение)');

const arr1 = new Float32Array([1, 2, 3, 4, 5]);
const arr2 = new Int32Array([1, 2, 3, 4, 5]);
console.log('Float32Array buffer =>', arr1.buffer);
console.log('Int32Array buffer =>', arr2.buffer);

// 8) BigInt vs number (простой пример)
const big = 2n ** 100n;
console.log('BigInt: 2n ** 100n =>', big);

// Важно: %DebugPrint и SMI требуют --allow-natives-syntax в Node
// node --allow-natives-syntax examples.js
