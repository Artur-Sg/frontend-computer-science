export type TypedArray =
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Float32Array
  | Float64Array;

export type TypedArrayConstructor =
  | Uint8ArrayConstructor
  | Uint16ArrayConstructor
  | Uint32ArrayConstructor
  | Int8ArrayConstructor
  | Int16ArrayConstructor
  | Int32ArrayConstructor
  | Float32ArrayConstructor
  | Float64ArrayConstructor;

export type DequeueItems<T> = T[] | TypedArray;

export type ArrayConstructor<T> = {
  new (length: number): T[];
};

export type DequeueItemsConstructor<T> = ArrayConstructor<T> | TypedArrayConstructor;

export type DequeueNode<T> = {
  items: DequeueItems<T>;
  start: number;
  end: number;
  prev: DequeueNode<T> | null;
  next: DequeueNode<T> | null;
};

export class Dequeue<T> {
  readonly #Items: DequeueItemsConstructor<T>;

  readonly #blockCapacity: number;

  #first: DequeueNode<T> | null = null;

  #last: DequeueNode<T> | null = null;

  #length: number = 0;

  get length(): number {
    return this.#length;
  }

  get blockCapacity(): number {
    return this.#blockCapacity;
  }

  constructor(Items: DequeueItemsConstructor<T>, blockCapacity: number) {
    if (!Number.isInteger(blockCapacity) || blockCapacity <= 0) {
      throw new RangeError('Ёмкость блока должна быть положительным целым числом');
    }

    this.#Items = Items;
    this.#blockCapacity = blockCapacity;
  }

  unshift(value: T): number {
    let node = this.#first;

    if (!node) {
      node = this.#createFirstNode();
    }

    if (node.start === 0) {
      const newNode = this.#createNode(this.#blockCapacity, this.#blockCapacity);

      newNode.next = node;
      node.prev = newNode;

      this.#first = newNode;

      node = newNode;
    }

    node.start -= 1;
    node.items[node.start] = value;
    this.#length += 1;

    return this.#length;
  }

  shift(): T | undefined {
    const node = this.#first;

    if (node === null) {
      return undefined;
    }

    const value = node.items[node.start] as T;

    node.start += 1;
    this.#length -= 1;

    if (node.start === node.end) {
      this.#dropFirstNode();
    }

    return value;
  }

  push(value: T): number {
    let node = this.#last;

    if (node === null) {
      node = this.#createFirstNode();
    }

    if (node.end === this.#blockCapacity) {
      const newNode = this.#createNode(0, 0);

      newNode.prev = node;
      node.next = newNode;

      this.#last = newNode;
      node = newNode;
    }

    node.items[node.end] = value;
    node.end += 1;
    this.#length += 1;

    return this.#length;
  }

  pop(): T | undefined {
    const node = this.#last;

    if (node === null) {
      return undefined;
    }

    node.end -= 1;

    const value = node.items[node.end] as T;

    this.#length -= 1;

    if (node.start === node.end) {
      this.#dropLastNode();
    }

    return value;
  }

  #createNode(start: number, end: number): DequeueNode<T> {
    return {
      items: new this.#Items(this.#blockCapacity),
      start,
      end,
      prev: null,
      next: null,
    };
  }

  #createFirstNode(): DequeueNode<T> {
    const middle = Math.floor(this.#blockCapacity / 2);
    const node = this.#createNode(middle, middle);

    this.#first = node;
    this.#last = node;

    return node;
  }

  #dropFirstNode(): void {
    const node = this.#first;

    if (!node) {
      return;
    }

    const { next } = node;

    this.#first = next;

    if (next !== null) {
      next.prev = null;
    } else {
      this.#last = null;
    }
  }

  #dropLastNode(): void {
    const node = this.#last;

    if (node === null) {
      return;
    }

    const { prev } = node;

    this.#last = prev;

    if (prev !== null) {
      prev.next = null;
    } else {
      this.#first = null;
    }
  }
}
