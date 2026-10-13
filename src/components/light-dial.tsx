import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { dialPosition } from '@/lib/light';
import { useTheme } from '@/theme/theme-provider';

/** Band colors, dim to bright: too dark, low, medium, bright indirect, direct sun. */
const BANDS: { from: number; to: number; color: string }[] = [
  { from: 10, to: 270, color: '#8E9AA6' },
  { from: 270, to: 800, color: '#7FA9BC' },
  { from: 800, to: 1600, color: '#9FC08A' },
  { from: 1600, to: 10800, color: '#E2B54C' },
  { from: 10800, to: 100000, color: '#EE8A3A' },
];

const STROKE = 18;

function point(cx: number, cy: number, r: number, p: number) {
  const angle = Math.PI * (1 - p);
  return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) };
}

function arc(cx: number, cy: number, r: number, from: number, to: number) {
  const a = point(cx, cy, r, from);
  const b = point(cx, cy, r, to);
  return `M ${a.x} ${a.y} A ${r} ${r} 0 0 1 ${b.x} ${b.y}`;
}

/** A half-circle gauge with a needle that glides to the current reading. */
export function LightDial({ lux, size }: { lux: number | null; size: number }) {
  const theme = useTheme();
  const r = size / 2 - STROKE;
  const cx = size / 2;
  const cy = size / 2;
  const target = lux == null ? 0 : dialPosition(lux);
  const position = useSharedValue(target);

  useEffect(() => {
    position.value = withTiming(target, { duration: 450, easing: Easing.out(Easing.cubic) });
  }, [target, position]);

  const needle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-90 + position.value * 180}deg` }],
  }));

  const gap = 0.006;
  return (
    <View style={{ width: size, height: size / 2 + STROKE / 2 }} accessible={false}>
      <Svg width={size} height={size / 2 + STROKE / 2}>
        {BANDS.map((band) => (
          <Path
            key={band.from}
            d={arc(cx, cy, r, dialPosition(band.from) + gap, dialPosition(band.to) - gap)}
            stroke={band.color}
            strokeWidth={STROKE}
            strokeLinecap="butt"
            fill="none"
            opacity={lux == null ? 0.35 : 1}
          />
        ))}
      </Svg>
      <Animated.View
        style={[
          styles.needle,
          {
            left: cx - 2,
            top: cy - r + STROKE,
            height: r - STROKE,
            backgroundColor: theme.text,
            opacity: lux == null ? 0 : 1,
          },
          needle,
        ]}
      />
      <View
        style={[
          styles.hub,
          { left: cx - 9, top: cy - 9, backgroundColor: theme.text, borderColor: theme.background },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  needle: {
    position: 'absolute',
    width: 4,
    borderRadius: 2,
    transformOrigin: 'center bottom',
  },
  hub: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
  },
});
