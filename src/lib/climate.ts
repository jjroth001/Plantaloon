import type { CLIMATE as ClimateGrid } from '@/catalog/climate-data';

/**
 * Average nightly low per month on a 1° grid, from NASA POWER's 2001–2025 climatology
 * (power.larc.nasa.gov). Stored as one byte per month and cell: °C + 100, 255 = no data.
 */

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
/** Character code → 6-bit value, so decoding is a table lookup rather than a search. */
const B64_VALUE = new Uint8Array(128);
for (let i = 0; i < B64.length; i++) B64_VALUE[B64.charCodeAt(i)] = i;

export function decodeBase64(text: string): Uint8Array {
  const clean = text.replace(/[^A-Za-z0-9+/]/g, '');
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  const at = (i: number) => (i < clean.length ? B64_VALUE[clean.charCodeAt(i)] : 0);
  let o = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const n = (at(i) << 18) | (at(i + 1) << 12) | (at(i + 2) << 6) | at(i + 3);
    out[o++] = (n >> 16) & 255;
    if (i + 2 < clean.length) out[o++] = (n >> 8) & 255;
    if (i + 3 < clean.length) out[o++] = n & 255;
  }
  return out.subarray(0, o);
}

// The grid is 1 MB of code: loaded the first time it's needed, not at startup.
let grid: typeof ClimateGrid | null = null;
function climate(): typeof ClimateGrid {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  grid ??= (require('@/catalog/climate-data') as { CLIMATE: typeof ClimateGrid }).CLIMATE;
  return grid;
}

// Screens ask on every redraw, nearly always for the same place.
let last: { key: string; lows: number[] | null } | null = null;

/** The 12 monthly average lows (°C) near a place, or null if there's no data there. */
export function monthlyLows(lat: number, lon: number): number[] | null {
  const key = `${lat},${lon}`;
  if (last?.key !== key) last = { key, lows: lookUpLows(lat, lon) };
  return last.lows;
}

function lookUpLows(lat: number, lon: number): number[] | null {
  const CLIMATE = climate();
  if (!CLIMATE.rows) return null;
  const row = Math.min(CLIMATE.rows - 1, Math.max(0, Math.floor(lat + 90)));
  const col = (((Math.floor(lon + 180) % 360) + 360) % 360) % CLIMATE.cols;
  // Each cell is 12 bytes, a multiple of 3, so its bytes are exactly 16 base64 characters:
  // decode just those instead of the whole 1 MB grid.
  const start = ((row * CLIMATE.cols + col) * 12 * 4) / 3;
  const values = Array.from(decodeBase64(CLIMATE.data.slice(start, start + 16)));
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
