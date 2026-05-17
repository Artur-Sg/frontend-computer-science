export type ElementView<TValue, TInput = TValue, TAccess = unknown> = {
  readonly bytesPerElement: number;

  read(view: DataView, byteOffset: number): TValue;

  write(view: DataView, byteOffset: number, value: TInput): void;

  access?(view: DataView, byteOffset: number): TAccess;
};

export function normalizeIndex(index: number, length: number): number {
  const normalized = index < 0 ? length + index : index;

  if (normalized < 0 || normalized >= length) {
    throw new RangeError(`Index out of bounds: ${index}`);
  }

  return normalized;
}
