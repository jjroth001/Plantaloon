import { decodeUtf8, LineSplitter } from './lines';

const encode = (s: string) => new TextEncoder().encode(s);

describe('decodeUtf8 without TextDecoder', () => {
  const original = globalThis.TextDecoder;
  beforeAll(() => {
    // @ts-expect-error simulate an engine without TextDecoder
    delete globalThis.TextDecoder;
  });
  afterAll(() => {
    globalThis.TextDecoder = original;
  });

  test('handles ASCII, accents, curly quotes and emoji-range characters', () => {
    for (const text of ['plain', 'Café ’quoted’', 'Ficus 🌿 big', 'x'.repeat(20000)]) {
      expect(decodeUtf8(encode(text))).toBe(text);
    }
  });
});

test('splits lines across chunk boundaries, including multi-byte characters', () => {
  const bytes = encode('{"a":"Café"}\nsecond line\r\nlast');
  const splitter = new LineSplitter();
  const lines: string[] = [];
  for (let i = 0; i < bytes.length; i += 3) lines.push(...splitter.push(bytes.subarray(i, i + 3)));
  const rest = splitter.flush();
  expect([...lines, rest]).toEqual(['{"a":"Café"}', 'second line', 'last']);
  expect(splitter.flush()).toBeNull();
});
