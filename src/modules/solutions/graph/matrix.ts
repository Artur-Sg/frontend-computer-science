export interface ElementView<T> {
  name: string;
  bytesPerElement: number;

  read(view: DataView, byteOffset: number): T;
  write(view: DataView, byteOffset: number, value: T): void;

  view?(view: DataView, byteOffset: number): T;
}

type Source = ArrayBuffer | ArrayBufferView;

export class Matrix<T = number> {
  readonly rows: number;

  readonly cols: number;

  readonly elementView: ElementView<T>;

  readonly buffer: ArrayBuffer;

  readonly byteOffset: number;

  readonly byteLength: number;

  private readonly dataView: DataView;

  constructor(
    rows: number,
    cols: number,
    elementView: ElementView<T>,
    source?: Source,
  ) {
    this.assertSize(rows, 'rows');
    this.assertSize(cols, 'cols');

    this.rows = rows;
    this.cols = cols;
    this.elementView = elementView;

    const requiredByteLength = rows * cols * elementView.bytesPerElement;

    if (source === undefined) {
      this.buffer = new ArrayBuffer(requiredByteLength);
      this.byteOffset = 0;
      this.byteLength = requiredByteLength;
    } else if (source instanceof ArrayBuffer) {
      if (source.byteLength < requiredByteLength) {
        throw new RangeError('Source buffer is too small');
      }

      this.buffer = source;
      this.byteOffset = 0;
      this.byteLength = requiredByteLength;
    } else {
      if (source.byteLength < requiredByteLength) {
        throw new RangeError('Source view is too small');
      }

      this.buffer = source.buffer as ArrayBuffer;
      this.byteOffset = source.byteOffset;
      this.byteLength = requiredByteLength;
    }

    this.dataView = new DataView(this.buffer, this.byteOffset, this.byteLength);
  }

  get(row: number, col: number): T {
    const byteOffset = this.getByteOffset(row, col);

    return this.elementView.read(this.dataView, byteOffset);
  }

  set(row: number, col: number, value: T): void {
    const byteOffset = this.getByteOffset(row, col);

    this.elementView.write(this.dataView, byteOffset, value);
  }

  fill(value: T): void {
    const { bytesPerElement } = this.elementView;

    for (
      let byteOffset = 0;
      byteOffset < this.byteLength;
      byteOffset += bytesPerElement
    ) {
      this.elementView.write(this.dataView, byteOffset, value);
    }
  }

  view(row: number, col: number): T {
    if (!this.elementView.view) {
      throw new Error('ElementView не поддерживает покомпонентный доступ');
    }

    const byteOffset = this.getByteOffset(row, col);

    return this.elementView.view(this.dataView, byteOffset);
  }

  private getIndex(row: number, col: number): number {
    return row * this.cols + col;
  }

  private getByteOffset(row: number, col: number): number {
    const normalizedRow = this.normalizeIndex(row, this.rows);
    const normalizedCol = this.normalizeIndex(col, this.cols);

    const index = this.getIndex(normalizedRow, normalizedCol);

    return index * this.elementView.bytesPerElement;
  }

  private normalizeIndex(index: number, size: number): number {
    if (!Number.isInteger(index)) {
      throw new RangeError('Index must be an integer');
    }

    const normalized = index < 0 ? size + index : index;

    if (normalized < 0 || normalized >= size) {
      throw new RangeError('Index is out of bounds');
    }

    return normalized;
  }

  private assertSize(value: number, name: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new RangeError(`${name} должно быть больше нуля`);
    }
  }
}
