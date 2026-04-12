import { PixelStream, RGBA, TraverseMode } from './pixel-stream-base.interface';

export class ArrayOfArrays implements PixelStream {
  private data: Array<RGBA>;

  private width: number;

  private height: number;

  constructor(width: number, height: number) {
    // this.assertSize(width, height);
    this.width = width;
    this.height = height;

    const size = width * height;

    this.data = new Array(size);

    for (let i = 0; i < size; i++) {
      this.data[i] = [0, 0, 0, 0];
    }
  }

  getPixel(x: number, y: number): RGBA {
    // this.assertCoords(x, y);
    const index = x + this.width * y;

    return this.data[index];
  }

  setPixel(x: number, y: number, rgba: RGBA): RGBA {
    // this.assertCoords(x, y);
    const index = (x + this.width * y);

    this.data[index] = rgba;

    return rgba;
  }

  forEach(mode: TraverseMode, callback: (rgba: RGBA, x: number, y: number) => void): void {
    if (mode === TraverseMode.RowMajor) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const index = x + this.width * y;

          callback(this.data[index], x, y);
        }
      }
    } else {
      for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
          const index = x + this.width * y;

          callback(this.data[index], x, y);
        }
      }
    }
  }

  private assertSize(width: number, height: number): void {
    if (width <= 0 || height <= 0) {
      throw new RangeError('Размеры должны быть больше 0.');
    }
  }

  private assertCoords(x: number, y: number): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      throw new RangeError('Координаты вне диапазона.');
    }
  }
}
