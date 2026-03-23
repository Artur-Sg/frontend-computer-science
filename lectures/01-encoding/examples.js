// Lecture 01 — runnable examples

const sep = () => console.log('---');

console.log('1) Переполнение Uint8Array');
{
  const a = new Uint8Array([255]);
  console.log('начальное значение:', a[0]); // 255
  a[0] += 2;
  console.log('значение:', a[0]); // 1
  console.log('примечание: 255 + 2 переполняет 8 бит');
}
sep();

console.log('2) Цикл по 3 битам с маской');
{
  let a = 0;
  const out = [];
  for (let i = 0; i < 10; i++) {
    out.push(a);
    // оставляем только 3 бита
    a = (a + 1) & 0b111;
  }
  console.log('последовательность:', out.join(' '));
  console.log('примечание: после 7 значения идут по кругу');
}
sep();

console.log('3) Тождество для дополнительного кода');
{
  console.log('выражение: -42 === ~42 + 1');
  console.log('результат:', -42 === ~42 + 1); // true
}
sep();

console.log('4) Одинаковые биты — разная интерпретация');
{
  const a = new Int8Array([-125]);
  const b = new Uint8Array(a.buffer);
  console.log('Int8 значение:', a[0]); // -125
  console.log('Uint8 те же биты:', b[0]); // 131
}
sep();

console.log('5) Число в разных системах');
{
  const n = 1255;
  console.log('n:', n);
  console.log('двоичная:', n.toString(2));
  console.log('восьмеричная:', n.toString(8));
  console.log('шестнадцатеричная:', n.toString(16));
  console.log('base36:', n.toString(36));
}
sep();

console.log('6) parseInt с разными основаниями');
{
  console.log('parseInt("10", 2):', parseInt('10', 2));
  console.log('parseInt("10", 8):', parseInt('10', 8));
  console.log('parseInt("10", 16):', parseInt('10', 16));
  console.log('parseInt("10", 36):', parseInt('10', 36));
}
sep();

console.log('7) Разные литералы — одно значение');
{
  console.log('0b1111_1111 === 255:', 0b1111_1111 === 255);
  console.log('0xFF === 255:', 0xFF === 255);
  console.log('0xFF === 0o377:', 0xFF === 0o377);
}
sep();

console.log('8) RGB в разных системах');
{
  console.log('двоичная:', [0b1111_1111, 0b0000_0000, 0b0000_0000]);
  console.log('восьмеричная:', [0o377, 0o000, 0o000]);
  console.log('шестнадцатеричная:', [0xFF, 0x00, 0x00]);
}
sep();

console.log('9) Приведение vs преобразование');
{
  const a = new Float64Array([42.1]);

  // приведение: те же биты
  const b = new Uint8Array(a.buffer);
  console.log('приведение Float64 -> Uint8:', Array.from(b));

  // преобразование: новое значение
  const c = new Uint8Array(a);
  console.log('преобразование Float64 -> Uint8:', Array.from(c)); // [42]
}
