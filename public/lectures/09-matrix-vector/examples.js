// Лекция 09. Примеры

// 1) 2D-матрица на плоском массиве (row-major)
class Matrix {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.data = new Array(rows * cols).fill(0);
  }

  getIndex(row, col) {
    return row * this.cols + col;
  }

  get(row, col) {
    return this.data[this.getIndex(row, col)];
  }

  set(row, col, value) {
    this.data[this.getIndex(row, col)] = value;
  }
}

const m = new Matrix(2, 3);
m.set(1, 2, 42);
console.log('Matrix get(1,2):', m.get(1, 2)); // 42

// 2) 3D-матрица с разным порядком индексации
const MatrixOrder = {
  RowMajor: 'row-major',
  ColumnMajor: 'column-major',
  DepthMajor: 'depth-major'
};

class Matrix3D {
  constructor(rows, cols, depths, order = MatrixOrder.RowMajor) {
    this.rows = rows;
    this.cols = cols;
    this.depths = depths;
    this.order = order;
    this.data = new Array(rows * cols * depths).fill(0);
  }

  getIndex(row, col, depth) {
    if (this.order === MatrixOrder.ColumnMajor) {
      return col * this.rows * this.depths + row * this.depths + depth;
    }

    if (this.order === MatrixOrder.DepthMajor) {
      return depth * this.rows * this.cols + row * this.cols + col;
    }

    return row * this.cols * this.depths + col * this.depths + depth;
  }

  get(row, col, depth) {
    return this.data[this.getIndex(row, col, depth)];
  }

  set(row, col, depth, value) {
    this.data[this.getIndex(row, col, depth)] = value;
  }
}

const cube = new Matrix3D(2, 2, 2, MatrixOrder.RowMajor);
cube.set(1, 1, 1, 99);
console.log('Matrix3D get(1,1,1):', cube.get(1, 1, 1)); // 99

// 3) Кортеж [int32, float32] в ArrayBuffer через DataView
class Tuple {
  static BYTES_PER_ELEMENT = 8;

  static getFirst(view, offset = 0, littleEndian = true) {
    return view.getInt32(offset, littleEndian);
  }

  static setFirst(view, offset = 0, value, littleEndian = true) {
    view.setInt32(offset, value, littleEndian);
  }

  static getSecond(view, offset = 0, littleEndian = true) {
    return view.getFloat32(offset + 4, littleEndian);
  }

  static setSecond(view, offset = 0, value, littleEndian = true) {
    view.setFloat32(offset + 4, value, littleEndian);
  }
}

class TupleArray {
  constructor(length) {
    this.BYTES_PER_ELEMENT = Tuple.BYTES_PER_ELEMENT;
    this.buffer = new ArrayBuffer(length * this.BYTES_PER_ELEMENT);
    this.view = new DataView(this.buffer);
  }

  getIndex(index) {
    return index * this.BYTES_PER_ELEMENT;
  }

  set(index, value) {
    const i = this.getIndex(index);
    Tuple.setFirst(this.view, i, value[0]);
    Tuple.setSecond(this.view, i, value[1]);
  }

  get(index) {
    const i = this.getIndex(index);
    return [Tuple.getFirst(this.view, i), Tuple.getSecond(this.view, i)];
  }
}

const tuples = new TupleArray(3);
tuples.set(0, [42, 3.14]);
tuples.set(1, [100, 2.718]);
console.log('TupleArray get(1):', tuples.get(1));
