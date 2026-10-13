import { CARE_GROUPS } from './groups';
import { GROUP_DETAILS } from './details';
import { GUIDES } from './guides';
import { SPECIES_DESCRIPTIONS } from './descriptions';
import { GROWSPOT_SPECIES } from './growspot-species';
import { baseSpecies, descriptionFor, getGuide } from './media';
import { getSpecies, speciesId } from './index';
import { PHOSPHOR } from '@/components/icons/phosphor-paths';

const GUIDE_IDS = [
  'mealybugs',
  'spider-mites',
  'fungus-gnats',
  'thrips',
  'scale',
  'aphids',
  'whitefly',
  'yellow-leaves',
  'brown-tips',
  'brown-spots',
  'drooping',
  'root-rot',
  'leggy-growth',
  'leaf-drop',
  'curling-leaves',
  'pale-leaves',
  'shrivelled-leaves',
  'sunburn',
  'no-flowers',
  'stem-cuttings-water',
  'stem-cuttings-soil',
  'leaf-cuttings',
  'division',
  'offsets',
  'plantlets',
  'air-layering',
  'seed',
  'watering',
  'repotting',
  'feeding',
  'humidity',
  'cleaning-leaves',
  'winter-rest',
  'light',
  'outdoors',
];

test('every care group has details, and only those', () => {
  expect(Object.keys(GROUP_DETAILS).sort()).toEqual(CARE_GROUPS.map((g) => g.id).sort());
});

test.each(CARE_GROUPS.map((g) => [g.id, g] as const))('%s details are sensible', (id, group) => {
  const d = GROUP_DETAILS[id];
  expect(d.idealTempC[0]).toBeGreaterThanOrEqual(group.minTempC);
  expect(d.idealTempC[1]).toBeGreaterThan(d.idealTempC[0]);
  expect(d.soil.repotYears[0]).toBeLessThanOrEqual(d.soil.repotYears[1]);
  expect(d.signs.length).toBeGreaterThan(0);
  for (const ref of [...d.signs, ...d.pests, ...d.propagation]) expect(getGuide(ref)).toBeDefined();
});

test('there is exactly one guide per guide id, each with a valid icon', () => {
  expect(GUIDES.map((g) => g.id).sort()).toEqual([...GUIDE_IDS].sort());
  for (const g of GUIDES) {
    expect(PHOSPHOR[g.icon]).toBeDefined();
    expect(g.sections.length).toBeGreaterThan(0);
  }
});

test('descriptions are keyed by real species and cultivars fall back to their species', () => {
  const names = new Set(GROWSPOT_SPECIES.map(([s]) => s));
  for (const key of Object.keys(SPECIES_DESCRIPTIONS)) expect(names).toContain(key);
  expect(descriptionFor(speciesId('Epipremnum aureum'))).toBeDefined();
  expect(baseSpecies("Epipremnum aureum 'Jade'")).toBe('Epipremnum aureum');
  expect(baseSpecies('Calathea')).toBe('Calathea');
  // A cultivar without its own text borrows its species' description.
  const cultivar = GROWSPOT_SPECIES.find(
    ([s]) => s.startsWith('Epipremnum aureum ') && !SPECIES_DESCRIPTIONS[s],
  );
  if (cultivar) {
    expect(descriptionFor(getSpecies(speciesId(cultivar[0]))!.id)).toBe(
      SPECIES_DESCRIPTIONS['Epipremnum aureum'],
    );
  }
});

test('bundled photos: popular plants have one, cultivars borrow their species photo', () => {
  const { catalogPhoto } = jest.requireActual('./media') as typeof import('./media');
  const pothos = catalogPhoto(speciesId('Epipremnum aureum'));
  expect(pothos?.ofSpecies).toBe(false);
  expect(pothos?.licence).toMatch(/CC|Public domain/i);
  const jade = catalogPhoto(speciesId("Epipremnum aureum 'Jade'"));
  expect(jade?.ofSpecies).toBe(true);
  expect(jade?.page).toBe(pothos?.page);
});
