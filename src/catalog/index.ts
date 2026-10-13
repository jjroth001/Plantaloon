import { ASPCA } from './aspca';
import { EXTRA_NAMES } from './extra-names';
import { CARE_GROUPS } from './groups';
import { GROWSPOT_SPECIES } from './growspot-species';
import { GROUP_OVERRIDES_BY_SPECIES, SPECIES_OVERRIDES } from './overrides';
import type { CareGroup, LightTier, Species, SpeciesOverride, Toxicity } from './types';

export type { CareGroup, LightTier, Species } from './types';

/**
 * Used when a plant points at a care group that no longer exists (it never should), so the
 * app still shows sensible care instead of crashing.
 */
const FALLBACK_GROUP: CareGroup = {
  id: 'general-foliage',
  name: 'Leafy houseplants',
  icon: 'potted-plant',
  genera: [],
  light: { min: 'medium', best: 'high', max: 'high' },
  water: { style: 'top_dry', days: 7, winterFactor: 1.5 },
  fertilize: { days: 30, winter: false },
  humidity: 'average',
  minTempC: 12,
  pets: { cats: 'unknown', dogs: 'unknown' },
  difficulty: 'medium',
  summary:
    'General care for a leafy houseplant: bright, indirect light and water when the top of the soil is dry.',
  tips: [
    'Check the soil with a finger before watering.',
    'Turn the pot now and then for even growth.',
  ],
};

const groupById = new Map(CARE_GROUPS.map((g) => [g.id, g]));
const groupByGenus = new Map<string, CareGroup>();
for (const group of CARE_GROUPS) {
  for (const genus of group.genera) groupByGenus.set(genus, group);
}

export const ALL_GROUPS: readonly CareGroup[] = [...CARE_GROUPS].sort((a, b) =>
  a.name.localeCompare(b.name),
);

export function getGroup(id: string): CareGroup {
  return groupById.get(id) ?? FALLBACK_GROUP;
}

/** "× Graptoveria 'Opalina'" → "Graptoveria". */
export function genusOf(scientific: string): string {
  return scientific.replace(/^[x×]\s+/i, '').split(/\s+/)[0];
}

export function speciesId(scientific: string): string {
  return scientific
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildSpecies(): Species[] {
  const list: Species[] = [];
  const seen = new Set<string>();
  for (const [scientific, common, tier] of GROWSPOT_SPECIES) {
    // The same plant can appear twice under different spellings ('Maharani' vs maharani).
    const id = speciesId(scientific);
    if (seen.has(id)) continue;
    seen.add(id);
    const groupId = GROUP_OVERRIDES_BY_SPECIES[scientific];
    const group = groupId ? groupById.get(groupId) : groupByGenus.get(genusOf(scientific));
    // Species outside every care group are left out rather than given made-up care.
    if (!group) continue;
    const names = common
      .split(' / ')
      .map((n) => n.trim())
      .filter(Boolean);
    list.push({
      id,
      scientific,
      common: [...names, ...(EXTRA_NAMES[scientific] ?? [])],
      groupId: group.id,
      lightTier: tier,
      override: SPECIES_OVERRIDES[scientific],
    });
  }
  return list;
}

export const ALL_SPECIES: readonly Species[] = buildSpecies();

const speciesById = new Map(ALL_SPECIES.map((s) => [s.id, s]));

export function getSpecies(id: string | null | undefined): Species | undefined {
  return id ? speciesById.get(id) : undefined;
}

/** Popular plants: those with extra everyday names. Shown first in search. */
export const POPULAR_SPECIES_IDS: ReadonlySet<string> = new Set(
  Object.keys(EXTRA_NAMES).map(speciesId),
);

const TIERS: LightTier[] = ['low', 'medium', 'high', 'very_high'];

/** A plant's care: its group's profile with the species' differences applied. */
/**
 * Where a plant's pet safety comes from: ASPCA's lists for both cats and dogs, for one of
 * them, or (not listed) inferred from related plants in its care group.
 */
export type PetsSource = 'aspca' | 'partial' | 'related';

export type Care = Omit<CareGroup, 'genera'> & { note?: string; petsSource: PetsSource };

const ASPCA_CODE: Record<string, Toxicity | null> = { t: 'toxic', n: 'non_toxic', '-': null };

/** Pet safety: ASPCA's answer wherever it lists the plant, otherwise the inferred one. */
export function petsFor(
  scientific: string | undefined,
  inferred: CareGroup['pets'],
): { pets: CareGroup['pets']; source: PetsSource } {
  const code = scientific ? ASPCA[scientific] : undefined;
  if (!code) return { pets: inferred, source: 'related' };
  const cats = ASPCA_CODE[code[0]];
  const dogs = ASPCA_CODE[code[1]];
  return {
    pets: { cats: cats ?? inferred.cats, dogs: dogs ?? inferred.dogs },
    source: cats && dogs ? 'aspca' : 'partial',
  };
}

export function careFor(groupId: string, speciesIdValue?: string | null): Care {
  const group = getGroup(groupId);
  const species = getSpecies(speciesIdValue);
  const o: SpeciesOverride = species?.override ?? {};
  let light = { ...group.light, ...o.light };
  // The species' own light tier (from GrowSpot) is its best light; widen the range to fit.
  if (species?.lightTier && !o.light?.best) {
    const best = species.lightTier;
    const i = TIERS.indexOf(best);
    light = {
      best,
      min: TIERS[Math.min(TIERS.indexOf(light.min), i)],
      max: TIERS[Math.max(TIERS.indexOf(light.max), i)],
    };
  }
  const pets = petsFor(species?.scientific, o.pets ?? group.pets);
  return {
    id: group.id,
    name: group.name,
    icon: group.icon,
    light,
    water: { ...group.water, ...o.water },
    fertilize: group.fertilize,
    humidity: o.humidity ?? group.humidity,
    minTempC: group.minTempC,
    pets: pets.pets,
    petsSource: pets.source,
    difficulty: o.difficulty ?? group.difficulty,
    summary: group.summary,
    tips: group.tips,
    note: o.note,
  };
}

/** The name to show for a plant: its nickname, else the species' main common name. */
export function displayName(plant: {
  nickname: string | null;
  speciesId: string | null;
  groupId: string;
}): string {
  if (plant.nickname?.trim()) return plant.nickname.trim();
  const species = getSpecies(plant.speciesId);
  if (species) return species.common[0] ?? species.scientific;
  return getGroup(plant.groupId).name;
}
