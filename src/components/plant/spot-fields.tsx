import { Pressable, StyleSheet, View } from 'react-native';

import type { LightTier } from '@/catalog/types';
import { ThemedText } from '@/components/themed-text';
import { Card, Chip, Divider, Field, SwitchRow } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import type { Room } from '@/db/types';
import { LIGHT_LABEL, LIGHT_TIERS } from '@/lib/light';
import { useTheme } from '@/theme/theme-provider';

/** What's different about a plant's spot; null = same as its room. */
export type SpotValue = {
  light: LightTier | null;
  growLight: boolean | null;
  draught: boolean | null;
  nearHeater: boolean;
};

/**
 * Where a plant sits within its room. Everything starts as the room's; changing something
 * here sets it for this plant only, with a link back to the room's.
 */
export function SpotFields({
  value,
  onChange,
  room,
}: {
  value: SpotValue;
  onChange: (value: SpotValue) => void;
  room: Room;
}) {
  const set = (patch: Partial<SpotValue>) => onChange({ ...value, ...patch });
  const light = value.light ?? room.lightTier;

  return (
    <Field label="Its spot">
      <ThemedText type="caption" color="textSecondary">
        Same as {room.name} unless you change something here. Useful for a plant on a sunny sill or
        in a dim corner.
      </ThemedText>
      <View style={styles.chips}>
        {LIGHT_TIERS.map((tier) => (
          <Chip
            key={tier}
            label={LIGHT_LABEL[tier]}
            selected={light === tier}
            // Picking the room's own light means "same as the room".
            onPress={() => set({ light: tier === room.lightTier ? null : tier })}
          />
        ))}
      </View>
      {value.light != null && (
        <UseRoom
          text={`Different from ${room.name} (${room.lightTier ? LIGHT_LABEL[room.lightTier].toLowerCase() : 'light not set'}).`}
          onPress={() => set({ light: null })}
        />
      )}
      <Card>
        <SwitchRow
          title="Grow light"
          subtitle="Counts as at least bright, indirect light"
          value={value.growLight ?? room.growLight}
          onChange={(on) => set({ growLight: on === room.growLight ? null : on })}
        />
        {value.growLight != null && (
          <UseRoom
            text={`${room.name} ${room.growLight ? 'has' : 'has no'} grow light.`}
            onPress={() => set({ growLight: null })}
          />
        )}
        {!room.outdoor && (
          <>
            <Divider />
            <SwitchRow
              title="Draughty"
              subtitle="Next to an outside door, a leaky window or air conditioning"
              value={value.draught ?? room.draught}
              onChange={(on) => set({ draught: on === room.draught ? null : on })}
            />
            {value.draught != null && (
              <UseRoom
                text={`${room.name} is set as ${room.draught ? 'draughty' : 'not draughty'}.`}
                onPress={() => set({ draught: null })}
              />
            )}
            <Divider />
            <SwitchRow
              title="Near a heater"
              subtitle="Beside a radiator, heater or warm air vent"
              value={value.nearHeater}
              onChange={(nearHeater) => set({ nearHeater })}
            />
          </>
        )}
      </Card>
    </Field>
  );
}

function UseRoom({ text, onPress }: { text: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.useRoom}>
      <ThemedText type="caption" color="textSecondary" style={styles.flex}>
        {text}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        hitSlop={8}
        onPress={onPress}
        style={({ pressed }) => pressed && { opacity: 0.6 }}>
        <ThemedText type="caption" style={{ color: theme.tint }}>
          Use the room’s
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  useRoom: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
