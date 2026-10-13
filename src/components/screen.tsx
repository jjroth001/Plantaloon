import type { ReactNode, Ref } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/theme/theme-provider';

type ScreenProps = {
  children: ReactNode;
  /** A large title at the top of the content (tab screens). */
  title?: string;
  /** Shown to the right of the title. */
  titleAccessory?: ReactNode;
  /** The screen has a navigation header, which already covers the status bar. */
  belowHeader?: boolean;
  /** Pinned under the scrolling content (e.g. a Save button). */
  footer?: ReactNode;
  ref?: Ref<ScrollView>;
};

/** Scrollable page container that respects the status bar and the phone's gesture area. */
export function Screen({
  children,
  title,
  titleAccessory,
  belowHeader = false,
  footer,
  ref,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        ref={ref}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: (belowHeader ? 0 : insets.top) + Spacing.three,
            paddingBottom: (footer ? 0 : insets.bottom) + Spacing.five,
          },
        ]}>
        {title ? (
          <View style={styles.titleRow}>
            <ThemedText type="title" style={styles.title} accessibilityRole="header">
              {title}
            </ThemedText>
            {titleAccessory}
          </View>
        ) : null}
        {children}
      </ScrollView>
      {footer ? (
        <View
          style={[
            styles.footer,
            {
              paddingBottom: insets.bottom + Spacing.three,
              backgroundColor: theme.background,
              borderTopColor: theme.border,
            },
          ]}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.three + Spacing.one,
    gap: Spacing.four,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginBottom: -Spacing.two,
  },
  title: { flexShrink: 1 },
  footer: {
    paddingHorizontal: Spacing.three + Spacing.one,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
});
