# Практика — ArrayBuffer и TypedArray

## 1. Один буфер, два view

```js
const buffer = new ArrayBuffer(8);
const u8 = new Uint8Array(buffer);
const u32 = new Uint32Array(buffer);

u8[0] = 1;
u8[1] = 2;
u8[2] = 3;
u8[3] = 4;

console.log(u32[0]);
```

- Почему число в `u32[0]` выглядит «не как массив байт»?

## 2. Смещение и длина

```js
const buffer = new ArrayBuffer(16);
const head = new Uint8Array(buffer, 0, 4);
const tail = new Uint8Array(buffer, 4, 4);
```

- Какие байты читает `head`, а какие `tail`?
- Почему это полезно для бинарных форматов?

## 3. Проверка выравнивания

```js
const buffer = new ArrayBuffer(8);
const bad = new Uint16Array(buffer, 1);
```

- Почему здесь `RangeError`?
- Какое смещение нужно для `Uint16Array`?

## 4. DataView и порядок байт

```js
const buffer = new ArrayBuffer(4);
const view = new DataView(buffer);

view.setUint32(0, 0x01020304, true);
console.log(new Uint8Array(buffer));
```

- Что изменится, если убрать `true`?
- В каких сценариях это критично?

## 5. UTF-8 кодирование строки

```js
const encoded = new TextEncoder().encode('мир');
const decoded = new TextDecoder().decode(encoded);
```

- Почему `encoded.length` может отличаться от длины строки в JS?

## 6. Подготовка к ДЗ

Нужно собрать формат:

- `count: uint32`
- для каждой строки:
  - `byteLength: uint32`
  - `bytes: Uint8Array`

Подумайте заранее:

- как вычислять итоговый размер буфера;
- как читать элемент по индексу без полного декодирования;
- как обрабатывать пустые строки.
