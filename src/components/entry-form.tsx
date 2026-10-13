import { StyleSheet, View } from 'react-native';

import { Chip, Field, TextField } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { ENTRY_ICON, ENTRY_LABEL, LOGGABLE, type EntryType } from '@/db/types';
import { addDays, dateOf, formatRelativeDay, todayString } from '@/lib/dates';

export type EntryFormValue = { type: EntryType; day: string; note: string };

/** Moves a timestamp to another calendar day, keeping its time of day. */
export function onDay(at: number, day: string): number {
  if (dateOf(at) === day) return at;
  const time = new Date(at);
  const [y, m, d] = day.split('-').map(Number);
  return Math.min(Date.now(), new Date(y, m - 1, d, time.getHours(), time.getMinutes()).getTime());
}

export function EntryForm({
  value,
  onChange,
  types = LOGGABLE,
}: {
  value: EntryFormValue;
  onChange: (value: EntryFormValue) => void;
  types?: readonly EntryType[];
}) {
  const today = todayString();
  const days = [0, 1, 2, 3, 5, 7].map((n) => addDays(today, -n));
  if (!days.includes(value.day)) days.push(value.day);

  return (
    <>
      <Field label="What did you do?">
        <View style={styles.chips}>
          {types.map((type) => (
            <Chip
              key={type}
              label={ENTRY_LABEL[type]}
              icon={ENTRY_ICON[type]}
              selected={value.type === type}
              onPress={() => onChange({ ...value, type })}
            />
          ))}
        </View>
      </Field>
      <Field label="When?">
        <View style={styles.chips}>
          {days.map((day) => (
            <Chip
              key={day}
              label={formatRelativeDay(day, today)}
              selected={value.day === day}
              onPress={() => onChange({ ...value, day })}
            />
          ))}
        </View>
      </Field>
      <TextField
        label="Note (optional)"
        value={value.note}
        onChangeText={(note) => onChange({ ...value, note })}
        placeholder="New leaf unfurling, moved closer to the window…"
        multiline
        style={styles.note}
        maxLength={1000}
      />
    </>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  note: { minHeight: 96, textAlignVertical: 'top', paddingTop: Spacing.three },
});
