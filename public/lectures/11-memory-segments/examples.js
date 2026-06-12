// Лекция 11. Мини-примеры

// 1) Переполнение стека вызовов
function recursive(n) {
  if (n === 0) return 0;
  return recursive(n - 1) + 1;
}

console.log('recursive(5):', recursive(5));

// 2) Локальные данные живут только во время вызова
function makeSum(a, b) {
  const result = a + b;
  return result;
}

console.log('makeSum(2, 3):', makeSum(2, 3));

// 3) Простейшая модель стека на ArrayBuffer
class StackRegion {
  constructor(size) {
    this.buffer = new ArrayBuffer(size);
    this.bytes = new Uint8Array(this.buffer);
    this.top = 0;
    this.frames = [];
  }

  push(input) {
    const data = new Uint8Array(input);

    if (this.top + data.byteLength > this.bytes.length) {
      throw new RangeError('Stack overflow');
    }

    this.bytes.set(data, this.top);
    this.frames.push({ offset: this.top, size: data.byteLength });
    this.top += data.byteLength;
  }

  pop() {
    const frame = this.frames.pop();

    if (!frame) return undefined;

    this.top = frame.offset;
    return this.buffer.slice(frame.offset, frame.offset + frame.size);
  }
}

const stack = new StackRegion(16);
stack.push(Uint8Array.from([1, 2, 3]).buffer);
stack.push(Uint8Array.from([4, 5]).buffer);
console.log(new Uint8Array(stack.pop())); // [4, 5]

// 4) Наивная куча: только выдача диапазонов
class HeapRegion {
  constructor(size) {
    this.buffer = new ArrayBuffer(size);
    this.offset = 0;
    this.allocations = [];
  }

  alloc(size) {
    if (this.offset + size > this.buffer.byteLength) {
      throw new RangeError('Out of heap memory');
    }

    const pointer = { offset: this.offset, size };

    this.allocations.push(pointer);
    this.offset += size;

    return pointer;
  }
}

const heap = new HeapRegion(32);
console.log('alloc(8):', heap.alloc(8));
