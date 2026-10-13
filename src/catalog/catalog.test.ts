import {
  ALL_GROUPS,
  ALL_SPECIES,
  careFor,
  genusOf,
  getSpecies,
  POPULAR_SPECIES_IDS,
  speciesId,
} from './index';
import { EXTRA_NAMES } from './extra-names';
import { CARE_GROUPS } from './groups';
import { GROWSPOT_SPECIES } from './growspot-species';
import { GROUP_OVERRIDES_BY_SPECIES, SPECIES_OVERRIDES } from './overrides';
import { searchSpecies } from './search-index';
import { PHOSPHOR } from '@/components/icons/phosphor-paths';

const scientificNames = new Set(GROWSPOT_SPECIES.map(([s]) => s));
const TIERS = ['low', 'medium', 'high', 'very_high'];

describe('care groups', () => {
  test('ids are unique, kebab-case, and every genus belongs to one group', () => {
    const ids = CARE_GROUPS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    const genera = CARE_GROUPS.flatMap((g) => g.genera);
    expect(new Set(genera).size).toBe(genera.length);
  });

  test.each(CARE_GROUPS.map((g) => [g.id, g] as const))('%s is complete and sensible', (_, g) => {
    expect(g.name.length).toBeGreaterThan(2);
    expect(PHOSPHOR[g.icon]).toBeDefined();
    const [min, best, max] = [g.light.min, g.light.best, g.light.max].map((t) => TIERS.indexOf(t));
    expect(min).toBeGreaterThanOrEqual(0);
    expect(min).toBeLessThanOrEqual(best);
    expect(best).toBeLessThanOrEqual(max);
    expect(g.water.days).toBeGreaterThanOrEqual(1);
    expect(g.water.days).toBeLessThanOrEqual(60);
    expect(g.water.winterFactor).toBeGreaterThanOrEqual(1);
    expect(g.water.winterFactor).toBeLessThanOrEqual(4);
    if (g.fertilize) expect(g.fertilize.days).toBeGreaterThanOrEqual(7);
    expect(g.summary.length).toBeGreaterThan(20);
    expect(g.tips.length).toBeGreaterThanOrEqual(1);
  });
});

describe('species', () => {
  test('nearly every GrowSpot species has a care group', () => {
    expect(ALL_SPECIES.length).toBeGreaterThan(GROWSPOT_SPECIES.length * 0.97);
  });

  test('ids are unique', () => {
    const ids = ALL_SPECIES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('override and extra-name keys are real species, and group overrides are real groups', () => {
    const groupIds = new Set(CARE_GROUPS.map((g) => g.id));
    for (const name of Object.keys(SPECIES_OVERRIDES)) expect(scientificNames).toContain(name);
    for (const name of Object.keys(EXTRA_NAMES)) expect(scientificNames).toContain(name);
    for (const [name, group] of Object.entries(GROUP_OVERRIDES_BY_SPECIES)) {
      expect(scientificNames).toContain(name);
      expect(groupIds).toContain(group);
    }
    expect(POPULAR_SPECIES_IDS.size).toBe(Object.keys(EXTRA_NAMES).length);
  });

  test('genusOf handles hybrids and cultivars', () => {
    expect(genusOf("Epipremnum aureum 'Marble Queen'")).toBe('Epipremnum');
    expect(genusOf('x Fatshedera lizei')).toBe('Fatshedera');
    expect(genusOf('× Graptoveria')).toBe('Graptoveria');
  });

  test('snake plants are cared for as snake plants, not dragon trees', () => {
    const snake = getSpecies(speciesId('Dracaena trifasciata'));
    expect(snake?.groupId).toBe('snake-plants');
    expect(careFor(snake!.groupId, snake!.id).water.style).toBe('dry_out');
  });

  test('a species light tier becomes its best light, inside its range', () => {
    for (const species of ALL_SPECIES.slice(0, 400)) {
      const care = careFor(species.groupId, species.id);
      const [min, best, max] = [care.light.min, care.light.best, care.light.max].map((t) =>
        TIERS.indexOf(t),
      );
      expect(min).toBeLessThanOrEqual(best);
      expect(best).toBeLessThanOrEqual(max);
    }
  });

  test('well-known pet safety facts', () => {
    const pets = (name: string) => {
      const s = getSpecies(speciesId(name))!;
      return careFor(s.groupId, s.id).pets;
    };
    expect(pets('Cycas revoluta')).toEqual({ cats: 'toxic', dogs: 'toxic' });
    expect(pets('Epipremnum aureum')).toEqual({ cats: 'toxic', dogs: 'toxic' });
    expect(pets('Chlorophytum comosum')).toEqual({ cats: 'non_toxic', dogs: 'non_toxic' });
    expect(pets('Maranta leuconeura')).toEqual({ cats: 'non_toxic', dogs: 'non_toxic' });
  });

  test('every group is reachable from the group list', () => {
    expect(ALL_GROUPS.length).toBe(CARE_GROUPS.length);
  });
});

describe('search', () => {
  test('finds plants by everyday, common and scientific names', () => {
    expect(searchSpecies('pothos')[0].scientific).toBe('Epipremnum aureum');
    expect(searchSpecies('zz plant')[0].scientific).toBe('Zamioculcas zamiifolia');
    expect(searchSpecies('monstera deliciosa')[0].scientific).toBe('Monstera deliciosa');
    expect(searchSpecies('peace lily')[0].scientific).toBe('Spathiphyllum wallisii');
  });

  test('tolerates typos', () => {
    expect(searchSpecies('monstra').map((s) => s.scientific)).toContain('Monstera deliciosa');
    expect(searchSpecies('calathia').length).toBeGreaterThan(0);
  });

  test('finds cultivars', () => {
    expect(searchSpecies('marble queen').map((s) => s.scientific)).toContain(
      "Epipremnum aureum 'Marble Queen'",
    );
  });
});
