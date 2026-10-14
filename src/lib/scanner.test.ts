import { SCAN_DIM, SCAN_SCALES, SCAN_SPECIES, SCAN_VECTORS } from '@/catalog/scan-data';

import { decodeBase64 } from './climate';
import { rankMatches } from './scanner';

/** A species' own fingerprint, as if a photo matched it perfectly. */
function fingerprintOf(id: string): number[] {
  const i = SCAN_SPECIES.indexOf(id);
  const v = decodeBase64(SCAN_VECTORS);
  const scales = new Float32Array(decodeBase64(SCAN_SCALES).slice().buffer);
  const out: number[] = [];
  for (let d = 0; d < SCAN_DIM; d++) {
    const byte = v[i * SCAN_DIM + d];
    out.push((byte > 127 ? byte - 256 : byte) * scales[i]);
  }
  return out;
}

test('scanner data covers the catalog', () => {
  expect(SCAN_SPECIES.length).toBeGreaterThan(1800);
  expect(decodeBase64(SCAN_VECTORS).length).toBe(SCAN_SPECIES.length * SCAN_DIM);
});

test('a perfect match ranks first and maps to a catalog plant', () => {
  for (const id of ['epipremnum-aureum', 'monstera-deliciosa', 'zamioculcas-zamiifolia']) {
    const [best, ...rest] = rankMatches(fingerprintOf(id));
    expect(best.species.id).toBe(id);
    expect(rest).toHaveLength(4);
    expect(new Set([best, ...rest].map((m) => m.species.id)).size).toBe(5);
  }
});
