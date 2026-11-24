import { useSQLiteContext } from 'expo-sqlite';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Icon } from '@/components/icons/icon';
import { ThemedText } from '@/components/themed-text';
import { PRESSED_OPACITY, Spacing } from '@/constants/theme';
import { setHealth } from '@/db/garden';
import { HEALTH, type HealthStatus } from '@/db/types';
import { successFeedback, tapFeedback } from '@/lib/haptics';
import { useTheme } from '@/theme/theme-provider';

const ORDER: HealthStatus[] = ['thriving', 'fine', 'struggling', 'sick'];

/** "Health: Thriving" — tap to record how the plant is doing (kept in its journal). */
export function HealthChip({
  plantId,
  status,
  leading,
}: {
  plantId: string;
  status: HealthStatus | undefined;
  /** Shown before the chip on the same line (the room); the choices open below both. */
  leading?: ReactNode;
}) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const tone = (s: HealthStatus | undefined) =>
    s === 'struggling'
      ? { color: theme.warning, background: theme.warningSoft }
      : s === 'sick'
        ? { color: theme.danger, background: theme.dangerSoft }
        : s
          ? { color: theme.tint, background: theme.tintSoft }
          : { color: theme.textSecondary, background: theme.element };
  const current = tone(status);

  return (
    <View style={styles.wrap}>
      <View style={styles.line}>
        {leading}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={status ? `Health: ${HEALTH[status].label}. Change` : 'Set health'}
          onPress={() => {
            tapFeedback();
            setOpen((o) => !o);
          }}
          style={({ pressed }) => [
            styles.chip,
            { backgroundColor: current.background },
            pressed && styles.pressed,
          ]}>
          <Icon name={status ? HEALTH[status].icon : 'heart'} size={16} color={current.color} />
          <ThemedText type="caption" style={{ color: current.color, fontWeight: 700 }}>
            {status ? HEALTH[status].label : 'How is it doing?'}
          </ThemedText>
        </Pressable>
      </View>
      {open && (
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(120)}
          style={styles.choices}>
          {ORDER.map((s) => {
            const t = tone(s);
            return (
              <Pressable
                key={s}
                accessibilityRole="button"
                onPress={async () => {
                  setOpen(false);
                  if (s !== status) {
                    successFeedback();
                    await setHealth(db, plantId, s);
                  }
                }}
                style={({ pressed }) => [
                  styles.choice,
                  {
                    backgroundColor: t.background,
                    borderColor: s === status ? t.color : 'transparent',
                  },
                  pressed && styles.pressed,
                ]}>
                <Icon name={HEALTH[s].icon} size={16} color={t.color} />
                <ThemedText type="label" style={{ color: t.color }}>
                  {HEALTH[s].label}
                </ThemedText>
              </Pressable>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'flex-start', gap: Spacing.two },
  line: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  pressed: { opacity: PRESSED_OPACITY },
});
