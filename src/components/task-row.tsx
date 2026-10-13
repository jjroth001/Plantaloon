import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Icon } from '@/components/icons/icon';
import { PlantAvatar } from '@/components/plant-avatar';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { TASK_ICON, TASK_LABEL } from '@/db/types';
import type { CareTask } from '@/lib/care-tasks';
import { describeDue } from '@/lib/schedule';
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
  const color = task.task === 'water' ? theme.water : theme.fertilize;
  const soft = task.task === 'water' ? theme.waterSoft : theme.fertilizeSoft;
  const late = task.days < 0;

  return (
    <Animated.View layout={LinearTransition.duration(220)} style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${task.name}, open plant`}
          onPress={() => router.push({ pathname: '/plant/[id]', params: { id: task.plant.id } })}
          style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
          <PlantAvatar photo={task.cover} groupId={task.plant.groupId} size={48} />
          <View style={styles.text}>
            <ThemedText type="subheading" numberOfLines={1}>
              {task.name}
            </ThemedText>
            <View style={styles.meta}>
              <Icon name={TASK_ICON[task.task]} size={15} color={color} duotone={false} />
              <ThemedText type="caption" style={{ color }}>
                {TASK_LABEL[task.task]}
              </ThemedText>
              {late && (
                <ThemedText type="caption" color="textSecondary">
                  · {describeDue(task.days)}
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
            { backgroundColor: choosing ? theme.tintSoft : theme.element },
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
          accessibilityLabel={`${TASK_LABEL[task.task]} ${task.name}: done`}
          hitSlop={4}
          onPress={() => onDone(task)}
          style={({ pressed }) => [
            styles.round,
            { backgroundColor: soft },
            pressed && styles.pressed,
          ]}>
          <Icon name="check" size={24} color={color} />
        </Pressable>
      </View>
      {choosing && (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}
          style={styles.skip}>
          <ThemedText type="caption" color="textSecondary">
            Soil still damp? Check again…
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
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  round: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  skip: { gap: Spacing.two, paddingLeft: 48 + Spacing.three },
  skipChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  skipChip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    justifyContent: 'center',
  },
});
