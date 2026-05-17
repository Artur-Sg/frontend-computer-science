import { normalizeIndex, type ElementView } from './types';

export class Matrix2D<TValue, TInput = TValue, TAccess = TValue> {
  readonly rows: number;

  readonly cols: number;

  readonly buffer: ArrayBufferLike;

  readonly byteOffset: number;

  readonly byteLength: number;

  readonly #elementView: ElementView<TValue, TInput, TAccess>;

  readonly #data: DataView;

  constructor(
    rows: number,
    cols: number,
    elementView: ElementView<TValue, TInput, TAccess>,
    source?: ArrayBufferLike | ArrayBufferView,
  ) {
    if (!Number.isInteger(rows) || rows <= 0) {
      throw new RangeError('Количество строк должно быть положительным целым числом');
    }

    if (!Number.isInteger(cols) || cols <= 0) {
      throw new RangeError('Количество столбцов должно быть положительным целым числом');
    }

    this.rows = rows;
    this.cols = cols;
    this.#elementView = elementView;

    const byteLength = rows * cols * elementView.bytesPerElement;

    if (source === undefined) {
      this.buffer = new ArrayBuffer(byteLength);
      this.byteOffset = 0;
      this.byteLength = byteLength;
      this.#data = new DataView(this.buffer);

      return;
    }

    if (source.byteLength < byteLength) {
      throw new RangeError('Переданный буфер меньше необходимого размера матрицы');
    }

    if (ArrayBuffer.isView(source)) {
      this.buffer = source.buffer;
      this.byteOffset = source.byteOffset;
      this.byteLength = byteLength;
      this.#data = new DataView(source.buffer, source.byteOffset, byteLength);

      return;
    }

    this.buffer = source;
    this.byteOffset = 0;
    this.byteLength = byteLength;
    this.#data = new DataView(source, 0, byteLength);
  }

  get(row: number, col: number): TValue {
    const byteOffset = this.#getByteOffset(row, col);

    return this.#elementView.read(this.#data, byteOffset);
  }

  set(row: number, col: number, value: TInput): void {
    const byteOffset = this.#getByteOffset(row, col);

    this.#elementView.write(this.#data, byteOffset, value);
  }

  fill(value: TInput): void {
    for (
      let byteOffset = 0;
      byteOffset < this.byteLength;
      byteOffset += this.#elementView.bytesPerElement
    ) {
      this.#elementView.write(this.#data, byteOffset, value);
    }
  }

  view(row: number, col: number): TAccess {
    if (this.#elementView.access === undefined) {
      throw new Error('Для этого типа элемента недоступен покомпонентный доступ');
    }

    const byteOffset = this.#getByteOffset(row, col);

    return this.#elementView.access(this.#data, byteOffset);
  }

  #getByteOffset(row: number, col: number): number {
    const normalizedRow = normalizeIndex(row, this.rows);
    const normalizedCol = normalizeIndex(col, this.cols);

    return (normalizedRow * this.cols + normalizedCol) * this.#elementView.bytesPerElement;
  }
}
