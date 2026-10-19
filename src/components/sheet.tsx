import { useEffect, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/theme/theme-provider';

const DURATION = 240;

/**
 * A panel that slides up from the bottom over a dimmed page. Tapping outside it or the
 * phone's back gesture closes it; both directions animate.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // The modal stays up a moment after closing, so the slide-out can play.
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  useEffect(() => {
    if (open) return;
    const timer = setTimeout(() => setMounted(false), DURATION);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <Modal
      visible={open || mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      {/* The modal's window doesn't resize for the keyboard, so lift the sheet above it. */}
      <KeyboardAvoidingView behavior="padding" style={styles.fill}>
        {/* Each layer is added and removed by itself, so its fade or slide runs both ways. */}
        {open && (
          <Animated.View
            entering={FadeIn.duration(DURATION)}
            exiting={FadeOut.duration(DURATION)}
            style={[StyleSheet.absoluteFill, styles.backdrop]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={StyleSheet.absoluteFill}
              onPress={onClose}
            />
          </Animated.View>
        )}
        {open && (
          <Animated.View
            entering={SlideInDown.duration(DURATION)}
            exiting={SlideOutDown.duration(DURATION)}
            style={[
              styles.sheet,
              { backgroundColor: theme.card, paddingBottom: insets.bottom + Spacing.four },
            ]}>
            <View style={[styles.handle, { backgroundColor: theme.element }]} />
            <ThemedText type="heading" accessibilityRole="header">
              {title}
            </ThemedText>
            {children}
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    borderTopLeftRadius: Radius.large + 8,
    borderTopRightRadius: Radius.large + 8,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3 },
});
