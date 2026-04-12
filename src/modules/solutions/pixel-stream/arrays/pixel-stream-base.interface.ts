export type RGBA = [red: number, green: number, blue: number, alpha: number];

export type RGBAObject = { red: number; green: number; blue: number; alpha: number };

export enum TraverseMode {
  RowMajor,
  ColMajor,
}

export interface PixelStream {
  getPixel(x: number, y: number): RGBA;
  setPixel(x: number, y: number, rgba: RGBA): RGBA;
  forEach(mode: TraverseMode, callback: (rgba: RGBA, x: number, y: number) => void): void;
}
