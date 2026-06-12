export type MemoryRegion = 'stack' | 'heap';

export interface MemoryOptions {
  stack: number;
}

interface MemoryBlock {
  offset: number;
  size: number;
}

export class Pointer {
  private readonly memory: Memory;

  private isValid = true;

  readonly offset: number;
  readonly size: number;
  readonly region: MemoryRegion;

  constructor(memory: Memory, offset: number, size: number, region: MemoryRegion) {
    this.memory = memory;
    this.offset = offset;
    this.size = size;
    this.region = region;
  }

  deref(): ArrayBuffer {
    if (!this.isValid) {
      throw new Error('Указатель недействителен');
    }

    const source = new Uint8Array(this.memory.buffer, this.offset, this.size);
    const copy = new Uint8Array(this.size);

    copy.set(source);

    return copy.buffer;
  }

  change(data: ArrayBuffer): void {
    if (!this.isValid) {
      throw new Error('Указатель недействителен');
    }

    if (data.byteLength !== this.size) {
      throw new Error('Размер отличается');
    }

    const source = new Uint8Array(data);
    const target = new Uint8Array(this.memory.buffer, this.offset, this.size);

    target.set(source);
  }

  invalidate(): void {
    this.isValid = false;
  }

  free(): void {
    if (this.region !== 'heap') {
      throw new Error('Освобождать можно только память из кучи');
    }

    if (!this.isValid) {
      throw new Error('Обнаружено двойное освобождение');
    }

    this.memory.releaseHeapBlock(this.offset, this.size);
    this.invalidate();
  }
}

export class Memory {
  private readonly stackPointers: Pointer[] = [];

  private readonly freeHeapBlocks: MemoryBlock[] = [];

  readonly buffer: ArrayBuffer;

  readonly totalSize: number;

  readonly stackSize: number;

  stackPointer: number;

  heapPointer: number;

  constructor(totalSize: number, { stack }: MemoryOptions) {
    if (totalSize <= 0) {
      throw new Error('Некорректный размер общей памяти');
    }

    if (stack <= 0) {
      throw new Error('Некорректный размер стека');
    }

    if (stack >= totalSize) {
      throw new Error('Размер стека должен быть меньше общего размера памяти');
    }

    this.totalSize = totalSize;
    this.stackSize = stack;
    this.buffer = new ArrayBuffer(totalSize);
    this.stackPointer = 0;
    this.heapPointer = this.stackSize;
  }

  push(data: ArrayBuffer): Pointer {
    const offset = this.stackPointer;
    const dataLength = data.byteLength;

    if (offset + dataLength > this.stackSize) {
      throw new Error('Стек заполнен');
    }

    const source = new Uint8Array(data);
    const target = new Uint8Array(this.buffer, offset, dataLength);

    target.set(source);

    this.stackPointer += dataLength;

    const pointer = new Pointer(this, offset, dataLength, 'stack');

    this.stackPointers.push(pointer);

    return pointer;
  }

  pop(): void {
    const pointer = this.stackPointers.pop();

    if (!pointer) {
      throw new Error('Стек пуст');
    }

    pointer.invalidate();

    this.stackPointer = pointer.offset;
  }

  alloc(size: number): Pointer {
    if (size <= 0) {
      throw new Error('Некорректное выделение памяти');
    }

    const freeBlockIndex = this.freeHeapBlocks.findIndex((block) => block.size >= size);

    if (freeBlockIndex !== -1) {
      const freeBlock = this.freeHeapBlocks[freeBlockIndex];
      const { offset } = freeBlock;

      const pointer = new Pointer(this, offset, size, 'heap');

      if (freeBlock.size === size) {
        this.freeHeapBlocks.splice(freeBlockIndex, 1);
      } else {
        freeBlock.offset += size;
        freeBlock.size -= size;
      }

      return pointer;
    }

    if (this.heapPointer + size > this.totalSize) {
      throw new Error('Памяти не хватает');
    }

    const pointer = new Pointer(this, this.heapPointer, size, 'heap');

    this.heapPointer += size;

    return pointer;
  }

  releaseHeapBlock(offset: number, size: number): void {
    this.freeHeapBlocks.push({ offset, size });

    this.freeHeapBlocks.sort((a, b) => a.offset - b.offset);

    for (let i = 0; i < this.freeHeapBlocks.length - 1; i++) {
      const current = this.freeHeapBlocks[i];
      const next = this.freeHeapBlocks[i + 1];
      const currentEnd = current.offset + current.size;

      if (currentEnd === next.offset) {
        current.size += next.size;
        this.freeHeapBlocks.splice(i + 1, 1);
        i -= 1;
      }
    }
  }
}
