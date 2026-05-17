import { normalizeIndex, type ElementView } from './types';

const HEADER_SIZE = 8;
const CAPACITY_OFFSET = 0;
const LENGTH_OFFSET = 4;

export class Vector<TValue, TInput = TValue, TAccess = TValue> {
  buffer: ArrayBufferLike;

  byteOffset: number;

  byteLength: number;

  readonly #elementView: ElementView<TValue, TInput, TAccess>;

  #data: DataView;

  constructor(
    capacity: number,
    elementView: ElementView<TValue, TInput, TAccess>,
    source?: ArrayBufferLike | ArrayBufferView,
  ) {
    if (!Number.isInteger(capacity) || capacity < 0) {
      throw new RangeError('Ёмкость должна быть неотрицательным целым числом');
    }

    this.#elementView = elementView;

    if (source === undefined) {
      const byteLength = HEADER_SIZE + capacity * elementView.bytesPerElement;

      this.buffer = new ArrayBuffer(byteLength);
      this.byteOffset = 0;
      this.byteLength = byteLength;
      this.#data = new DataView(this.buffer);

      this.#setCapacity(capacity);
      this.#setLength(0);

      return;
    }

    if (ArrayBuffer.isView(source)) {
      if (source.byteLength < HEADER_SIZE) {
        throw new RangeError('Переданный источник меньше заголовка вектора');
      }

      this.buffer = source.buffer;
      this.byteOffset = source.byteOffset;
      this.byteLength = source.byteLength;
      this.#data = new DataView(source.buffer, source.byteOffset, source.byteLength);

      this.#validateStoredCapacity();

      return;
    }

    if (source.byteLength < HEADER_SIZE) {
      throw new RangeError('Переданный источник меньше заголовка вектора');
    }

    this.buffer = source;
    this.byteOffset = 0;
    this.byteLength = source.byteLength;
    this.#data = new DataView(source);

    this.#validateStoredCapacity();
  }

  get capacity(): number {
    return this.#data.getUint32(CAPACITY_OFFSET, true);
  }

  get length(): number {
    return this.#data.getUint32(LENGTH_OFFSET, true);
  }

  get(index: number): TValue {
    const byteOffset = this.#getByteOffset(index);

    return this.#elementView.read(this.#data, byteOffset);
  }

  set(index: number, value: TInput): void {
    const byteOffset = this.#getByteOffset(index);

    this.#elementView.write(this.#data, byteOffset, value);
  }

  push(value: TInput): number {
    if (this.length === this.capacity) {
      this.#reserveAtLeast(this.length + 1);
    }

    const byteOffset = this.#getUncheckedByteOffset(this.length);

    this.#elementView.write(this.#data, byteOffset, value);
    this.#setLength(this.length + 1);

    return this.length;
  }

  pop(): TValue | undefined {
    if (this.length === 0) {
      return undefined;
    }

    const lastIndex = this.length - 1;
    const value = this.#elementView.read(this.#data, this.#getUncheckedByteOffset(lastIndex));

    this.#setLength(lastIndex);

    return value;
  }

  shift(): TValue | undefined {
    if (this.length === 0) {
      return undefined;
    }

    const firstValue = this.#elementView.read(this.#data, this.#getUncheckedByteOffset(0));

    if (this.length > 1) {
      const elementBytes = this.#elementView.bytesPerElement;
      const from = this.#getUncheckedByteOffset(1);
      const to = this.#getUncheckedByteOffset(0);
      const count = (this.length - 1) * elementBytes;

      const bytes = new Uint8Array(this.buffer, this.byteOffset);

      bytes.copyWithin(to, from, from + count);
    }

    this.#setLength(this.length - 1);

    return firstValue;
  }

  unshift(value: TInput): number {
    if (this.length === this.capacity) {
      this.#reserveAtLeast(this.length + 1);
    }

    if (this.length > 0) {
      const elementBytes = this.#elementView.bytesPerElement;
      const from = this.#getUncheckedByteOffset(0);
      const to = this.#getUncheckedByteOffset(1);
      const count = this.length * elementBytes;

      const bytes = new Uint8Array(this.buffer, this.byteOffset);

      bytes.copyWithin(to, from, from + count);
    }

    this.#elementView.write(this.#data, this.#getUncheckedByteOffset(0), value);
    this.#setLength(this.length + 1);

    return this.length;
  }

  fill(value: TInput): void {
    for (let index = 0; index < this.capacity; index += 1) {
      const byteOffset = this.#getUncheckedByteOffset(index);

      this.#elementView.write(this.#data, byteOffset, value);
    }

    this.#setLength(this.capacity);
  }

  reserve(extraCapacity: number): void {
    if (!Number.isInteger(extraCapacity) || extraCapacity < 0) {
      throw new RangeError('Дополнительная ёмкость должна быть неотрицательным целым числом');
    }

    const requiredCapacity = this.length + extraCapacity;

    if (requiredCapacity <= this.capacity) {
      return;
    }

    this.#reserveAtLeast(requiredCapacity);
  }

  shrinkToFit(): void {
    if (this.length === this.capacity) {
      return;
    }

    this.#resize(this.length);
  }

  view(index: number): TAccess {
    if (this.#elementView.access === undefined) {
      throw new Error('Для этого типа элемента недоступен покомпонентный доступ');
    }

    const byteOffset = this.#getByteOffset(index);

    return this.#elementView.access(this.#data, byteOffset);
  }

  #getByteOffset(index: number): number {
    const normalizedIndex = normalizeIndex(index, this.length);

    return this.#getUncheckedByteOffset(normalizedIndex);
  }

  #getUncheckedByteOffset(index: number): number {
    return HEADER_SIZE + index * this.#elementView.bytesPerElement;
  }

  #setCapacity(value: number): void {
    this.#data.setUint32(CAPACITY_OFFSET, value, true);
  }

  #setLength(value: number): void {
    if (value > this.capacity) {
      throw new RangeError('Длина не может быть больше ёмкости');
    }

    this.#data.setUint32(LENGTH_OFFSET, value, true);
  }

  #validateStoredCapacity(): void {
    const {capacity} = this;
    const {length} = this;
    const requiredBytes = HEADER_SIZE + capacity * this.#elementView.bytesPerElement;

    if (length > capacity) {
      throw new RangeError('Длина в заголовке буфера больше ёмкости');
    }

    if (this.byteLength < requiredBytes) {
      throw new RangeError('Переданный источник меньше ёмкости, указанной в заголовке вектора');
    }
  }

  #reserveAtLeast(requiredCapacity: number): void {
    let nextCapacity = Math.max(this.capacity, 1);

    while (nextCapacity < requiredCapacity) {
      nextCapacity = Math.ceil(nextCapacity * 1.5);
    }

    this.#resize(nextCapacity);
  }

  #resize(nextCapacity: number): void {
    if (nextCapacity < this.length) {
      throw new RangeError('Новая ёмкость не может быть меньше длины');
    }

    const nextByteLength = HEADER_SIZE + nextCapacity * this.#elementView.bytesPerElement;
    const nextBuffer = new ArrayBuffer(nextByteLength);
    const nextData = new DataView(nextBuffer);

    const bytesToCopy = HEADER_SIZE + this.length * this.#elementView.bytesPerElement;

    new Uint8Array(nextBuffer).set(
      new Uint8Array(this.buffer, this.byteOffset, bytesToCopy),
    );

    this.buffer = nextBuffer;
    this.byteOffset = 0;
    this.byteLength = nextByteLength;
    this.#data = nextData;

    this.#setCapacity(nextCapacity);
  }
}
