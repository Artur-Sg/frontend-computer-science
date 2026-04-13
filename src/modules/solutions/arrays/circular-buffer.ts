export class CircularBuffer<T> {
  private buffer: (T | undefined)[];

  private capacity: number;

  private head: number;

  private size: number = 0;

  constructor(initialCapacity = 8) {
    this.capacity = initialCapacity;
    this.buffer = new Array(this.capacity);
    this.head = 0;
  }

  get length(): number {
    return this.size;
  }

  toArray(): T[] {
    const res: T[] = [];

    for (let i = 0; i < this.size; i++) {
      const index = (this.head + i) % this.capacity;
      const value = this.buffer[index];

      res.push(value as T);
    }

    return res;
  }

  push(value: T): void {
    if (this.size === this.capacity) {
      this.grow();
    }

    const tailIndex = (this.head + this.size) % this.capacity;

    this.buffer[tailIndex] = value;
    this.size++;
  }

  shift(): undefined | T {
    if (this.size === 0) {
      return undefined;
    }

    const oldHead = this.head;
    const value = this.buffer[oldHead];

    this.buffer[oldHead] = undefined;
    this.head = (this.head + 1) % this.capacity;
    this.size--;

    return value;
  }

  unshift(value: T): void {
    if (this.size === this.capacity) {
      this.grow();
    }

    this.head = (this.head + this.capacity - 1) % this.capacity;
    this.buffer[this.head] = value;
    this.size++;
  }

  pop(): undefined | T {
    if (this.size === 0) {
      return undefined;
    }

    const tailIndex = (this.head + this.size - 1 + this.capacity) % this.capacity;
    const value = this.buffer[tailIndex];

    this.buffer[tailIndex] = undefined;
    this.size--;

    return value;
  }

  private grow(): void {
    const newCapacity = this.capacity * 2;
    const newBuffer: (T | undefined)[] = new Array(newCapacity);

    for (let i = 0; i < this.size; i++) {
      const oldIndex = (this.head + i) % this.capacity;

      newBuffer[i] = this.buffer[oldIndex];
    }

    this.buffer = newBuffer;
    this.capacity = newCapacity;

    this.head = 0;
  }
}
