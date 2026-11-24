import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/components/icons/icon';
import { Sheet } from '@/components/sheet';
import { ThemedText } from '@/components/themed-text';
import { Button, pressedStyle, RadioList } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { tapFeedback } from '@/lib/haptics';
import { useTheme } from '@/theme/theme-provider';

/** Multipliers for the phone's light sensor (100% = as it reads), each with when to use it. */
export const SENSITIVITIES = [
  { value: 0.5, label: '50%', hint: 'Halves readings, if a dim corner reads bright' },
  { value: 0.75, label: '75%', hint: 'A little lower' },
  { value: 1, label: 'As it reads', hint: 'The sensor’s own numbers (usual)' },
  { value: 1.5, label: '150%', hint: 'A little higher' },
  { value: 2, label: '200%', hint: 'Doubles readings, if a bright window reads dim' },
  { value: 3, label: '300%', hint: 'For a sensor under the screen that reads very low' },
  { value: 4, label: '400%', hint: 'For a sensor that reads far too low' },
] as const;

/** "As it reads", or the percentage, for the current setting. */
export function sensitivityLabel(value: number): string {
  return (
    SENSITIVITIES.find((s) => Math.abs(s.value - value) < 0.001)?.label ??
    `${Math.round(value * 100)}%`
  );
}

/** The light sensor's sensitivity as one tidy row; tapping it opens the choices in a sheet. */
export function SensitivityField({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Sensor sensitivity: ${sensitivityLabel(value)}. Change`}
        onPress={() => {
          tapFeedback();
          setDraft(value);
          setOpen(true);
        }}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: theme.element },
          pressed && pressedStyle,
        ]}>
        <Icon name="sun" size={20} color={theme.sun} />
        <ThemedText style={styles.flex}>{sensitivityLabel(value)}</ThemedText>
        <Icon name="caret-right" size={18} color={theme.textSecondary} duotone={false} />
      </Pressable>
      <Sheet open={open} onClose={() => setOpen(false)} title="Sensor sensitivity">
        <ThemedText type="body" color="textSecondary">
          Phone light sensors vary, and many sit under the screen and read low. If you can, compare
          with a light meter or another phone.
        </ThemedText>
        <RadioList
          boxed={false}
          options={SENSITIVITIES.map((s) => ({
            value: String(s.value),
            label: s.label,
            hint: s.hint,
          }))}
          value={String(
            SENSITIVITIES.find((s) => Math.abs(s.value - draft) < 0.001)?.value ?? draft,
          )}
          onChange={(v) => setDraft(Number(v))}
        />
        <Button
          title="Done"
          onPress={() => {
            onChange(draft);
            setOpen(false);
          }}
        />
      </Sheet>
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
});
