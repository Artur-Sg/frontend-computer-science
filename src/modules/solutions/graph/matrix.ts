export interface ElementView<T> {
  bytesPerElement: number;
  zero: T;
  one: T;

  read(view: DataView, byteOffset: number): T;
  write(view: DataView, byteOffset: number, value: T): void;
  isZero(value: T): boolean;
}

export type ArrayTypes =
  | Uint8Array
  | Uint8ClampedArray
  | Int8Array
  | Uint16Array
  | Int16Array
  | Uint32Array
  | Int32Array
  | Float32Array
  | Float64Array
  | BigUint64Array
  | BigInt64Array;

export type ArrayConstructor<T extends ArrayTypes = ArrayTypes> = new (capacity: number) => T;

export type ArrayValue<T extends ArrayTypes> = T extends BigUint64Array | BigInt64Array
  ? bigint
  : number;

type NumericMatrixValue = number | bigint;

function createElementView<T>(
  bytesPerElement: number,
  zero: T,
  one: T,
  read: (view: DataView, byteOffset: number) => T,
  write: (view: DataView, byteOffset: number, value: T) => void,
): ElementView<T> {
  return {
    bytesPerElement,
    zero,
    one,
    read,
    write,
    isZero: (value) => value === zero,
  };
}

function createNumericElementView(ArrayClass: ArrayConstructor<ArrayTypes>): ElementView<NumericMatrixValue> {
  switch (ArrayClass) {
    case Uint8Array:
      return createElementView(Uint8Array.BYTES_PER_ELEMENT, 0, 1,
        (view, byteOffset) => view.getUint8(byteOffset),
        (view, byteOffset, value) => view.setUint8(byteOffset, value),
      );
    case Uint8ClampedArray:
      return createElementView(Uint8ClampedArray.BYTES_PER_ELEMENT, 0, 1,
        (view, byteOffset) => view.getUint8(byteOffset),
        (view, byteOffset, value) => {
          const clampedValue = Math.max(0, Math.min(255, Math.round(value as number)));

          view.setUint8(byteOffset, clampedValue);
        },
      );
    case Int8Array:
      return createElementView(Int8Array.BYTES_PER_ELEMENT, 0, 1,
        (view, byteOffset) => view.getInt8(byteOffset),
        (view, byteOffset, value) => view.setInt8(byteOffset, value),
      );
    case Uint16Array:
      return createElementView(Uint16Array.BYTES_PER_ELEMENT, 0, 1,
        (view, byteOffset) => view.getUint16(byteOffset, true),
        (view, byteOffset, value) => view.setUint16(byteOffset, value, true),
      );
    case Int16Array:
      return createElementView(Int16Array.BYTES_PER_ELEMENT, 0, 1,
        (view, byteOffset) => view.getInt16(byteOffset, true),
        (view, byteOffset, value) => view.setInt16(byteOffset, value, true),
      );
    case Uint32Array:
      return createElementView(Uint32Array.BYTES_PER_ELEMENT, 0, 1,
        (view, byteOffset) => view.getUint32(byteOffset, true),
        (view, byteOffset, value) => view.setUint32(byteOffset, value, true),
      );
    case Int32Array:
      return createElementView(Int32Array.BYTES_PER_ELEMENT, 0, 1,
        (view, byteOffset) => view.getInt32(byteOffset, true),
        (view, byteOffset, value) => view.setInt32(byteOffset, value, true),
      );
    case Float32Array:
      return createElementView(Float32Array.BYTES_PER_ELEMENT, 0, 1,
        (view, byteOffset) => view.getFloat32(byteOffset, true),
        (view, byteOffset, value) => view.setFloat32(byteOffset, value, true),
      );
    case Float64Array:
      return createElementView(Float64Array.BYTES_PER_ELEMENT, 0, 1,
        (view, byteOffset) => view.getFloat64(byteOffset, true),
        (view, byteOffset, value) => view.setFloat64(byteOffset, value, true),
      );
    case BigUint64Array:
      return createElementView(BigUint64Array.BYTES_PER_ELEMENT, 0n, 1n,
        (view, byteOffset) => view.getBigUint64(byteOffset, true),
        (view, byteOffset, value) => view.setBigUint64(byteOffset, value, true),
      );
    case BigInt64Array:
      return createElementView(BigInt64Array.BYTES_PER_ELEMENT, 0n, 1n,
        (view, byteOffset) => view.getBigInt64(byteOffset, true),
        (view, byteOffset, value) => view.setBigInt64(byteOffset, value, true),
      );
    default:
      throw new TypeError('Unsupported typed array constructor');
  }
}

export class Matrix<T = number> {
  readonly width: number;
  readonly height: number;
  readonly elementView: ElementView<T>;
  readonly ArrayClass?: ArrayConstructor<ArrayTypes>;
  readonly buffer: ArrayBuffer;

  private readonly dataView: DataView;

  constructor(ArrayClass: ArrayConstructor<ArrayTypes>, width: number, height: number);
  constructor(width: number, height: number, elementView: ElementView<T>);
  constructor(
    first: number | ArrayConstructor<ArrayTypes>,
    second: number,
    third: number | ElementView<T>,
  ) {
    const width = typeof first === 'number' ? first : second;
    const height = typeof first === 'number' ? second : (third as number);
    const elementView = typeof first === 'number'
      ? (third as ElementView<T>)
      : (createNumericElementView(first) as ElementView<T>);

    if (!Number.isInteger(width) || width <= 0) {
      throw new RangeError('width должно быть больше нуля');
    }

    if (!Number.isInteger(height) || height <= 0) {
      throw new RangeError('height должно быть больше нуля');
    }

    this.width = width;
    this.height = height;
    this.elementView = elementView;
    this.ArrayClass = typeof first === 'number' ? undefined : first;
    this.buffer = new ArrayBuffer(width * height * elementView.bytesPerElement);
    this.dataView = new DataView(this.buffer);
  }

  get(row: number, col: number): T {
    return this.elementView.read(this.dataView, this.getByteOffset(row, col));
  }

  set(row: number, col: number, value: T): void {
    this.elementView.write(this.dataView, this.getByteOffset(row, col), value);
  }

  fill(value: T): void {
    for (
      let byteOffset = 0;
      byteOffset < this.buffer.byteLength;
      byteOffset += this.elementView.bytesPerElement
    ) {
      this.elementView.write(this.dataView, byteOffset, value);
    }
  }

  private getIndex(row: number, col: number): number {
    this.assertIndex(row, this.height);
    this.assertIndex(col, this.width);

    return row * this.width + col;
  }

  private getByteOffset(row: number, col: number): number {
    return this.getIndex(row, col) * this.elementView.bytesPerElement;
  }

  private assertIndex(index: number, size: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= size) {
      throw new RangeError('Index is out of bounds');
    }
  }
}
