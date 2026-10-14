import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import type { LightTier } from '@/catalog/types';
import { Icon } from '@/components/icons/icon';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Chip, Divider, Field, SwitchRow } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import type { Room } from '@/db/types';
import type { SpotValue } from '@/lib/plant-form-value';
import { useLightSensor } from '@/hooks/use-light-sensor';
import { successFeedback } from '@/lib/haptics';
import { formatLux, LIGHT_LABEL, LIGHT_TIERS, tierForLux } from '@/lib/light';
import { useTheme } from '@/theme/theme-provider';

export { spotSummary, type SpotValue } from '@/lib/plant-form-value';

/**
 * Where a plant sits within its room. Everything starts as the room's; changing something
 * here sets it for this plant only, with a link back to the room's.
 */
export function SpotFields({
  value,
  onChange,
  room,
  inFold,
}: {
  value: SpotValue;
  onChange: (value: SpotValue) => void;
  room: Room;
  /** Inside a fold that has its own title. */
  inFold?: boolean;
}) {
  const set = (patch: Partial<SpotValue>) => onChange({ ...value, ...patch });
  const light = value.light ?? room.lightTier;
  const [measuring, setMeasuring] = useState(false);

  const Wrap = inFold ? Bare : Field;
  return (
    <Wrap label="Its spot">
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
            onPress={() => set({ light: tier === room.lightTier ? null : tier, lux: null })}
          />
        ))}
      </View>
      {measuring ? (
        <Meter
          onCancel={() => setMeasuring(false)}
          onUse={(tier, lux) => {
            successFeedback();
            set({ light: tier, lux: Math.round(lux) });
            setMeasuring(false);
          }}
        />
      ) : (
        <Button
          title="Measure the light here"
          icon="sun"
          size="small"
          variant="secondary"
          onPress={() => setMeasuring(true)}
        />
      )}
      {value.light != null && value.lux != null && !measuring && (
        <ThemedText type="caption" color="textSecondary">
          Measured {formatLux(value.lux)} lux.
        </ThemedText>
      )}
      {value.light != null && (
        <UseRoom
          text={`Different from ${room.name} (${room.lightTier ? LIGHT_LABEL[room.lightTier].toLowerCase() : 'light not set'}).`}
          onPress={() => set({ light: null, lux: null })}
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
    </Wrap>
  );
}

function Bare({ children }: { label: string; children: ReactNode }) {
  return <View style={styles.bare}>{children}</View>;
}

/** A live light reading, to save as this plant's light. */
function Meter({
  onCancel,
  onUse,
}: {
  onCancel: () => void;
  onUse: (tier: LightTier, lux: number) => void;
}) {
  const theme = useTheme();
  const { state, lux } = useLightSensor(true);
  const reading = lux == null ? null : tierForLux(lux);

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
      <Card style={{ backgroundColor: theme.tintSoft, borderColor: 'transparent' }}>
        <View style={styles.meterRow}>
          <Icon name="sun" size={28} color={theme.tint} />
          <View style={styles.flex} accessibilityLiveRegion="polite">
            {state === 'missing' ? (
              <ThemedText type="body">This phone doesn’t report its light sensor.</ThemedText>
            ) : (
              <>
                <ThemedText type="subheading">
                  {lux == null ? 'Reading…' : `${formatLux(lux)} lux`}
                </ThemedText>
                <ThemedText type="caption" color="textSecondary">
                  {reading == null
                    ? 'Hold the phone where the plant sits, screen facing the window.'
                    : reading === 'too_dark'
                      ? 'Too dark for most plants. Measure in daylight, around midday.'
                      : LIGHT_LABEL[reading]}
                </ThemedText>
              </>
            )}
          </View>
        </View>
        <View style={styles.meterButtons}>
          <Button title="Cancel" size="small" variant="ghost" onPress={onCancel} />
          {reading != null && reading !== 'too_dark' && lux != null && (
            <Button
              title="Use this reading"
              icon="check"
              size="small"
              onPress={() => onUse(reading, lux)}
            />
          )}
        </View>
      </Card>
    </Animated.View>
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
  bare: { gap: Spacing.three },
  useRoom: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  meterButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two },
});
