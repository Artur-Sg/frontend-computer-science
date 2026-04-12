import { PixelStream, RGBA, RGBAObject, TraverseMode } from './pixel-stream-base.interface';


export class ArrayOfObjects implements PixelStream {
  private data: Array<RGBAObject>;

  private width: number;

  private height: number;

  constructor(width: number, height: number) {
    // this.assertSize(width, height);
    this.width = width;
    this.height = height;

    const size = width * height;

    this.data = new Array(size);

    for (let i = 0; i < size; i++) {
      this.data[i] = { red: 0, green: 0, blue: 0, alpha: 0 };
    }
  }

  getPixel(x: number, y: number): RGBA {
    // this.assertCoords(x, y);

    const index = x + this.width * y;
    const p = this.data[index];

    return [p.red, p.green, p.blue, p.alpha];
  }

  setPixel(x: number, y: number, rgba: RGBA): RGBA {
    // this.assertCoords(x, y);

    const index = (x + this.width * y);
    const [red, green, blue, alpha] = rgba;

    this.data[index] = { red, green, blue, alpha };

    return rgba;
  }

  forEach(mode: TraverseMode, callback: (rgba: RGBA, x: number, y: number) => void): void {
    if (mode === TraverseMode.RowMajor) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const index = x + this.width * y;
          const p = this.data[index];

          callback([p.red, p.green, p.blue, p.alpha], x, y);
        }
      }
    } else {
      for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
          const index = x + this.width * y;
          const p = this.data[index];

          callback([p.red, p.green, p.blue, p.alpha], x, y);
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

