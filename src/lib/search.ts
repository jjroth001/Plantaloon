/**
 * Plant search: matches common, scientific and cultivar names, tolerates small typos, and
 * ranks popular plants first. Pure functions, so they're easy to test.
 */

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[‘’'`"“”().,/×-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Edit distance (with swaps), stopping early once it exceeds `max`. */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) => {
    const row = new Array<number>(cols).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 0; j < cols; j++) d[0][j] = j;
  for (let i = 1; i < rows; i++) {
    let rowMin = Infinity;
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
      rowMin = Math.min(rowMin, d[i][j]);
    }
    if (rowMin > max) return max + 1;
  }
  return d[a.length][b.length];
}

function typoAllowance(word: string): number {
  if (word.length >= 8) return 2;
  if (word.length >= 4) return 1;
  return 0;
}

/** Does query word `q` match name word `w`: as a prefix, or within a typo or two? */
function wordMatches(q: string, w: string): 'prefix' | 'fuzzy' | null {
  if (w.startsWith(q)) return 'prefix';
  const allowance = typoAllowance(q);
  if (allowance === 0) return null;
  // Compare against the same-length start of the word, so "monstra" finds "monstera".
  const target = w.length > q.length + allowance ? w.slice(0, q.length + 1) : w;
  return editDistance(q, target, allowance) <= allowance ? 'fuzzy' : null;
}

/** Score one name against a normalized query; 0 = no match. */
export function scoreName(query: string, name: string): number {
  if (!query) return 0;
  if (name === query) return 100;
  if (name.startsWith(query)) return 80;
  const qWords = query.split(' ');
  const nWords = name.split(' ');
  let fuzzy = false;
  for (const q of qWords) {
    let best: 'prefix' | 'fuzzy' | null = null;
    for (const w of nWords) {
      const m = wordMatches(q, w);
      if (m === 'prefix') {
        best = 'prefix';
        break;
      }
      if (m === 'fuzzy') best = 'fuzzy';
    }
    if (!best) return 0;
    if (best === 'fuzzy') fuzzy = true;
  }
  return fuzzy ? 30 : 60;
}

export type Searchable = {
  id: string;
  /** Names to match, already normalized; the first is the main one. */
  names: string[];
  popular: boolean;
  /** Cultivars ('Marble Queen') rank just below their species. */
  cultivar: boolean;
};

export function search<T extends Searchable>(items: readonly T[], query: string, limit = 60): T[] {
  const q = normalize(query);
  if (!q) return [];
  const scored: { item: T; score: number }[] = [];
  for (const item of items) {
    let best = 0;
    for (let i = 0; i < item.names.length; i++) {
      const s = scoreName(q, item.names[i]);
      if (s > best) best = s;
    }
    if (best === 0) continue;
    const score = best + (item.popular ? 15 : 0) - (item.cultivar ? 5 : 0);
    scored.push({ item, score });
  }
  scored.sort((a, b) => b.score - a.score || a.item.names[0].localeCompare(b.item.names[0]));
  return scored.slice(0, limit).map((s) => s.item);
}
