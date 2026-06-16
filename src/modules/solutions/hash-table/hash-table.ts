export interface HashStrategy<K = unknown> {
  hash(key: K): number;
  equals(left: K, right: K): boolean;
}

interface Entry<K, V> {
  key: K;
  value: V;
}

interface EntryNode<K, V> {
  entry: Entry<K, V>;
  next: EntryNode<K, V> | null;
}

function hashString(key: string): number {
  // FNV-1a
  let hash = 0x811c9dc5;

  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

const OBJECT_HASH: unique symbol = Symbol('objectHash');

type HashableObject = object & {
  [OBJECT_HASH]?: number;
};

export class DefaultHashStrategy implements HashStrategy<unknown> {
  private nextObjectHash = 1;

  public hash(key: unknown): number {
    if (key === null) {
      return this.hashString('null:null');
    }

    if (typeof key === 'number') {
      return this.hashString(`number:${key}`);
    }

    if (typeof key === 'string') {
      return this.hashString(`string:${key}`);
    }

    if (typeof key === 'boolean') {
      return this.hashString(`boolean:${key}`);
    }

    if (typeof key === 'symbol') {
      return this.hashString(`symbol:${String(key)}`);
    }

    if (typeof key === 'bigint') {
      return this.hashString(`bigint:${key.toString()}`);
    }

    if ((typeof key === 'object' && key !== null) || typeof key === 'function') {
      return this.hashObject(key as object);
    }

    return 0;
  }

  public equals(left: unknown, right: unknown): boolean {
    return left === right;
  }

  private hashObject(key: object): number {
    const hashable = key as HashableObject;
    const existingHash = hashable[OBJECT_HASH];

    if (existingHash !== undefined) {
      return existingHash;
    }

    if (!Object.isExtensible(key)) {
      throw new Error('Нельзя добавить hash к нерасширяемому объекту');
    }

    const hash = this.nextObjectHash;

    this.nextObjectHash += 1;

    Object.defineProperty(key, OBJECT_HASH, {
      value: hash,
      enumerable: false,
      configurable: false,
      writable: false
    });

    return hash;
  }

  private hashString(value: string): number {
    return hashString(value);
  }
}

export class HashMap<K, V> {
  private capacity: number;
  private buckets: Array<EntryNode<K, V> | null>;
  private loadFactor: number;
  private hasher: HashStrategy<K>;

  public size = 0;

  constructor(
    capacity: number = 8,
    loadFactor = 0.65,
    hasher: HashStrategy<K> = new DefaultHashStrategy() as HashStrategy<K>
  ) {
    this.hasher = hasher;
    this.capacity = capacity;
    this.buckets = Array.from({ length: capacity }, () => null);
    this.loadFactor = loadFactor;
  }

  public get currentCapacity(): number {
    return this.capacity;
  }

  public get(key: K): V | undefined {
    return this.findNode(key)?.entry.value;
  }

  public set(key: K, value: V): void {
    const index = this.getIndex(key);
    const node = this.findNode(key);

    if (node) {
      node.entry.value = value;

      return;
    }

    this.buckets[index] = {
      entry: { key, value },
      next: this.buckets[index]
    };
    this.size += 1;
    this.resize();
  }

  public has(key: K): boolean {
    return this.findNode(key) != null;
  }

  public delete(key: K): V | undefined {
    const index = this.getIndex(key);
    let current = this.buckets[index];
    let previous: EntryNode<K, V> | null = null;

    while (current) {
      if (this.hasher.equals(current.entry.key, key)) {
        if (previous) {
          previous.next = current.next;
        } else {
          this.buckets[index] = current.next;
        }

        this.size -= 1;

        return current.entry.value;
      }

      previous = current;
      current = current.next;
    }

    return undefined;
  }

  public clear(): void {
    this.size = 0;
    this.buckets = Array.from({ length: this.capacity }, () => null);
  }

  private getIndex(key: K): number {
    const hash = this.hasher.hash(key);

    return ((hash % this.capacity) + this.capacity) % this.capacity;
  }

  private resize(): void {
    const currentLoadFactor = this.size / this.capacity;

    if (currentLoadFactor <= this.loadFactor) {
      return;
    }

    const oldBuckets = this.buckets;
    const newCapacity = this.capacity * 2;

    this.capacity = newCapacity;
    this.buckets = Array.from({ length: newCapacity }, () => null);

    for (const bucket of oldBuckets) {
      let current = bucket;

      while (current) {
        const { next } = current;
        const index = this.getIndex(current.entry.key);

        current.next = this.buckets[index];
        this.buckets[index] = current;
        current = next;
      }
    }
  }

  private findNode(key: K): EntryNode<K, V> | null {
    const index = this.getIndex(key);
    let current = this.buckets[index];

    while (current) {
      if (this.hasher.equals(current.entry.key, key)) {
        return current;
      }

      current = current.next;
    }

    return null;
  }
}
