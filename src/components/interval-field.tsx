import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Icon } from '@/components/icons/icon';
import { Sheet } from '@/components/sheet';
import { ThemedText } from '@/components/themed-text';
import { Button, IconButton, RadioList, Segmented } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { tapFeedback } from '@/lib/haptics';
import {
  describeInterval,
  INTERVAL_MAX,
  INTERVAL_PRESETS,
  shortInterval,
  UNIT_DAYS,
  UNIT_LABEL,
  unitFor,
  type IntervalUnit,
} from '@/lib/interval';
import type { TaskKind } from '@/lib/tasks';
import { useTheme } from '@/theme/theme-provider';

const UNITS = Object.keys(UNIT_DAYS) as IntervalUnit[];
const CUSTOM = 'custom';

/**
 * How often a reminder repeats, as one tidy row ("Every 2 weeks ›"). Tapping it opens a sheet
 * with the usual choices for this task, or a custom number of days, weeks, months or years.
 * The value is always in days.
 */
export function IntervalField({
  kind,
  title,
  value,
  onChange,
}: {
  kind: TaskKind;
  /** The sheet's heading, e.g. "Water every…". */
  title: string;
  value: number;
  onChange: (days: number) => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(0);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title.replace('…', '')} ${describeInterval(value).toLowerCase()}. Change`}
        onPress={() => {
          tapFeedback();
          setOpened((n) => n + 1);
          setOpen(true);
        }}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: theme.element },
          pressed && { opacity: 0.7 },
        ]}>
        <ThemedText style={styles.flex}>{describeInterval(value)}</ThemedText>
        <Icon name="caret-right" size={18} color={theme.textSecondary} duotone={false} />
      </Pressable>
      <Sheet open={open} onClose={() => setOpen(false)} title={title}>
        {/* A fresh picker each time it opens, so it starts from the current value. */}
        <Picker
          key={opened}
          kind={kind}
          value={value}
          onDone={(days) => {
            onChange(days);
            setOpen(false);
          }}
        />
      </Sheet>
    </>
  );
}

function Picker({
  kind,
  value,
  onDone,
}: {
  kind: TaskKind;
  value: number;
  onDone: (days: number) => void;
}) {
  const theme = useTheme();
  const max = INTERVAL_MAX[kind];
  const presets = INTERVAL_PRESETS[kind].filter((d) => d <= max);
  const [days, setDays] = useState(value);
  const [custom, setCustom] = useState(!presets.includes(value));
  const [chosenUnit, setUnit] = useState<IntervalUnit>(() => unitFor(value));
  // While typing, the text as typed (it may be empty or half-finished).
  const [draft, setDraft] = useState<string | null>(null);

  const unit = days % UNIT_DAYS[chosenUnit] === 0 ? chosenUnit : 'day';
  const per = UNIT_DAYS[unit];
  const count = days / per;
  const clamp = (d: number) => Math.min(max, Math.max(1, d));
  const step = (delta: number) => {
    // Never below one of the current unit: 1 year less shouldn't jump to 1 day.
    if (count + delta < 1) return;
    const next = clamp((count + delta) * per);
    if (next !== days) {
      tapFeedback();
      setDraft(null);
      setDays(next);
    }
  };

  return (
    <>
      <RadioList
        boxed={false}
        options={[
          ...presets.map((d) => ({ value: String(d), label: shortInterval(d) })),
          { value: CUSTOM, label: 'Custom' },
        ]}
        value={custom ? CUSTOM : String(days)}
        onChange={(v) => {
          if (v === CUSTOM) {
            setCustom(true);
            setUnit(unitFor(days));
          } else {
            setCustom(false);
            setDays(Number(v));
          }
        }}
      />
      {custom && (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}
          style={styles.custom}>
          <View style={[styles.stepper, { backgroundColor: theme.element }]}>
            <IconButton
              icon="caret-left"
              label={`One ${unit} less`}
              onPress={() => step(-1)}
              background={theme.card}
              size={40}
            />
            <View style={styles.middle}>
              <ThemedText type="subheading">Every</ThemedText>
              <TextInput
                value={draft ?? String(count)}
                onChangeText={(text) => {
                  setDraft(text);
                  const n = Number.parseInt(text, 10);
                  if (Number.isFinite(n) && n >= 1) setDays(clamp(n * per));
                }}
                onBlur={() => setDraft(null)}
                keyboardType="number-pad"
                maxLength={4}
                selectTextOnFocus
                accessibilityLabel={`Number of ${UNIT_LABEL[unit].toLowerCase()}`}
                style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
              />
              <ThemedText type="subheading">{count === 1 ? unit : `${unit}s`}</ThemedText>
            </View>
            <IconButton
              icon="caret-right"
              label={`One ${unit} more`}
              onPress={() => step(1)}
              background={theme.card}
              size={40}
            />
          </View>
          <Segmented
            options={UNITS.filter((u) => UNIT_DAYS[u] <= max).map((u) => ({
              value: u,
              label: UNIT_LABEL[u],
            }))}
            value={unit}
            onChange={(u) => {
              // Keep the number, change what it counts: 2 weeks → 2 months.
              setUnit(u);
              setDraft(null);
              setDays(clamp(count * UNIT_DAYS[u]));
            }}
          />
        </Animated.View>
      )}
      <Button title="Done" onPress={() => onDone(days)} />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 48,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
  },
  custom: { gap: Spacing.three },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.medium,
    padding: 6,
  },
  middle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  input: {
    minWidth: 56,
    minHeight: 40,
    borderRadius: 10,
    paddingHorizontal: Spacing.two,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
