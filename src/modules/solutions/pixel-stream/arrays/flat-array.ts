import { PixelStream, RGBA, TraverseMode } from './pixel-stream-base.interface';

export class FlatArray implements PixelStream {
  private RGBA_CHANNELS = 4;

  private data: number[];

  private width: number;

  private height: number;

  constructor(width: number, height: number) {
    // this.assertSize(width, height);
    this.width = width;
    this.height = height;

    const size = width * height * this.RGBA_CHANNELS;

    this.data = new Array(size);
    // this.data = new Array(size).fill(0);
  }

  getPixel(x: number, y: number): RGBA {
    // this.assertCoords(x, y);
    const index = (x + this.width * y) * this.RGBA_CHANNELS;

    return [this.data[index], this.data[index + 1], this.data[index + 2], this.data[index + 3]];
  }

  setPixel(x: number, y: number, rgba: RGBA): RGBA {
    // this.assertCoords(x, y);
    const index = (x + this.width * y) * this.RGBA_CHANNELS;
    const [r, g, b, a] = rgba;

    this.data[index] = r;
    this.data[index + 1] = g;
    this.data[index + 2] = b;
    this.data[index + 3] = a;

    return rgba;
  }

  forEach(mode: TraverseMode, callback: (rgba: RGBA, x: number, y: number) => void): void {
    if (mode === TraverseMode.RowMajor) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          callback(this.getPixel(x, y), x, y);
        }
      }
    } else {
      for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
          callback(this.getPixel(x, y), x, y);
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
