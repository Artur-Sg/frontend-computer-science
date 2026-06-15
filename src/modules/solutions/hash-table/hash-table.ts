interface Entry {
  key: unknown;
  value: unknown;
}
export class HashMap {
  private capacity: number;
  private buckets: Entry[][];
  private loadFactor: number;
  private objectIds = new WeakMap<object, number>();
  private nextObjectId = 1;

  public size: number = 0;

  constructor(capacity: number = 8, loadFactor = 0.65) {
    this.capacity = capacity;
    this.buckets = Array.from({ length: capacity }, () => []);
    this.loadFactor = loadFactor;
  }

  public get currentCapacity(): number {
    return this.capacity;
  }

  public get(key: unknown): unknown | undefined {
    const index = this.getIndex(key);
    const item = this.buckets[index].find((entry) => entry.key === key);

    return item?.value;
  }

  public set(key: unknown, value: unknown): void {
    const index = this.getIndex(key);
    const bucket = this.buckets[index];
    const item = bucket.find((entry) => entry.key === key);

    if (item) {
      item.value = value;
    } else {
      bucket.push({ key, value });
      this.size += 1;
      this.resize();
    }
  }

  public has(key: unknown): boolean {
    const index = this.getIndex(key);
    const hasEntry = this.buckets[index].some((entry) => entry.key === key);

    return hasEntry;
  }

  public delete(key: unknown): unknown | undefined {
    const index = this.getIndex(key);
    const bucket = this.buckets[index];
    const itemIndex = bucket.findIndex((entry) => entry.key === key);

    if (itemIndex === -1) {
      return undefined;
    }

    const item = bucket[itemIndex];

    bucket.splice(itemIndex, 1);
    this.size -= 1;

    return item.value;
  }

  public clear(): void {
    this.size = 0;
    this.buckets = Array.from({ length: this.capacity }, () => []);
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
    this.buckets = Array.from({ length: newCapacity }, () => []);

    for (const bucket of oldBuckets) {
      for (const entry of bucket) {
        const index = this.getIndex(entry.key);

        this.buckets[index].push(entry);
      }
    }
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
