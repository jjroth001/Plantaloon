import { CLIMATE } from '@/catalog/climate-data';

/**
 * Average nightly low per month on a 1° grid, from NASA POWER's 2001–2025 climatology
 * (power.larc.nasa.gov). Stored as one byte per month and cell: °C + 100, 255 = no data.
 */

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function decodeBase64(text: string): Uint8Array {
  const clean = text.replace(/[^A-Za-z0-9+/]/g, '');
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let o = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const n =
      (B64.indexOf(clean[i]) << 18) |
      (B64.indexOf(clean[i + 1]) << 12) |
      ((B64.indexOf(clean[i + 2] ?? 'A') & 63) << 6) |
      (B64.indexOf(clean[i + 3] ?? 'A') & 63);
    out[o++] = (n >> 16) & 255;
    if (i + 2 < clean.length) out[o++] = (n >> 8) & 255;
    if (i + 3 < clean.length) out[o++] = n & 255;
  }
  return out.subarray(0, o);
}

let grid: Uint8Array | null = null;

/** The 12 monthly average lows (°C) near a place, or null if there's no data there. */
export function monthlyLows(lat: number, lon: number): number[] | null {
  if (!CLIMATE.rows) return null;
  grid ??= decodeBase64(CLIMATE.data);
  const row = Math.min(CLIMATE.rows - 1, Math.max(0, Math.floor(lat + 90)));
  const col = (((Math.floor(lon + 180) % 360) + 360) % 360) % CLIMATE.cols;
  const start = (row * CLIMATE.cols + col) * 12;
  const values = Array.from(grid.subarray(start, start + 12));
  if (values.length < 12 || values.some((v) => v === 255)) return null;
  return values.map((v) => v - 100);
}

/** Which months nights stay at or above a plant's lowest comfortable temperature. */
export function outdoorMonths(lows: readonly number[], minTempC: number): boolean[] {
  return lows.map((low) => low >= minTempC);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "May – Sep", "All year", "Never", or "Nov – Mar" (wrapping round the new year). */
export function describeMonths(flags: readonly boolean[]): string {
  const count = flags.filter(Boolean).length;
  if (count === 12) return 'All year';
  if (count === 0) return 'Not warm enough';
  // Find the start of the longest run, allowing it to wrap from December into January.
  let bestStart = 0;
  let bestLength = 0;
  for (let start = 0; start < 12; start++) {
    if (!flags[start] || flags[(start + 11) % 12]) continue;
    let length = 0;
    while (length < 12 && flags[(start + length) % 12]) length++;
    if (length > bestLength) {
      bestLength = length;
      bestStart = start;
    }
  }
  if (bestLength === 1) return MONTHS[bestStart];
  return `${MONTHS[bestStart]} – ${MONTHS[(bestStart + bestLength - 1) % 12]}`;
}

export const MONTH_INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
