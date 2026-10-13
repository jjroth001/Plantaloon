/**
 * The plant care sheet: quick facts, then Care, About, Growing and Problems sections. Shared
 * by a plant's own page and the catalog page shown before adding a plant.
 */
import { router } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import type { Care } from '@/catalog';
import { getGuide } from '@/catalog/media';
import type { CareDetails, GuideId, Habit, LightTier } from '@/catalog/types';
import { Icon, type IconName } from '@/components/icons/icon';
import { ThemedText } from '@/components/themed-text';
import { Card, IconBadge } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { DIFFICULTY_TEXT, formatTemp, HUMIDITY_TEXT, petText } from '@/lib/care-text';
import { describeMonths, MONTH_INITIALS, outdoorMonths } from '@/lib/climate';
import { tapFeedback } from '@/lib/haptics';
import { LIGHT_LABEL, LIGHT_TIERS, type LightFit } from '@/lib/light';
import { useTheme } from '@/theme/theme-provider';

// --- Section tabs that follow the scroll ----------------------------------------------------

export type SectionName = 'care' | 'about' | 'growing' | 'problems' | 'journal';

const SECTION_LABEL: Record<SectionName, string> = {
  care: 'Care',
  about: 'About',
  growing: 'Growing',
  problems: 'Problems',
  journal: 'Journal',
};

/**
 * Tracks where each section sits in the page so the tabs can jump to it, and highlights the
 * section currently at the top while scrolling.
 */
export function useSections(sections: readonly SectionName[]) {
  const scrollRef = useRef<ScrollView>(null);
  const positions = useRef(new Map<SectionName, number>());
  const [active, setActive] = useState<SectionName>(sections[0]);
  const tabsHeight = 64;

  const register = (name: SectionName) => (e: LayoutChangeEvent) => {
    positions.current.set(name, e.nativeEvent.layout.y);
  };

  const scrollTo = (name: SectionName) => {
    const y = positions.current.get(name);
    if (y == null) return;
    tapFeedback();
    setActive(name);
    scrollRef.current?.scrollTo({ y: Math.max(0, y - tabsHeight), animated: true });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y + tabsHeight + 8;
    let current = sections[0];
    for (const name of sections) {
      const top = positions.current.get(name);
      if (top != null && top <= y) current = name;
    }
    if (current !== active) setActive(current);
  };

  return { scrollRef, register, scrollTo, onScroll, active };
}

export function SectionTabs({
  sections,
  active,
  onPress,
}: {
  sections: readonly SectionName[];
  active: SectionName;
  onPress: (name: SectionName) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.tabsWrap, { backgroundColor: theme.background }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}>
        {sections.map((name) => {
          const selected = name === active;
          return (
            <Pressable
              key={name}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => onPress(name)}
              style={[styles.tab, { backgroundColor: selected ? theme.tint : theme.element }]}>
              <ThemedText type="label" style={{ color: selected ? theme.onTint : theme.text }}>
                {SECTION_LABEL[name]}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** A section heading plus its cards; reports its position for the tabs. */
export function Section({
  title,
  onLayout,
  children,
}: {
  title?: string;
  onLayout: (e: LayoutChangeEvent) => void;
  children: ReactNode;
}) {
  return (
    <View onLayout={onLayout} style={styles.section}>
      {title ? (
        <ThemedText type="heading" accessibilityRole="header">
          {title}
        </ThemedText>
      ) : null}
      {children}
    </View>
  );
}

// --- Building blocks --------------------------------------------------------------------------

function Row({
  icon,
  color,
  background,
  title,
  subtitle,
  onPress,
}: {
  icon: IconName;
  color: string;
  background: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const body = (
    <>
      <IconBadge icon={icon} color={color} background={background} size={40} />
      <View style={styles.flex}>
        <ThemedText type="subheading">{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="caption" color="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {onPress && <Icon name="caret-right" size={18} color={theme.textSecondary} duotone={false} />}
    </>
  );
  if (!onPress) return <View style={styles.row}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {body}
    </Pressable>
  );
}

function CardTitle({ children }: { children: string }) {
  return <ThemedText type="subheading">{children}</ThemedText>;
}

function Chips({
  label,
  items,
  color,
  background,
  onPress,
}: {
  label: string;
  items: { key: string; label: string }[];
  color: string;
  background: string;
  onPress?: (key: string) => void;
}) {
  return (
    <View style={styles.chipsBlock}>
      <ThemedText type="overline" color="textSecondary">
        {label.toUpperCase()}
      </ThemedText>
      <View style={styles.chips}>
        {items.map((item) => (
          <Pressable
            key={item.key}
            disabled={!onPress}
            accessibilityRole={onPress ? 'button' : 'text'}
            onPress={() => onPress?.(item.key)}
            style={({ pressed }) => [
              styles.chip,
              { backgroundColor: background },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="label" style={{ color }}>
              {item.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function GuideLink({ id, label }: { id: GuideId; label: string }) {
  const theme = useTheme();
  if (!getGuide(id)) return null;
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push({ pathname: '/guide/[id]', params: { id } })}
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
      <ThemedText type="overline" style={{ color: theme.tint }}>
        {label.toUpperCase()}
      </ThemedText>
      <Icon name="caret-right" size={14} color={theme.tint} duotone={false} />
    </Pressable>
  );
}

function Note({ text, tone }: { text: string; tone: 'good' | 'warn' | 'plain' }) {
  const theme = useTheme();
  const background =
    tone === 'good' ? theme.tintSoft : tone === 'warn' ? theme.dangerSoft : theme.element;
  const color = tone === 'good' ? theme.tint : tone === 'warn' ? theme.danger : theme.textSecondary;
  return (
    <View style={[styles.note, { backgroundColor: background }]}>
      <ThemedText type="caption" style={{ color }}>
        {text}
      </ThemedText>
    </View>
  );
}

const openGuide = (id: string) => router.push({ pathname: '/guide/[id]', params: { id } });

// --- Quick facts ------------------------------------------------------------------------------

const SUN = { light: '#9A6410', dark: '#EDC56B' };

function wateringWord(days: number): string {
  if (days <= 1) return 'Daily';
  if (days >= 6 && days <= 8) return 'Weekly';
  if (days >= 13 && days <= 15) return 'Fortnightly';
  return `Every ${days} days`;
}

export function QuickFacts({ care, waterDays }: { care: Care; waterDays: number }) {
  const theme = useTheme();
  const sun = theme.dark ? SUN.dark : SUN.light;
  const toxic = care.pets.cats === 'toxic' || care.pets.dogs === 'toxic';
  const safe = care.pets.cats === 'non_toxic' && care.pets.dogs === 'non_toxic';
  const tiles: { icon: IconName; label: string; color: string; background: string }[] = [
    {
      icon: 'leaf',
      label: { easy: 'Easy', medium: 'Moderate', hard: 'Fussy' }[care.difficulty],
      color: theme.tint,
      background: theme.tintSoft,
    },
    {
      icon: 'sun',
      label: {
        low: 'Low light',
        medium: 'Medium light',
        high: 'Bright light',
        very_high: 'Full sun',
      }[care.light.best],
      color: sun,
      background: theme.dark ? 'rgba(237,197,107,0.14)' : 'rgba(226,181,76,0.18)',
    },
    {
      icon: 'drop',
      label: wateringWord(waterDays),
      color: theme.water,
      background: theme.waterSoft,
    },
    {
      icon: 'paw-print',
      label: toxic ? 'Toxic to pets' : safe ? 'Pet safe' : 'Pets: unsure',
      color: toxic ? theme.danger : safe ? theme.tint : theme.textSecondary,
      background: toxic ? theme.dangerSoft : safe ? theme.tintSoft : theme.element,
    },
  ];
  return (
    <View style={styles.tiles}>
      {tiles.map((tile) => (
        <View key={tile.icon} style={[styles.tile, { backgroundColor: tile.background }]}>
          <Icon name={tile.icon} size={26} color={tile.color} />
          <ThemedText
            type="caption"
            style={[styles.tileLabel, { color: tile.color }]}
            numberOfLines={2}>
            {tile.label}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

// --- Care -------------------------------------------------------------------------------------

const WATER_TITLE: Record<Care['water']['style'], string> = {
  dry_out: 'When the soil is dry all through',
  top_dry: 'When the top 2–3 cm is dry',
  moist: 'Keep the soil lightly moist',
  soak: 'Soak or mist, no soil needed',
};

function LightRange({ light }: { light: Care['light'] }) {
  const theme = useTheme();
  const sun = theme.dark ? SUN.dark : SUN.light;
  const min = LIGHT_TIERS.indexOf(light.min);
  const max = LIGHT_TIERS.indexOf(light.max);
  const short: Record<LightTier, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'Bright',
    very_high: 'Sun',
  };
  return (
    <View style={styles.range}>
      {LIGHT_TIERS.map((tier, i) => {
        const best = tier === light.best;
        const ok = i >= min && i <= max;
        return (
          <View key={tier} style={styles.rangeCell}>
            <View
              style={[
                styles.rangeBar,
                {
                  backgroundColor: best
                    ? sun
                    : ok
                      ? theme.dark
                        ? 'rgba(237,197,107,0.4)'
                        : 'rgba(226,181,76,0.45)'
                      : theme.element,
                },
              ]}
            />
            <ThemedText
              type="caption"
              color={best ? 'text' : 'textSecondary'}
              style={best && styles.bold}>
              {short[tier]}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

export type CareContext = {
  /** Watering interval in use (the plant's schedule, or the profile's). */
  waterDays: number;
  /** Same, adjusted for winter. */
  winterWaterDays: number;
  /** e.g. "next: tomorrow" for a plant you own. */
  nextWater?: string;
  feedDays?: number;
  nextFeed?: string;
  /** How the plant's room light suits it. */
  roomFit?: { room: string; fit: LightFit };
};

export function CareSection({
  care,
  details,
  context,
}: {
  care: Care;
  details: CareDetails | undefined;
  context: CareContext;
}) {
  const theme = useTheme();
  const sun = theme.dark ? SUN.dark : SUN.light;
  const sunSoft = theme.dark ? 'rgba(237,197,107,0.14)' : 'rgba(226,181,76,0.18)';
  const { waterDays, winterWaterDays, nextWater, roomFit } = context;
  const feedDays = context.feedDays ?? care.fertilize?.days;

  const winterNote =
    winterWaterDays > waterDays ? `Every ${winterWaterDays} days in winter` : 'Same all year';
  const lightRange =
    care.light.min === care.light.max
      ? 'Needs this light'
      : `Copes with ${LIGHT_LABEL[care.light.min].toLowerCase()} to ${LIGHT_LABEL[care.light.max].toLowerCase()}`;
  const fitText =
    roomFit &&
    {
      too_dark: `${roomFit.room} is probably too dark. Try a brighter spot.`,
      too_bright: `${roomFit.room} may be too sunny. Filter the light or move it back.`,
      ideal: `${roomFit.room} has just the right light.`,
      ok: `${roomFit.room}’s light is fine.`,
    }[roomFit.fit];
  const repot = details?.soil.repotYears;
  const repotTitle = !repot
    ? null
    : repot[1] === 0
      ? 'No repotting needed'
      : repot[0] === 0
        ? 'Rarely needs a new pot'
        : repot[0] === repot[1]
          ? `Every ${repot[0]} ${repot[0] === 1 ? 'year' : 'years'}, in spring`
          : `Every ${repot[0]}–${repot[1]} years, in spring`;

  return (
    <>
      <Card>
        <CardTitle>Water</CardTitle>
        <Row
          icon="drop"
          color={theme.water}
          background={theme.waterSoft}
          title={`Every ${waterDays} ${waterDays === 1 ? 'day' : 'days'}`}
          subtitle={[winterNote, nextWater].filter(Boolean).join(' · ')}
        />
        <Row
          icon="hand-pointing"
          color={theme.water}
          background={theme.waterSoft}
          title={WATER_TITLE[care.water.style]}
          subtitle={details?.waterTip}
        />
        <GuideLink id="watering" label="How to water" />
      </Card>

      <Card>
        <CardTitle>Light</CardTitle>
        <Row
          icon="sun"
          color={sun}
          background={sunSoft}
          title={`${LIGHT_LABEL[care.light.best]} is best`}
          subtitle={lightRange}
        />
        <LightRange light={care.light} />
        {fitText && (
          <Note
            text={fitText}
            tone={roomFit!.fit === 'too_dark' || roomFit!.fit === 'too_bright' ? 'warn' : 'good'}
          />
        )}
        <GuideLink id="light" label="Reading the light" />
      </Card>

      <Card>
        <CardTitle>Food</CardTitle>
        <Row
          icon="flask"
          color={theme.fertilize}
          background={theme.fertilizeSoft}
          title={
            care.fertilize && feedDays
              ? `Every ${feedDays} days, spring to autumn`
              : 'Rarely needs feeding'
          }
          subtitle={
            care.fertilize
              ? [
                  care.fertilize.winter ? 'Lightly in winter too' : 'Rests over winter',
                  context.nextFeed,
                ]
                  .filter(Boolean)
                  .join(' · ')
              : undefined
          }
        />
        {details && details.food.length > 0 && (
          <Chips
            label="What to use"
            items={details.food.map((f) => ({ key: f, label: f }))}
            color={theme.fertilize}
            background={theme.fertilizeSoft}
          />
        )}
        <GuideLink id="feeding" label="About feeding" />
      </Card>

      {details && (
        <Card>
          <CardTitle>Soil & repotting</CardTitle>
          <Row
            icon="shovel"
            color={theme.tint}
            background={theme.tintSoft}
            title={repotTitle ?? 'Repotting'}
            subtitle={details.soil.repotNote}
          />
          <Chips
            label="Mix"
            items={details.soil.mix.map((m) => ({ key: m, label: m }))}
            color={theme.tint}
            background={theme.tintSoft}
          />
          {repot && repot[1] > 0 && <GuideLink id="repotting" label="Repotting step by step" />}
        </Card>
      )}

      <Card>
        <CardTitle>Humidity & cleaning</CardTitle>
        <Row
          icon="drop-half"
          color={theme.water}
          background={theme.waterSoft}
          title={HUMIDITY_TEXT[care.humidity]}
          subtitle={details?.humidityTip}
        />
        {details?.cleaning && (
          <Row
            icon="sparkle"
            color={theme.tint}
            background={theme.tintSoft}
            title="Keep the leaves clean"
            subtitle={details.cleaning}
          />
        )}
        <GuideLink id="humidity" label="Raising humidity" />
      </Card>

      <Card>
        <CardTitle>Good to know</CardTitle>
        <ThemedText type="body">{care.summary}</ThemedText>
        {care.note ? (
          <ThemedText type="body" color="textSecondary">
            {care.note}
          </ThemedText>
        ) : null}
        {care.tips.map((tip) => (
          <View key={tip} style={styles.tip}>
            <View style={[styles.bullet, { backgroundColor: theme.tint }]} />
            <ThemedText type="body" style={styles.flex}>
              {tip}
            </ThemedText>
          </View>
        ))}
      </Card>
    </>
  );
}

// --- About ------------------------------------------------------------------------------------

const HABIT: Record<Habit, { label: string; icon: IconName }> = {
  trailing: { label: 'Trailing', icon: 'plant' },
  climbing: { label: 'Climbing', icon: 'plant' },
  upright: { label: 'Upright', icon: 'arrow-fat-up' },
  bushy: { label: 'Bushy', icon: 'potted-plant' },
  rosette: { label: 'Rosette', icon: 'flower-lotus' },
  clumping: { label: 'Clump-forming', icon: 'potted-plant' },
  tree: { label: 'Tree-like', icon: 'tree' },
  columnar: { label: 'Columnar', icon: 'cactus' },
  spreading: { label: 'Spreading', icon: 'arrows-out' },
};

const LIFECYCLE: Record<CareDetails['lifecycle'], { title: string; subtitle: string }> = {
  perennial: { title: 'Lives for many years', subtitle: 'A perennial: with care it keeps going' },
  annual: {
    title: 'Lasts about a season',
    subtitle: 'Grown fresh each year from seed or a new plant',
  },
  bulb: { title: 'Rests part of the year', subtitle: 'Dies back to a bulb or tuber, then regrows' },
  monocarpic: {
    title: 'Flowers once per rosette',
    subtitle: 'The flowering rosette fades but leaves pups behind',
  },
};

export function AboutSection({ care, details }: { care: Care; details: CareDetails | undefined }) {
  const theme = useTheme();
  const toxic = care.pets.cats === 'toxic' || care.pets.dogs === 'toxic';
  return (
    <>
      <Card>
        <CardTitle>Safety</CardTitle>
        <Row
          icon="paw-print"
          color={toxic ? theme.danger : theme.tint}
          background={toxic ? theme.dangerSoft : theme.tintSoft}
          title={petText(care.pets)}
          subtitle={toxic ? 'Keep it where pets can’t chew it' : undefined}
        />
        {toxic && (
          <Row
            icon="warning"
            color={theme.danger}
            background={theme.dangerSoft}
            title="Not for eating"
            subtitle="Keep out of reach of small children too"
          />
        )}
        <Note
          tone="plain"
          text="Pet safety follows the ASPCA’s plant lists. If a pet or person may have eaten a plant, call a vet, doctor or poison control."
        />
      </Card>
      {details && (
        <Card>
          <CardTitle>The plant</CardTitle>
          <Row
            icon={HABIT[details.habit].icon}
            color={theme.tint}
            background={theme.tintSoft}
            title={HABIT[details.habit].label}
            subtitle={details.habitNote}
          />
          <Row
            icon="leaf"
            color={theme.tint}
            background={theme.tintSoft}
            title="Leaves"
            subtitle={details.leaves}
          />
          <Row
            icon="arrows-clockwise"
            color={theme.tint}
            background={theme.tintSoft}
            title={LIFECYCLE[details.lifecycle].title}
            subtitle={LIFECYCLE[details.lifecycle].subtitle}
          />
          <Row
            icon="eye"
            color={theme.tint}
            background={theme.tintSoft}
            title={DIFFICULTY_TEXT[care.difficulty]}
            subtitle={`Cared for like other ${care.name.toLowerCase()}`}
          />
        </Card>
      )}
    </>
  );
}

// --- Growing ----------------------------------------------------------------------------------

function TempRange({
  min,
  ideal,
  unit,
}: {
  min: number;
  ideal: [number, number];
  unit: 'C' | 'F';
}) {
  const theme = useTheme();
  const lo = 0;
  const hi = 35;
  const pos = (c: number) =>
    `${Math.min(100, Math.max(0, ((c - lo) / (hi - lo)) * 100))}%` as const;
  return (
    <View style={styles.tempWrap}>
      <View style={[styles.tempTrack, { backgroundColor: theme.element }]}>
        <View
          style={[styles.tempBand, { left: pos(min), right: 0, backgroundColor: theme.tintSoft }]}
        />
        <View
          style={[
            styles.tempBand,
            {
              left: pos(ideal[0]),
              width: `${((ideal[1] - ideal[0]) / (hi - lo)) * 100}%`,
              backgroundColor: theme.tint,
            },
          ]}
        />
      </View>
      <View style={styles.tempLabels}>
        <ThemedText type="caption" color="textSecondary">
          Above {formatTemp(min, unit)}
        </ThemedText>
        <ThemedText type="caption" style={[styles.bold, { color: theme.tint }]}>
          Ideal {formatTemp(ideal[0], unit)}–{formatTemp(ideal[1], unit)}
        </ThemedText>
      </View>
    </View>
  );
}

function MonthStrip({ flags }: { flags: boolean[] }) {
  const theme = useTheme();
  return (
    <View style={styles.months}>
      {flags.map((on, i) => (
        <View key={i} style={styles.month}>
          <View style={[styles.monthBar, { backgroundColor: on ? theme.tint : theme.element }]} />
          <ThemedText type="caption" color={on ? 'text' : 'textSecondary'}>
            {MONTH_INITIALS[i]}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const PROPAGATION_TITLE: Record<CareDetails['propagation'][number], string> = {
  'stem-cuttings-water': 'Stem cuttings in water',
  'stem-cuttings-soil': 'Stem cuttings in soil',
  'leaf-cuttings': 'Leaf cuttings',
  division: 'Dividing the plant',
  offsets: 'Offsets (pups)',
  plantlets: 'Baby plantlets',
  'air-layering': 'Air layering',
  seed: 'From seed',
};

export function GrowingSection({
  care,
  details,
  unit,
  lows,
}: {
  care: Care;
  details: CareDetails | undefined;
  unit: 'C' | 'F';
  /** Monthly average night lows where the user lives, if they've shared a rough location. */
  lows: number[] | null;
}) {
  const theme = useTheme();
  const ideal = details?.idealTempC ?? [care.minTempC + 5, care.minTempC + 12];
  const flags = lows ? outdoorMonths(lows, care.minTempC) : null;
  return (
    <>
      <Card>
        <CardTitle>Warmth</CardTitle>
        <TempRange min={care.minTempC} ideal={ideal as [number, number]} unit={unit} />
        {flags ? (
          <>
            <Row
              icon="sun-horizon"
              color={theme.tint}
              background={theme.tintSoft}
              title={`Outside near you: ${describeMonths(flags)}`}
              subtitle={`Months when nights stay above ${formatTemp(care.minTempC, unit)}`}
            />
            <MonthStrip flags={flags} />
          </>
        ) : (
          <Row
            icon="sun-horizon"
            color={theme.tint}
            background={theme.tintSoft}
            title="Outside in summer only"
            subtitle={`Bring it in before nights drop below ${formatTemp(care.minTempC, unit)}`}
            onPress={() => router.push('/settings')}
          />
        )}
        {!flags && (
          <ThemedText type="caption" color="textSecondary">
            Share your rough area in Settings to see the months for where you live.
          </ThemedText>
        )}
        <GuideLink id="outdoors" label="Summering plants outside" />
      </Card>
      {details && details.propagation.length > 0 && (
        <Card>
          <CardTitle>More plants for free</CardTitle>
          {details.propagation.map((method, i) => (
            <Row
              key={method}
              icon={getGuide(method)?.icon ?? 'scissors'}
              color={theme.tint}
              background={theme.tintSoft}
              title={PROPAGATION_TITLE[method]}
              subtitle={i === 0 ? 'Easiest way' : undefined}
              onPress={getGuide(method) ? () => openGuide(method) : undefined}
            />
          ))}
        </Card>
      )}
    </>
  );
}

// --- Problems ---------------------------------------------------------------------------------

export function ProblemsSection({ details }: { details: CareDetails | undefined }) {
  const theme = useTheme();
  if (!details) return null;
  const label = (id: string) => getGuide(id)?.title ?? id;
  return (
    <Card>
      <CardTitle>If something looks wrong</CardTitle>
      <Chips
        label="Signs"
        items={details.signs.map((id) => ({ key: id, label: label(id) }))}
        color={theme.danger}
        background={theme.dangerSoft}
        onPress={openGuide}
      />
      <Chips
        label="Pests"
        items={details.pests.map((id) => ({ key: id, label: label(id) }))}
        color={theme.danger}
        background={theme.dangerSoft}
        onPress={openGuide}
      />
      <ThemedText type="caption" color="textSecondary">
        Tap one for likely causes and gentle fixes.
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: 700 },
  pressed: { opacity: 0.7 },
  tabsWrap: { marginHorizontal: -(Spacing.three + Spacing.one), paddingVertical: Spacing.two },
  tabs: { gap: Spacing.two, paddingHorizontal: Spacing.three + Spacing.one },
  tab: { minHeight: 40, paddingHorizontal: 18, borderRadius: 20, justifyContent: 'center' },
  section: { gap: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  chipsBlock: { gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { minHeight: 32, paddingHorizontal: 14, borderRadius: 16, justifyContent: 'center' },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.one,
  },
  note: { borderRadius: Radius.small, padding: Spacing.two + 2 },
  tiles: { flexDirection: 'row', gap: Spacing.two },
  tile: {
    flex: 1,
    minHeight: 84,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  tileLabel: { fontWeight: 700, textAlign: 'center' },
  range: { flexDirection: 'row', gap: 4 },
  rangeCell: { flex: 1, alignItems: 'center', gap: 6 },
  rangeBar: { height: 12, borderRadius: 6, alignSelf: 'stretch' },
  tip: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 9, marginLeft: 8 },
  tempWrap: { gap: Spacing.two },
  tempTrack: { height: 12, borderRadius: 6, overflow: 'hidden' },
  tempBand: { position: 'absolute', top: 0, bottom: 0, borderRadius: 6 },
  tempLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  months: { flexDirection: 'row', gap: 3 },
  month: { flex: 1, alignItems: 'center', gap: 4 },
  monthBar: { height: 10, borderRadius: 5, alignSelf: 'stretch' },
});
