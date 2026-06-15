interface Entry {
  key: unknown;
  value: unknown;
}

interface EntryNode {
  entry: Entry;
  next: EntryNode | null;
}

export class HashMap {
  private capacity: number;
  private buckets: Array<EntryNode | null>;
  private loadFactor: number;
  private objectIds = new WeakMap<object, number>();
  private nextObjectId = 1;

  public size: number = 0;

  constructor(capacity: number = 8, loadFactor = 0.65) {
    this.capacity = capacity;
    this.buckets = Array.from({ length: capacity }, () => null);
    this.loadFactor = loadFactor;
  }

  public get currentCapacity(): number {
    return this.capacity;
  }

  public get(key: unknown): unknown | undefined {
    const item = this.findNode(key)?.entry;

    return item?.value;
  }

  public set(key: unknown, value: unknown): void {
    const index = this.getIndex(key);
    const node = this.findNode(key);

    if (node) {
      node.entry.value = value;

      return;
    }

    this.buckets[index] = {
      entry: { key, value },
      next: this.buckets[index],
    };
    this.size += 1;
    this.resize();
  }

  public has(key: unknown): boolean {
    return this.findNode(key) != null;
  }

  public delete(key: unknown): unknown | undefined {
    const index = this.getIndex(key);
    let current = this.buckets[index];
    let previous: EntryNode | null = null;

    while (current) {
      if (current.entry.key === key) {
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

  private getIndex(key: unknown): number {
    return this.hashKey(key) % this.capacity;
  }

  private hashKey(key: unknown): number {
    if (typeof key === 'number') {
      return Math.abs(Math.trunc(key));
    }

    if (typeof key === 'string') {
      return this.hashString(key);
    }

    if (typeof key === 'object' && key !== null) {
      return this.hashObject(key);
    }

    return 0;
  }

  private resize(): void {
    const loadFactor = this.size / this.capacity;

    if (loadFactor <= this.loadFactor) {
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

  private findNode(key: unknown): EntryNode | null {
    const index = this.getIndex(key);
    let current = this.buckets[index];

    while (current) {
      if (current.entry.key === key) {
        return current;
      }

      current = current.next;
    }

    return null;
  }

  private hashObject(key: object): number {
    const existingId = this.objectIds.get(key);

    if (existingId !== undefined) {
      return existingId;
    }

    const id = this.nextObjectId;

    this.objectIds.set(key, id);
    this.nextObjectId += 1;

    return id;
  }

  private hashString(key: string): number {
    // FNV-1a
    let hash = 0x811c9dc5;

    for (let i = 0; i < key.length; i++) {
      hash ^= key.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }

    return hash >>> 0;
  }
}
