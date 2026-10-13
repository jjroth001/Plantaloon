import { normalize, search, type Searchable } from '@/lib/search';

import { ALL_SPECIES, getGroup, POPULAR_SPECIES_IDS } from './index';
import type { Species } from './types';

type Item = Searchable & { species: Species };

let index: Item[] | null = null;

/** Built on first use: normalizing 2,000+ names takes a moment, so not at app start. */
function getIndex(): Item[] {
  index ??= ALL_SPECIES.map((species) => ({
    id: species.id,
    names: [...species.common, species.scientific].map(normalize),
    popular: POPULAR_SPECIES_IDS.has(species.id),
    cultivar: species.scientific.includes("'"),
    species,
  }));
  return index;
}

export function searchSpecies(query: string, limit = 60): Species[] {
  return search(getIndex(), query, limit).map((item) => item.species);
}

export function popularSpecies(): Species[] {
  return getIndex()
    .filter((item) => item.popular)
    .map((item) => item.species)
    .sort((a, b) => a.common[0].localeCompare(b.common[0]));
}

export function groupName(species: Species): string {
  return getGroup(species.groupId).name;
}
