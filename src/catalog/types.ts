import type { IconName } from '@/components/icons/icon';

/**
 * Light tiers, using GrowSpot's bands (CC BY 4.0, growspotapp.com) for the lux boundaries:
 * low 270–800 lux, medium 800–1,600, high 1,600–10,800, very_high 10,800+ (below 270 is too
 * dark for any houseplant). We show them as Low / Medium / Bright indirect / Direct sun.
 */
export type LightTier = 'low' | 'medium' | 'high' | 'very_high';

/** How to tell it's time to water. */
export type WaterStyle =
  /** Let the soil dry out completely (cacti, succulents, snake plants). */
  | 'dry_out'
  /** Water when the top 2–3 cm (about an inch) of soil is dry (most foliage plants). */
  | 'top_dry'
  /** Keep the soil lightly moist, never soggy (ferns, prayer plants, carnivorous plants). */
  | 'moist'
  /** Soak or mist rather than water soil (air plants, mounted orchids, moss). */
  | 'soak';

export type Toxicity = 'toxic' | 'non_toxic' | 'unknown';

export type Humidity = 'low' | 'average' | 'high';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type CareGroup = {
  /** Stable kebab-case id, stored on plants. Never rename one that has shipped. */
  id: string;
  /** Plural, friendly: "Philodendrons", "Prayer plants", "Desert cacti". */
  name: string;
  /** Icon shown when a plant has no photo. */
  icon: IconName;
  /** Genera whose species get this care (exact botanical genus, capitalised). */
  genera: string[];
  light: {
    /** The dimmest light it tolerates. */
    min: LightTier;
    /** Where it does best. */
    best: LightTier;
    /** The most it tolerates (direct sun = very_high). */
    max: LightTier;
  };
  water: {
    style: WaterStyle;
    /** Typical days between waterings in spring/summer, in a medium pot indoors. */
    days: number;
    /** Multiply `days` by this in winter (1 = no change; 1.5–3 for most). */
    winterFactor: number;
  };
  /** null = rarely needs feeding (e.g. carnivorous plants, air plants fed by misting). */
  fertilize: {
    /** Days between feeds in the growing season. */
    days: number;
    /** Keep feeding through winter (e.g. under steady indoor conditions)? Usually false. */
    winter: boolean;
  } | null;
  humidity: Humidity;
  /** Lowest comfortable temperature, °C. */
  minTempC: number;
  /** Per ASPCA's toxic / non-toxic plant lists, at genus level; 'unknown' if unsure. */
  pets: { cats: Toxicity; dogs: Toxicity };
  difficulty: Difficulty;
  /** One or two sentences, our own words. */
  summary: string;
  /** 2–4 short practical tips, our own words. */
  tips: string[];
};

/** Per-species differences from its group (e.g. a non-toxic member of a toxic genus). */
export type SpeciesOverride = Partial<Pick<CareGroup, 'pets' | 'humidity' | 'difficulty'>> & {
  water?: Partial<CareGroup['water']>;
  light?: Partial<CareGroup['light']>;
  note?: string;
};

export type Species = {
  /** Slug of the scientific name, stable. */
  id: string;
  scientific: string;
  /** First is the main common name. */
  common: string[];
  groupId: string;
  /** From GrowSpot's species light levels, when listed. */
  lightTier?: LightTier;
  override?: SpeciesOverride;
};
