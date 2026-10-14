import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Chip, IconButton } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { tapFeedback } from '@/lib/haptics';
import {
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

/**
 * How often a reminder repeats: quick picks for the task, then the number to type or step,
 * in days, weeks, months or years. The value is always in days.
 */
export function IntervalField({
  kind,
  value,
  onChange,
}: {
  kind: TaskKind;
  value: number;
  onChange: (days: number) => void;
}) {
  const theme = useTheme();
  const max = INTERVAL_MAX[kind];
  const [chosenUnit, setUnit] = useState<IntervalUnit>(() => unitFor(value));
  // While typing, the text as typed (it may be empty or half-finished).
  const [draft, setDraft] = useState<string | null>(null);

  // Fall back to days if the value (e.g. a new watering suggestion) doesn't fit the unit.
  const unit = value % UNIT_DAYS[chosenUnit] === 0 ? chosenUnit : 'day';
  const per = UNIT_DAYS[unit];
  const count = value / per;
  const units = UNITS.filter((u) => UNIT_DAYS[u] <= max);
  const clamp = (days: number) => Math.min(max, Math.max(1, days));

  const step = (delta: number) => {
    const next = clamp((count + delta) * per);
    if (next !== value) {
      tapFeedback();
      setDraft(null);
      onChange(next);
    }
  };

  return (
    <View style={styles.gap}>
      <View style={styles.chips}>
        {INTERVAL_PRESETS[kind]
          .filter((days) => days <= max)
          .map((days) => (
            <Chip
              key={days}
              label={shortInterval(days)}
              selected={value === days}
              onPress={() => {
                setUnit(unitFor(days));
                setDraft(null);
                onChange(days);
              }}
            />
          ))}
      </View>
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
              if (Number.isFinite(n) && n >= 1) onChange(clamp(n * per));
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
      <View style={styles.chips}>
        {units.map((u) => (
          <Chip
            key={u}
            label={UNIT_LABEL[u]}
            selected={u === unit}
            onPress={() => {
              // Keep the number, change what it counts: 2 weeks → 2 months.
              setUnit(u);
              setDraft(null);
              onChange(clamp(count * UNIT_DAYS[u]));
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { gap: Spacing.three },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
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
