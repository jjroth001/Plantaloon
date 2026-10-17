import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import type { LightTier } from '@/catalog/types';
import { Icon } from '@/components/icons/icon';
import { LightScale, SUN, SUN_SOFT } from '@/components/light-scale';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Divider, Field, SwitchRow } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import type { Room } from '@/db/types';
import type { SpotValue } from '@/lib/plant-form-value';
import { useLightSensor } from '@/hooks/use-light-sensor';
import { successFeedback } from '@/lib/haptics';
import { formatLux, LIGHT_HINT, LIGHT_LABEL, tierForLux } from '@/lib/light';
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
  const theme = useTheme();
  const set = (patch: Partial<SpotValue>) => onChange({ ...value, ...patch });
  const light = value.light ?? room.lightTier;
  const [measuring, setMeasuring] = useState(false);

  const Wrap = inFold ? Bare : Field;
  return (
    <Wrap label="Its spot">
      <ThemedText type="caption" color="textSecondary">
        Starts the same as {room.name}. Change anything that’s different where this plant sits.
      </ThemedText>
      <ThemedText type="subheading">Light</ThemedText>
      <LightScale
        value={light}
        // Picking the room's own light means "same as the room".
        onChange={(tier) => set({ light: tier === room.lightTier ? null : tier, lux: null })}
      />
      <View
        style={[
          styles.lightNote,
          { backgroundColor: theme.dark ? SUN_SOFT.dark : SUN_SOFT.light },
        ]}>
        <View style={styles.flex}>
          <ThemedText type="label" style={{ color: theme.dark ? SUN.dark : SUN.light }}>
            {light == null
              ? 'Not set yet'
              : `${LIGHT_LABEL[light]} · ${
                  value.light == null
                    ? `same as ${room.name}`
                    : value.lux != null
                      ? `measured ${formatLux(value.lux)} lux`
                      : 'just this plant'
                }`}
          </ThemedText>
          <ThemedText type="caption" color="textSecondary">
            {light == null ? 'Tap the scale, or measure it.' : LIGHT_HINT[light]}
          </ThemedText>
        </View>
        {value.light != null && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Use ${room.name}'s light`}
            hitSlop={8}
            onPress={() => set({ light: null, lux: null })}
            style={({ pressed }) => pressed && { opacity: 0.6 }}>
            <ThemedText type="caption" style={{ color: theme.tint }}>
              Use the room’s
            </ThemedText>
          </Pressable>
        )}
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
        <Pressable
          accessibilityRole="button"
          onPress={() => setMeasuring(true)}
          style={({ pressed }) => [styles.measure, pressed && { opacity: 0.6 }]}>
          <Icon name="sun" size={22} color={theme.dark ? SUN.dark : SUN.light} />
          <ThemedText type="label" style={{ color: theme.tint }}>
            Measure the light here
          </ThemedText>
        </Pressable>
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
  lightNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    padding: Spacing.three,
  },
  measure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    alignSelf: 'flex-start',
    paddingVertical: Spacing.one,
  },
  useRoom: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  meterButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two },
});
