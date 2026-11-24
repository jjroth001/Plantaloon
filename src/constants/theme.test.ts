import { ACCENTS, makePalette, type AccentName } from './theme';

function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const accents = Object.keys(ACCENTS) as AccentName[];

describe.each([false, true])('palette (dark: %s)', (dark) => {
  test.each(accents)('%s: button text and accent text are readable', (accent) => {
    const p = makePalette(dark, accent);
    expect(contrast(p.tint, p.onTint)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.tint, p.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.tint, p.card)).toBeGreaterThanOrEqual(4.5);
  });

  test('text and task colors are readable on background and cards', () => {
    const p = makePalette(dark, 'leaf');
    for (const surface of [p.background, p.card]) {
      expect(contrast(p.text, surface)).toBeGreaterThanOrEqual(7);
      expect(contrast(p.textSecondary, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.water, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.fertilize, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.danger, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.warning, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.sun, surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('the check on a solid water or feed button is readable', () => {
    const p = makePalette(dark, 'leaf');
    expect(contrast(p.onTask, p.water)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.onTask, p.fertilize)).toBeGreaterThanOrEqual(4.5);
  });

  test('warning stays clearly apart from danger and feed', () => {
    const p = makePalette(dark, 'leaf');
    const hue = (hex: string) => {
      const n = Number.parseInt(hex.slice(1), 16);
      const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => c / 255);
      const max = Math.max(r, g, b);
      const d = max - Math.min(r, g, b);
      const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      return (h * 60 + 360) % 360;
    };
    expect(Math.abs(hue(p.warning) - hue(p.fertilize))).toBeGreaterThanOrEqual(10);
    expect(Math.abs(hue(p.warning) - hue(p.danger))).toBeGreaterThanOrEqual(10);
  });
});
