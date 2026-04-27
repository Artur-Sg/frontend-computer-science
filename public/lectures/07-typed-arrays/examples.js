// Лекция 07 — Примеры кода

// 1) TypedArray и переполнение
const u8 = new Uint8Array(2);
u8[0] = 255;
u8[1] = 256;
console.log('Uint8 overflow:', u8[0], u8[1]); // 255, 0

// 2) Один буфер, разные представления
const shared = new ArrayBuffer(4);
const bytes = new Uint8Array(shared);
const num = new Uint32Array(shared);
bytes.set([83, 170, 8, 0]);
console.log('u32 from bytes:', num[0]);

// 3) DataView и порядок байт
const view = new DataView(shared);
console.log('little-endian read:', view.getUint32(0, true));
console.log('big-endian read:', view.getUint32(0, false));

// 4) UTF-8 кодирование / декодирование
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const utf8 = encoder.encode('hello мир');
console.log('utf8 bytes:', utf8.length, utf8);
console.log('decoded:', decoder.decode(utf8));

// 5) Мини-формат: [count:uint32][len:uint32][bytes...]
const strings = ['hello', 'мир', ''];
const encodedStrings = strings.map((s) => encoder.encode(s));
const totalBytes = 4 + encodedStrings.reduce((acc, arr) => acc + 4 + arr.length, 0);
const buffer = new ArrayBuffer(totalBytes);
const dv = new DataView(buffer);
const out = new Uint8Array(buffer);

let offset = 0;
dv.setUint32(offset, strings.length, true);
offset += 4;
for (const arr of encodedStrings) {
  dv.setUint32(offset, arr.length, true);
  offset += 4;
  out.set(arr, offset);
  offset += arr.length;
}

console.log('serialized bytes:', out.length);
