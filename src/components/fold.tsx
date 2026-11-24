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
import { Card, Divider, InsideCard, pressedStyle } from '@/components/ui';
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
  alert,
  grouped = false,
  children,
}: {
  title: string;
  summary: string;
  /** The summary is a warning (shown in the warning color with an icon), so it's seen while closed. */
  alert?: boolean;
  open: boolean;
  onToggle: () => void;
  /** A row inside a FoldGroup's card, rather than a card of its own. */
  grouped?: boolean;
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

  const Box = grouped ? View : Card;
  return (
    <Animated.View layout={LinearTransition.duration(220).easing(EASE)}>
      <Box style={grouped ? styles.grouped : undefined}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityHint={open ? 'Closes this section' : 'Opens this section'}
          onPress={() => {
            tapFeedback();
            onToggle();
          }}
          style={({ pressed }) => [
            styles.header,
            grouped && styles.groupedHeader,
            pressed && pressedStyle,
          ]}>
          <View style={styles.flex}>
            <ThemedText type="subheading">{title}</ThemedText>
            {!open &&
              (alert ? (
                <View style={styles.alert}>
                  <Icon name="warning" size={16} color={theme.warning} />
                  <ThemedText
                    type="caption"
                    numberOfLines={1}
                    style={[styles.flex, { color: theme.warning }]}>
                    {summary}
                  </ThemedText>
                </View>
              ) : (
                <ThemedText type="caption" color="textSecondary" numberOfLines={1}>
                  {summary}
                </ThemedText>
              ))}
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
            <InsideCard.Provider value={true}>{children}</InsideCard.Provider>
          </Animated.View>
        )}
      </Box>
    </Animated.View>
  );
}

/** Several folds sharing one card, as rows with dividers between them. */
export function FoldGroup({ children }: { children: ReactNode[] }) {
  const rows = children.filter((c) => c != null && c !== false);
  return (
    <Animated.View layout={LinearTransition.duration(220).easing(EASE)}>
      <Card style={styles.group}>
        {rows.map((row, i) => (
          <View key={i}>
            {i > 0 && <Divider />}
            {row}
          </View>
        ))}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  body: { gap: Spacing.four },
  group: { gap: 0, paddingVertical: Spacing.one },
  grouped: { gap: Spacing.three, paddingBottom: Spacing.two },
  groupedHeader: { minHeight: 60, paddingVertical: Spacing.two },
  alert: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
});
