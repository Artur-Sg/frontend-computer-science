const UINT32_SIZE = 4;
const LITTLE_ENDIAN = true;

export class Utf8StringsBuffer {
  constructor(public raw: ArrayBuffer) {}

  get byteLength(): number {
    return this.raw.byteLength;
  }

  at(index: number): string | undefined {
    let offset = 0;

    const decoder = new TextDecoder();
    const view = new DataView(this.raw);
    const count = view.getUint32(offset, LITTLE_ENDIAN);

    offset += UINT32_SIZE;

    if (index < 0) {
      index = count + index;
    }

    if (index < 0 || index >= count) {
      return undefined;
    }

    for (let i = 0; i < count; i++) {
      const length = view.getUint32(offset, LITTLE_ENDIAN);

      offset += UINT32_SIZE;

      if (i === index) {
        const encodedString = new Uint8Array(this.raw, offset, length);
        const decodedString = decoder.decode(encodedString);

        return decodedString;
      }

      offset += length;
    }

    return undefined;
  }
}

export function encodeStrings(strings: string[]): Utf8StringsBuffer {
  const encoder = new TextEncoder();
  const encodedStrings = strings.map((str) => encoder.encode(str));

  let totalBytes = UINT32_SIZE + UINT32_SIZE * encodedStrings.length;

  for (const encoded of encodedStrings) {
    totalBytes += encoded.byteLength;
  }

  const raw = new ArrayBuffer(totalBytes);
  const bytes = new Uint8Array(raw);
  const view = new DataView(raw);

  let offset = 0;

  view.setUint32(offset, strings.length, LITTLE_ENDIAN);
  offset += UINT32_SIZE;

  for (const encoded of encodedStrings) {
    view.setUint32(offset, encoded.byteLength, LITTLE_ENDIAN);
    offset += UINT32_SIZE;

    bytes.set(encoded, offset);
    offset += encoded.byteLength;
  }

  return new Utf8StringsBuffer(raw);
}

export function decodeStrings(buffer: Utf8StringsBuffer): string[] {
  let offset = 0;

  const rawData = buffer.raw;
  const view = new DataView(rawData);
  const decoder = new TextDecoder();
  const count = view.getUint32(offset, LITTLE_ENDIAN);
  const res: string[] = [];

  offset += UINT32_SIZE;

  for (let i = 0; i < count; i++) {
    const encodedStringLength = view.getUint32(offset, LITTLE_ENDIAN);

    offset += UINT32_SIZE;

    const encodedString = new Uint8Array(rawData, offset, encodedStringLength);
    const decodedString = decoder.decode(encodedString);

    res.push(decodedString);
    offset += encodedStringLength;
  }

  return res;
}
