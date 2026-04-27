const UINT32_SIZE = 4;
const POINTER_ENTRY_SIZE = UINT32_SIZE * 2;
const LITTLE_ENDIAN = true;


export class Utf8StringsPointersBuffer {
  constructor(public raw: ArrayBuffer) {}

  get byteLength(): number {
    return this.raw.byteLength;
  }

  at(index: number): string | undefined {
    const decoder = new TextDecoder();
    const view = new DataView(this.raw);

    const count = view.getUint32(0, LITTLE_ENDIAN);

    if (index < 0) {
      index = count + index;
    }

    if (index < 0 || index >= count) {
      return undefined;
    }

    const entryOffset = UINT32_SIZE + index * POINTER_ENTRY_SIZE;
    const length = view.getUint32(entryOffset, LITTLE_ENDIAN);
    const pointer = view.getUint32(entryOffset + UINT32_SIZE, LITTLE_ENDIAN);

    const encodedString = new Uint8Array(this.raw, pointer, length);
    const decodedString = decoder.decode(encodedString);

    return decodedString;
  }

  set(index: number, value: string): void {
    const view = new DataView(this.raw);

    const count = view.getUint32(0, LITTLE_ENDIAN);

    if (index < 0) {
      index = count + index;
    }

    if (index < 0 || index >= count) {
      return;
    }

    const decoded = decodeStrings(this);

    decoded[index] = value;

    const newBuffer = encodeStrings(decoded);

    this.raw = newBuffer.raw;
  }
}

export function encodeStrings(strings: string[]): Utf8StringsPointersBuffer {
  const encoder = new TextEncoder();
  const encodedStrings = strings.map((str) => encoder.encode(str));
  const count = encodedStrings.length;

  let totalBytes = UINT32_SIZE + POINTER_ENTRY_SIZE * encodedStrings.length;

  for (const encoded of encodedStrings) {
    totalBytes += encoded.byteLength;
  }

  const raw = new ArrayBuffer(totalBytes);
  const bytes = new Uint8Array(raw);
  const view = new DataView(raw);

  view.setUint32(0, strings.length, LITTLE_ENDIAN);

  let tableOffset = UINT32_SIZE;
  let dataOffset = UINT32_SIZE + POINTER_ENTRY_SIZE * count;

  for (const encoded of encodedStrings) {
    const pointer = dataOffset;

    view.setUint32(tableOffset, encoded.byteLength, LITTLE_ENDIAN);
    view.setUint32(tableOffset + UINT32_SIZE, pointer, LITTLE_ENDIAN);

    bytes.set(encoded, dataOffset);

    tableOffset += POINTER_ENTRY_SIZE;
    dataOffset += encoded.byteLength;
  }

  return new Utf8StringsPointersBuffer(raw);
}

export function decodeStrings(buffer: Utf8StringsPointersBuffer): string[] {
  const rawData = buffer.raw;
  const view = new DataView(rawData);
  const count = view.getUint32(0, LITTLE_ENDIAN);
  const res: string[] = [];

  for (let i = 0; i < count; i++) {
    const decodedString = buffer.at(i);

    if (decodedString !== undefined) {
      res.push(decodedString);
    }
  }

  return res;
}
