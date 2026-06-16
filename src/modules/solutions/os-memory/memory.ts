export type MemoryRegion = 'stack' | 'heap';

export interface MemoryOptions {
  stack: number;
  alignment?: number;
}

interface MemoryBlock {
  offset: number;
  size: number;
}

const DEFAULT_ALIGNMENT = 8;

export class Pointer {
  private readonly memory: Memory;

  private isValid = true;

  readonly offset: number;
  readonly size: number;
  readonly region: MemoryRegion;
  readonly blockOffset: number;
  readonly blockSize: number;

  constructor(
    memory: Memory,
    offset: number,
    size: number,
    region: MemoryRegion,
    blockOffset: number = offset,
    blockSize: number = size
  ) {
    this.memory = memory;
    this.offset = offset;
    this.size = size;
    this.region = region;
    this.blockOffset = blockOffset;
    this.blockSize = blockSize;
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

    this.memory.releaseHeapBlock(this.blockOffset, this.blockSize);
    this.invalidate();
  }

  [Symbol.dispose](): void {
    this.free();
  }
}

export class Memory {
  private readonly stackPointers: Pointer[] = [];

  private readonly freeHeapBlocks: MemoryBlock[] = [];

  readonly buffer: ArrayBuffer;

  readonly totalSize: number;

  readonly stackSize: number;
  readonly alignment: number;

  stackPointer: number;

  heapPointer: number;

  constructor(totalSize: number, { stack, alignment = DEFAULT_ALIGNMENT }: MemoryOptions) {
    if (!Number.isInteger(totalSize) || totalSize <= 0) {
      throw new Error('Некорректный размер общей памяти');
    }

    if (!Number.isInteger(stack) || stack <= 0) {
      throw new Error('Некорректный размер стека');
    }

    if (stack >= totalSize) {
      throw new Error('Размер стека должен быть меньше общего размера памяти');
    }

    if (!Number.isInteger(alignment) || alignment <= 0) {
      throw new Error('Некорректное выравнивание памяти');
    }

    this.totalSize = totalSize;
    this.stackSize = stack;
    this.alignment = alignment;
    this.buffer = new ArrayBuffer(totalSize);
    this.stackPointer = 0;
    this.heapPointer = this.stackSize;
  }

  push(data: ArrayBuffer): Pointer {
    const dataLength = data.byteLength;
    const blockOffset = this.stackPointer;
    const alignedOffset = this.align(this.stackPointer);
    const blockSize = alignedOffset - blockOffset + dataLength;

    if (alignedOffset + dataLength > this.stackSize) {
      throw new Error('Стек заполнен');
    }

    const source = new Uint8Array(data);
    const target = new Uint8Array(this.buffer, alignedOffset, dataLength);

    target.set(source);

    this.stackPointer = blockOffset + blockSize;

    const pointer = new Pointer(this, alignedOffset, dataLength, 'stack', blockOffset, blockSize);

    this.stackPointers.push(pointer);

    return pointer;
  }

  pop(): void {
    const pointer = this.stackPointers.pop();

    if (!pointer) {
      throw new Error('Стек пуст');
    }

    pointer.invalidate();

    this.stackPointer = pointer.blockOffset;
  }

  alloc(size: number): Pointer {
    if (size <= 0) {
      throw new Error('Некорректное выделение памяти');
    }

    const freeBlockIndex = this.freeHeapBlocks.findIndex((block) => {
      const alignedOffset = this.align(block.offset);
      const padding = alignedOffset - block.offset;

      return block.size >= size + padding;
    });

    if (freeBlockIndex !== -1) {
      const freeBlock = this.freeHeapBlocks[freeBlockIndex];
      const blockOffset = freeBlock.offset;
      const alignedOffset = this.align(freeBlock.offset);
      const blockSize = alignedOffset - blockOffset + size;

      const pointer = new Pointer(this, alignedOffset, size, 'heap', blockOffset, blockSize);

      if (freeBlock.size === blockSize) {
        this.freeHeapBlocks.splice(freeBlockIndex, 1);
      } else {
        freeBlock.offset += blockSize;
        freeBlock.size -= blockSize;
      }

      return pointer;
    }

    const blockOffset = this.heapPointer;
    const alignedHeapPointer = this.align(this.heapPointer);
    const blockSize = alignedHeapPointer - blockOffset + size;

    if (alignedHeapPointer + size > this.totalSize) {
      throw new Error('Памяти не хватает');
    }

    const pointer = new Pointer(this, alignedHeapPointer, size, 'heap', blockOffset, blockSize);

    this.heapPointer = blockOffset + blockSize;

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

  private align(offset: number): number {
    const remainder = offset % this.alignment;

    if (remainder === 0) {
      return offset;
    }

    return offset + (this.alignment - remainder);
  }
}
