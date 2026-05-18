const MIN_CAPACITY = 4;

export class ReallocDequeue<T> {
  #buffer: (T | undefined)[];

  #start: number;

  #end: number;

  #length = 0;

  constructor(capacity = MIN_CAPACITY) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new RangeError('Ёмкость должна быть положительным целым числом');
    }

    const actual = Math.max(MIN_CAPACITY, capacity);

    this.#buffer = new Array(actual);
    this.#start = Math.floor(actual / 2);
    this.#end = this.#start;
  }

  get length(): number {
    return this.#length;
  }

  push(value: T): number {
    if (this.#end >= this.#buffer.length) {
      this.#resize(this.#buffer.length * 2);
    }

    this.#buffer[this.#end] = value;
    this.#end += 1;
    this.#length += 1;

    return this.#length;
  }

  pop(): T | undefined {
    if (this.#length === 0) {
      return undefined;
    }

    this.#end -= 1;

    const value = this.#buffer[this.#end];

    this.#buffer[this.#end] = undefined;
    this.#length -= 1;

    return value;
  }

  unshift(value: T): number {
    if (this.#start <= 0) {
      this.#resize(this.#buffer.length * 2);
    }

    this.#start -= 1;
    this.#buffer[this.#start] = value;
    this.#length += 1;

    return this.#length;
  }

  shift(): T | undefined {
    if (this.#length === 0) {
      return undefined;
    }

    const value = this.#buffer[this.#start];

    this.#buffer[this.#start] = undefined;
    this.#start += 1;
    this.#length -= 1;

    return value;
  }

  #resize(newCapacity: number): void {
    const targetCapacity = Math.max(newCapacity, this.#length + MIN_CAPACITY);
    const next = new Array<T | undefined>(targetCapacity);
    const offset = Math.floor((targetCapacity - this.#length) / 2);

    for (let i = 0; i < this.#length; i += 1) {
      next[offset + i] = this.#buffer[this.#start + i];
    }

    this.#buffer = next;
    this.#start = offset;
    this.#end = offset + this.#length;
  }
}
