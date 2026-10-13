import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/theme/theme-provider';

const VISIBLE_MS = 6000;

/** A snackbar at the bottom of the screen with an Undo button. Hides itself after a while. */
export function UndoBar({
  message,
  onUndo,
  onHide,
}: {
  message: string;
  onUndo: () => void;
  onHide: () => void;
}) {
  const theme = useTheme();

  useEffect(() => {
    const timer = setTimeout(onHide, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [message, onHide]);

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      exiting={FadeOutDown.duration(160)}
      style={[styles.bar, { backgroundColor: theme.text }]}
      accessibilityLiveRegion="polite">
      <ThemedText
        type="body"
        style={[styles.message, { color: theme.background }]}
        numberOfLines={2}>
        {message}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        hitSlop={8}
        onPress={onUndo}
        style={({ pressed }) => [styles.undo, pressed && { opacity: 0.6 }]}>
        <ThemedText type="label" style={{ color: theme.background }}>
          UNDO
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    bottom: Spacing.three,
    borderRadius: Radius.medium,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    boxShadow: '0px 4px 16px rgba(0,0,0,0.2)',
  },
  message: { flex: 1 },
  undo: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
});
