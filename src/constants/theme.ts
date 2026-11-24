/**
 * Colors. Plain solid surfaces in light or dark mode, plus one accent color the user picks
 * in Settings › Appearance. Water and fertilizer keep their own colors whatever the accent,
 * so the two tasks are always recognisable. Contrast is checked by theme.test.ts.
 */

export type ThemeMode = 'system' | 'light' | 'dark';

export const ACCENTS = {
  leaf: { label: 'Leaf', light: '#3B7A4C', dark: '#86C99B' },
  moss: { label: 'Moss', light: '#5C6B26', dark: '#B9CB7C' },
  teal: { label: 'Teal', light: '#1D7070', dark: '#72CDC7' },
  ocean: { label: 'Ocean', light: '#2B62A3', dark: '#94BEF0' },
  plum: { label: 'Plum', light: '#7A4A8A', dark: '#D2A9E0' },
  clay: { label: 'Clay', light: '#A5462A', dark: '#F0A587' },
} as const;

export type AccentName = keyof typeof ACCENTS;

export type Palette = {
  dark: boolean;
  /** The screen behind everything. */
  background: string;
  /** Cards and list panels. */
  card: string;
  /** Inputs, chips and rows inside a card. */
  element: string;
  /** Hairline borders around cards. */
  border: string;
  text: string;
  textSecondary: string;
  /** The accent: primary buttons, selected tab, links. */
  tint: string;
  /** Text and icons on top of `tint`. */
  onTint: string;
  /** A wash of the accent, for selected chips and icon circles. */
  tintSoft: string;
  water: string;
  waterSoft: string;
  fertilize: string;
  fertilizeSoft: string;
  /** Text and icons on top of a solid water or feed button (the Done check on Today). */
  onTask: string;
  /** Destructive or truly serious: erase, delete, toxic to pets, unwell. */
  danger: string;
  dangerSoft: string;
  /** Gentle heads-ups: too dark, too cold, late, struggling. Orange, so it never reads as feed gold. */
  warning: string;
  warningSoft: string;
  /** Sunny yellow for light levels. */
  sun: string;
  sunSoft: string;
};

function withAlpha(hex: string, alpha: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export function makePalette(dark: boolean, accent: AccentName): Palette {
  const tint = ACCENTS[accent][dark ? 'dark' : 'light'];
  if (dark) {
    return {
      dark: true,
      background: '#121412',
      card: '#1C1F1B',
      element: 'rgba(255,255,255,0.07)',
      border: 'rgba(255,255,255,0.08)',
      text: '#ECEFE9',
      textSecondary: '#A9AFA5',
      tint,
      onTint: '#111511',
      tintSoft: withAlpha(tint, 0.16),
      water: '#86BDF2',
      waterSoft: 'rgba(134,189,242,0.16)',
      fertilize: '#E5BC66',
      fertilizeSoft: 'rgba(229,188,102,0.16)',
      onTask: '#111511',
      danger: '#FF9C94',
      dangerSoft: 'rgba(255,156,148,0.14)',
      warning: '#F5A15C',
      warningSoft: 'rgba(245,161,92,0.15)',
      sun: '#EDC56B',
      sunSoft: 'rgba(237,197,107,0.14)',
    };
  }
  return {
    dark: false,
    background: '#F5F4EF',
    card: '#FFFFFF',
    element: 'rgba(30,36,28,0.05)',
    border: 'rgba(30,36,28,0.09)',
    text: '#1B2019',
    textSecondary: '#5A6157',
    tint,
    onTint: '#FFFFFF',
    tintSoft: withAlpha(tint, 0.11),
    water: '#2468A8',
    waterSoft: 'rgba(36,104,168,0.10)',
    fertilize: '#8C5F0D',
    fertilizeSoft: 'rgba(140,95,13,0.10)',
    onTask: '#FFFFFF',
    danger: '#B42318',
    dangerSoft: 'rgba(180,35,24,0.08)',
    warning: '#A64B00',
    warningSoft: 'rgba(214,110,20,0.12)',
    sun: '#9A6410',
    sunSoft: 'rgba(226,181,76,0.18)',
  };
}

/** Pressed look for anything tappable that has no other press feedback. */
export const PRESSED_OPACITY = 0.7;

export type ThemeColor = Exclude<keyof Palette, 'dark'>;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 10,
  medium: 16,
  large: 22,
} as const;
