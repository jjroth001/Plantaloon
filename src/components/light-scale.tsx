import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { LightTier } from '@/catalog/types';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { tapFeedback } from '@/lib/haptics';
import { LIGHT_LABEL, LIGHT_TIERS } from '@/lib/light';
import { useTheme } from '@/theme/theme-provider';

/** Sunny yellow that reads on both themes (as on the plant page's light card). */
export const SUN = { light: '#9A6410', dark: '#EDC56B' };
export const SUN_SOFT = { light: 'rgba(154,100,16,0.10)', dark: 'rgba(237,197,107,0.14)' };

const SHORT: Record<LightTier, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'Bright',
  very_high: 'Sun',
};
const GAP = 6;
const KNOB = 22;

/**
 * Light as a scale from dim to sunny: tap a step to choose it. The bar fills up to the
 * choice and a knob glides to it.
 */
export function LightScale({
  value,
  onChange,
}: {
  value: LightTier | null;
  onChange: (tier: LightTier) => void;
}) {
  const theme = useTheme();
  const sun = theme.dark ? SUN.dark : SUN.light;
  const [width, setWidth] = useState(0);
  const index = value == null ? -1 : LIGHT_TIERS.indexOf(value);
  const step = (width - GAP * (LIGHT_TIERS.length - 1)) / LIGHT_TIERS.length;
  const target = index < 0 ? 0 : index * (step + GAP) + step / 2 - KNOB / 2;
  const left = useSharedValue(target);

  useEffect(() => {
    left.value = withTiming(target, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [target, left]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: left.value }] }));

  return (
    <View style={styles.gap}>
      <View style={styles.track} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {LIGHT_TIERS.map((tier, i) => (
          <Pressable
            key={tier}
            accessibilityRole="radio"
            accessibilityState={{ selected: i === index }}
            accessibilityLabel={LIGHT_LABEL[tier]}
            hitSlop={{ top: 14, bottom: 14 }}
            onPress={() => {
              if (i !== index) tapFeedback();
              onChange(tier);
            }}
            style={[styles.step, { backgroundColor: i <= index ? sun : theme.element }]}
          />
        ))}
        {index >= 0 && width > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[styles.knob, { backgroundColor: sun, borderColor: theme.card }, knob]}
          />
        )}
      </View>
      <View style={styles.labels}>
        {LIGHT_TIERS.map((tier, i) => (
          <ThemedText
            key={tier}
            type="caption"
            style={[
              styles.label,
              { color: i === index ? theme.text : theme.textSecondary },
              i === index && styles.chosen,
            ]}>
            {SHORT[tier]}
          </ThemedText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { gap: Spacing.two },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
    height: KNOB + 6,
  },
  step: { flex: 1, height: 14, borderRadius: 7 },
  knob: {
    position: 'absolute',
    left: 0,
    width: KNOB + 6,
    height: KNOB + 6,
    marginLeft: -3,
    borderRadius: (KNOB + 6) / 2,
    borderWidth: 3,
  },
  labels: { flexDirection: 'row', gap: GAP },
  label: { flex: 1, textAlign: 'center' },
  chosen: { fontWeight: '700' },
});
