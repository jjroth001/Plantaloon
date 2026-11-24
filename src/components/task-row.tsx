import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Icon } from '@/components/icons/icon';
import { PlantAvatar } from '@/components/plant-avatar';
import { ThemedText } from '@/components/themed-text';
import { PRESSED_OPACITY, Spacing } from '@/constants/theme';
import { useTaskColors } from '@/hooks/use-task-colors';
import type { CareTask } from '@/lib/care-tasks';
import { describeDue } from '@/lib/schedule';
import { taskIcon, taskLabel } from '@/lib/tasks';
import { tapFeedback } from '@/lib/haptics';
import { useTheme } from '@/theme/theme-provider';

const SKIP_CHOICES = [
  { days: 1, label: 'Tomorrow' },
  { days: 2, label: '2 days' },
  { days: 3, label: '3 days' },
  { days: 7, label: 'A week' },
] as const;

/** One due task: the plant, what it needs, and Done / Not yet. */
export function TaskRow({
  task,
  onDone,
  onSkip,
}: {
  task: CareTask;
  onDone: (task: CareTask) => void;
  onSkip: (task: CareTask, days: number) => void;
}) {
  const theme = useTheme();
  const [choosing, setChoosing] = useState(false);
  const { color } = useTaskColors(task.task);
  // Water and feed have their own ink on a solid button; other tasks use the accent's.
  const onColor = task.task === 'water' || task.task === 'fertilize' ? theme.onTask : theme.onTint;
  const label = taskLabel(task.task, task.label);
  const late = task.days < 0;

  return (
    <Animated.View layout={LinearTransition.duration(220)} style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${task.name}, open plant`}
          onPress={() => router.push({ pathname: '/plant/[id]', params: { id: task.plant.id } })}
          style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
          <PlantAvatar
            photo={task.cover}
            groupId={task.plant.groupId}
            speciesId={task.plant.speciesId}
            size={48}
          />
          <View style={styles.text}>
            <ThemedText type="name" numberOfLines={1}>
              {task.name}
            </ThemedText>
            <View style={styles.meta}>
              <Icon name={taskIcon(task.task)} size={15} color={color} duotone={false} />
              <ThemedText type="caption" style={{ color }}>
                {label}
              </ThemedText>
              {late && (
                <ThemedText type="caption" numberOfLines={1} style={styles.late}>
                  <ThemedText type="caption" color="textSecondary">
                    {' · '}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.warning, fontWeight: 600 }}>
                    {describeDue(task.days)}
                  </ThemedText>
                </ThemedText>
              )}
            </View>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Not yet: check ${task.name} again later`}
          accessibilityState={{ expanded: choosing }}
          hitSlop={4}
          onPress={() => {
            tapFeedback();
            setChoosing((v) => !v);
          }}
          style={({ pressed }) => [
            styles.round,
            // Quiet: just the icon, unless its choices are open.
            choosing && { backgroundColor: theme.tintSoft },
            pressed && styles.pressed,
          ]}>
          <Icon
            name="clock-clockwise"
            size={22}
            color={choosing ? theme.tint : theme.textSecondary}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} ${task.name}: done`}
          hitSlop={4}
          onPress={() => onDone(task)}
          style={({ pressed }) => [
            styles.round,
            styles.done,
            { backgroundColor: color },
            pressed && styles.donePressed,
          ]}>
          <Icon name="check" size={26} color={onColor} duotone={false} />
        </Pressable>
      </View>
      {choosing && (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}
          style={styles.skip}>
          <ThemedText type="caption" color="textSecondary">
            {task.task === 'water' || task.task === 'fertilize'
              ? 'Soil still damp? Check again…'
              : 'Not today? Remind me again…'}
          </ThemedText>
          <View style={styles.skipChoices}>
            {SKIP_CHOICES.map((choice) => (
              <Pressable
                key={choice.days}
                accessibilityRole="button"
                onPress={() => {
                  setChoosing(false);
                  onSkip(task, choice.days);
                }}
                style={({ pressed }) => [
                  styles.skipChip,
                  { backgroundColor: theme.element },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="label">{choice.label}</ThemedText>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  text: { flex: 1, gap: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 0 },
  round: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: PRESSED_OPACITY },
  done: { width: 50, height: 50, borderRadius: 25 },
  // A small press-in, so the main action feels like a button being pushed.
  donePressed: { opacity: 0.85, transform: [{ scale: 0.92 }] },
  late: { flexShrink: 1 },
  skip: { gap: Spacing.two, paddingLeft: 48 + Spacing.three },
  skipChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  skipChip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    justifyContent: 'center',
  },
});
