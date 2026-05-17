import type { ElementView } from './types';

export type RGBAColor = readonly [
  red: number,
  green: number,
  blue: number,
  alpha: number,
];

export type RGBAInput = RGBAColor | string | ArrayLike<number>;

export type RGBAAccess = {
  red: number;
  green: number;
  blue: number;
  alpha: number;
};

function isHexColor(value: string): boolean {
  return /^([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value);
}

function parseHexByte(value: string): number {
  return Number.parseInt(value, 16);
}

function parseHexColor(value: string): RGBAColor {
  const hex = value.startsWith('#') ? value.slice(1) : value;

  if (!isHexColor(hex)) {
    throw new TypeError(`Invalid HEX color: ${value}`);
  }

  if (hex.length === 3 || hex.length === 4) {
    return [
      parseHexByte(hex[0] + hex[0]),
      parseHexByte(hex[1] + hex[1]),
      parseHexByte(hex[2] + hex[2]),
      hex[3] === undefined ? 255 : parseHexByte(hex[3] + hex[3]),
    ];
  }

  return [
    parseHexByte(hex.slice(0, 2)),
    parseHexByte(hex.slice(2, 4)),
    parseHexByte(hex.slice(4, 6)),
    hex.length === 8 ? parseHexByte(hex.slice(6, 8)) : 255,
  ];
}

function normalizeColor(value: RGBAInput): RGBAColor {
  if (typeof value === 'string') {
    return parseHexColor(value);
  }

  if (value.length < 3) {
    throw new TypeError('RGBA value must contain at least 3 components');
  }

  return [
    value[0],
    value[1],
    value[2],
    value[3] ?? 255,
  ];
}

const RGBA_BYTES_PER_ELEMENT = 4 as const;

export const RGBAView: ElementView<RGBAColor, RGBAInput, RGBAAccess> = {
  bytesPerElement: RGBA_BYTES_PER_ELEMENT,

  read(view: DataView, byteOffset: number): RGBAColor {
    return [
      view.getUint8(byteOffset),
      view.getUint8(byteOffset + 1),
      view.getUint8(byteOffset + 2),
      view.getUint8(byteOffset + 3),
    ];
  },

  write(view: DataView, byteOffset: number, value: RGBAInput): void {
    const [red, green, blue, alpha] = normalizeColor(value);

    view.setUint8(byteOffset, red);
    view.setUint8(byteOffset + 1, green);
    view.setUint8(byteOffset + 2, blue);
    view.setUint8(byteOffset + 3, alpha);
  },

  access(view: DataView, byteOffset: number): RGBAAccess {
    return {
      get red(): number {
        return view.getUint8(byteOffset);
      },
      set red(value: number) {
        view.setUint8(byteOffset, value);
      },

      get green(): number {
        return view.getUint8(byteOffset + 1);
      },
      set green(value: number) {
        view.setUint8(byteOffset + 1, value);
      },

      get blue(): number {
        return view.getUint8(byteOffset + 2);
      },
      set blue(value: number) {
        view.setUint8(byteOffset + 2, value);
      },

      get alpha(): number {
        return view.getUint8(byteOffset + 3);
      },
      set alpha(value: number) {
        view.setUint8(byteOffset + 3, value);
      },
    };
  },
};
