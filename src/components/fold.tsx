import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Icon } from '@/components/icons/icon';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { tapFeedback } from '@/lib/haptics';
import { useTheme } from '@/theme/theme-provider';

const EASE = Easing.out(Easing.cubic);

/**
 * A collapsible section: a title and a one-line summary while closed, the fields when open.
 * Opening and closing animate, and the folds below glide to make room.
 */
export function Fold({
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const theme = useTheme();
  const turn = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    turn.value = withTiming(open ? 1 : 0, { duration: 220, easing: EASE });
  }, [open, turn]);

  const caret = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value * 180}deg` }],
  }));

  return (
    <Animated.View layout={LinearTransition.duration(220).easing(EASE)}>
      <Card>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityHint={open ? 'Closes this section' : 'Opens this section'}
          onPress={() => {
            tapFeedback();
            onToggle();
          }}
          style={({ pressed }) => [styles.header, pressed && { opacity: 0.7 }]}>
          <View style={styles.flex}>
            <ThemedText type="subheading">{title}</ThemedText>
            {!open && (
              <ThemedText type="caption" color="textSecondary" numberOfLines={1}>
                {summary}
              </ThemedText>
            )}
          </View>
          <Animated.View style={caret}>
            <Icon name="caret-down" size={20} color={theme.textSecondary} duotone={false} />
          </Animated.View>
        </Pressable>
        {open && (
          <Animated.View
            entering={FadeIn.duration(200).delay(60)}
            exiting={FadeOut.duration(120)}
            style={styles.body}>
            {children}
          </Animated.View>
        )}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  body: { gap: Spacing.four },
});
