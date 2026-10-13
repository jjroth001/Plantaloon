import { SPECIES_DESCRIPTIONS } from './descriptions';
import { GROUP_DETAILS } from './details';
import { GUIDES } from './guides';
import { getSpecies, speciesId } from './index';
import { CATALOG_PHOTOS } from './photos';
import type { CareDetails, Guide, GuideId } from './types';

export type CatalogPhoto = {
  /** Bundled image (a `require` result). */
  image: number;
  author: string;
  licence: string;
  /** The photo's page on Wikimedia Commons. */
  page: string;
  /** True when a cultivar shows its parent species' photo. */
  ofSpecies: boolean;
};

/** "Epipremnum aureum 'Jade'" → "Epipremnum aureum" (the species a cultivar belongs to). */
export function baseSpecies(scientific: string): string {
  const parts = scientific.replace(/^[x×]\s+/i, '').split(/\s+/);
  return parts.length >= 2 && /^[a-z-]+$/.test(parts[1]) ? `${parts[0]} ${parts[1]}` : scientific;
}

/** A photo of the plant from Wikimedia Commons, if one was bundled. */
export function catalogPhoto(id: string | null | undefined): CatalogPhoto | null {
  const species = getSpecies(id);
  if (!species) return null;
  const base = speciesId(baseSpecies(species.scientific));
  const entry = CATALOG_PHOTOS[base];
  if (!entry) return null;
  const [image, author, licence, page] = entry;
  return { image, author, licence, page, ofSpecies: base !== species.id };
}

export function detailsFor(groupId: string): CareDetails | undefined {
  return GROUP_DETAILS[groupId];
}

const guides = new Map(GUIDES.map((g) => [g.id, g]));

export function getGuide(id: string): Guide | undefined {
  return guides.get(id as GuideId);
}

/** A species' own description, falling back to its parent species for cultivars. */
export function descriptionFor(id: string | null | undefined): string | undefined {
  const species = getSpecies(id);
  if (!species) return undefined;
  return (
    SPECIES_DESCRIPTIONS[species.scientific] ??
    SPECIES_DESCRIPTIONS[baseSpecies(species.scientific)]
  );
}
