/**
 * Splits a byte stream into UTF-8 text lines, so big backup files can be read a piece at a
 * time instead of loading every photo into memory at once.
 */

/** UTF-8 bytes → string (TextDecoder when the engine has it). */
export function decodeUtf8(bytes: Uint8Array): string {
  const Decoder = (globalThis as { TextDecoder?: new () => { decode(b: Uint8Array): string } })
    .TextDecoder;
  if (Decoder) return new Decoder().decode(bytes);
  let out = '';
  const codes: number[] = [];
  let i = 0;
  while (i < bytes.length) {
    let c = bytes[i++];
    if (c >= 0xf0) {
      c =
        ((c & 7) << 18) | ((bytes[i++] & 63) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
    } else if (c >= 0xe0) {
      c = ((c & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
    } else if (c >= 0xc0) {
      c = ((c & 31) << 6) | (bytes[i++] & 63);
    }
    if (c > 0xffff) {
      c -= 0x10000;
      codes.push(0xd800 + (c >> 10), 0xdc00 + (c & 1023));
    } else {
      codes.push(c);
    }
    if (codes.length >= 8192) {
      out += String.fromCharCode(...codes);
      codes.length = 0;
    }
  }
  return out + String.fromCharCode(...codes);
}

const NEWLINE = 10;

/** Feed it chunks of bytes; it hands back each complete line. */
export class LineSplitter {
  private parts: Uint8Array[] = [];

  push(chunk: Uint8Array): string[] {
    const lines: string[] = [];
    let start = 0;
    for (let i = 0; i < chunk.length; i++) {
      if (chunk[i] !== NEWLINE) continue;
      this.parts.push(chunk.subarray(start, i));
      lines.push(this.take());
      start = i + 1;
    }
    if (start < chunk.length) this.parts.push(chunk.slice(start));
    return lines;
  }

  /** The last line, if the stream didn't end with a newline. */
  flush(): string | null {
    return this.parts.length ? this.take() : null;
  }

  private take(): string {
    const length = this.parts.reduce((n, p) => n + p.length, 0);
    const joined = new Uint8Array(length);
    let offset = 0;
    for (const part of this.parts) {
      joined.set(part, offset);
      offset += part.length;
    }
    this.parts = [];
    return decodeUtf8(joined).replace(/\r$/, '');
  }
}
