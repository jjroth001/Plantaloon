import { router } from 'expo-router';
import { StyleSheet, Switch, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Icon } from '@/components/icons/icon';
import { ThemedText } from '@/components/themed-text';
import {
  Card,
  Chip,
  Divider,
  Field,
  IconButton,
  Segmented,
  Stepper,
  SwitchRow,
  TextField,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { newCustomTask } from '@/db/garden';
import { POT_MATERIAL, type PotMaterial, type PotSize, type Room, type Task } from '@/db/types';
import { tapFeedback } from '@/lib/haptics';
import { EXTRA_TASKS, kindOf, TASK_INFO, taskIcon, taskLabel } from '@/lib/tasks';
import { useTheme } from '@/theme/theme-provider';

export type ScheduleValue = { enabled: boolean; intervalDays: number };

/** A reminder beyond watering and feeding: mist, turn, clean, prune, repot or a custom one. */
export type ExtraTask = { task: Task; label: string | null; intervalDays: number };

export type PlantFormValue = {
  nickname: string;
  roomId: string | null;
  potSize: PotSize;
  potDrainage: boolean;
  potMaterial: PotMaterial;
  water: ScheduleValue;
  fertilize: ScheduleValue;
  extras: ExtraTask[];
};

/** Extra reminders worth saving: custom ones need a name. */
export function namedExtras(extras: ExtraTask[]): ExtraTask[] {
  return extras
    .map((e) => ({ ...e, label: e.label?.trim() || null }))
    .filter((e) => kindOf(e.task) !== 'custom' || e.label);
}

const days = (n: number) =>
  n === 1
    ? 'Every day'
    : n % 365 === 0
      ? `Every ${n / 365 === 1 ? 'year' : `${n / 365} years`}`
      : `Every ${n} days`;

const MATERIALS = Object.keys(POT_MATERIAL) as PotMaterial[];

/** The fields shared by "Add a plant" and "Edit plant". */
export function PlantForm({
  value,
  onChange,
  rooms,
  namePlaceholder,
  pausedInWinter,
}: {
  value: PlantFormValue;
  onChange: (value: PlantFormValue) => void;
  rooms: Room[];
  namePlaceholder: string;
  /** Feeding pauses over winter for this kind of plant. */
  pausedInWinter: boolean;
}) {
  const theme = useTheme();
  const set = <K extends keyof PlantFormValue>(key: K, v: PlantFormValue[K]) =>
    onChange({ ...value, [key]: v });
  const setExtra = (index: number, patch: Partial<ExtraTask>) =>
    set(
      'extras',
      value.extras.map((e, i) => (i === index ? { ...e, ...patch } : e)),
    );
  const used = new Set(value.extras.map((e) => kindOf(e.task)));
  const addable = EXTRA_TASKS.filter((k) => k === 'custom' || !used.has(k));

  return (
    <>
      <TextField
        label="Name (optional)"
        value={value.nickname}
        onChangeText={(t) => set('nickname', t)}
        placeholder={namePlaceholder}
        maxLength={40}
      />

      <Field label="Room">
        <View style={styles.chips}>
          {rooms.map((room) => (
            <Chip
              key={room.id}
              label={room.name}
              icon={room.icon}
              selected={value.roomId === room.id}
              onPress={() => set('roomId', room.id)}
            />
          ))}
          <Chip
            label="New room"
            icon="plus"
            selected={false}
            onPress={() => router.push({ pathname: '/room/[id]', params: { id: 'new' } })}
          />
        </View>
      </Field>

      <Field label="Pot size">
        <Segmented
          options={[
            { value: 's', label: 'Small' },
            { value: 'm', label: 'Medium' },
            { value: 'l', label: 'Large' },
          ]}
          value={value.potSize}
          onChange={(v) => set('potSize', v)}
        />
      </Field>

      <Field label="Pot material">
        <View style={styles.chips}>
          {MATERIALS.map((m) => (
            <Chip
              key={m}
              label={POT_MATERIAL[m].label}
              selected={value.potMaterial === m}
              onPress={() => set('potMaterial', m)}
            />
          ))}
        </View>
        <ThemedText type="caption" color="textSecondary">
          {POT_MATERIAL[value.potMaterial].hint}
        </ThemedText>
      </Field>

      <Card>
        <SwitchRow
          title="Drainage hole"
          subtitle="The pot lets extra water drain out"
          value={value.potDrainage}
          onChange={(v) => set('potDrainage', v)}
        />
      </Card>

      <Card>
        <ScheduleField task="water" value={value.water} onChange={(v) => set('water', v)} />
        <Divider />
        <ScheduleField
          task="fertilize"
          value={value.fertilize}
          onChange={(v) => set('fertilize', v)}
          hint={pausedInWinter ? 'Pauses over winter, when plants rest.' : undefined}
        />
      </Card>

      <Card>
        <ThemedText type="subheading">Other reminders</ThemedText>
        {value.extras.map((extra, i) => (
          <Animated.View
            key={extra.task}
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(140)}
            layout={LinearTransition.duration(200)}
            style={styles.schedule}>
            {i > 0 && <Divider />}
            <View style={styles.scheduleHeader}>
              <Icon name={taskIcon(extra.task)} size={22} color={theme.tint} />
              {kindOf(extra.task) === 'custom' ? (
                <View style={styles.flex}>
                  <TextField
                    label="Task"
                    value={extra.label ?? ''}
                    onChangeText={(label) => setExtra(i, { label })}
                    placeholder="e.g. Check for pests"
                    maxLength={40}
                  />
                </View>
              ) : (
                <ThemedText type="default" style={styles.flex}>
                  {taskLabel(extra.task)}
                </ThemedText>
              )}
              <IconButton
                icon="x"
                label={`Remove ${taskLabel(extra.task, extra.label)} reminder`}
                size={36}
                onPress={() => {
                  tapFeedback();
                  set(
                    'extras',
                    value.extras.filter((_, j) => j !== i),
                  );
                }}
              />
            </View>
            <Stepper
              value={extra.intervalDays}
              onChange={(intervalDays) => setExtra(i, { intervalDays })}
              max={730}
              unit={days}
            />
          </Animated.View>
        ))}
        <View style={styles.chips}>
          {addable.map((kind) => (
            <Chip
              key={kind}
              label={kind === 'custom' ? 'Your own…' : TASK_INFO[kind].label}
              icon={kind === 'custom' ? 'plus' : TASK_INFO[kind].icon}
              selected={false}
              onPress={() =>
                set('extras', [
                  ...value.extras,
                  {
                    task: kind === 'custom' ? newCustomTask() : (kind as Task),
                    label: null,
                    intervalDays: TASK_INFO[kind].defaultDays,
                  },
                ])
              }
            />
          ))}
        </View>
      </Card>
    </>
  );
}

function ScheduleField({
  task,
  value,
  onChange,
  hint,
}: {
  task: Task;
  value: ScheduleValue;
  onChange: (value: ScheduleValue) => void;
  hint?: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.schedule}>
      <View style={styles.scheduleHeader}>
        <View style={styles.flex}>
          <ThemedText type="subheading">
            {task === 'water' ? 'Watering reminders' : 'Feeding reminders'}
          </ThemedText>
          {hint && value.enabled ? (
            <ThemedText type="caption" color="textSecondary">
              {hint}
            </ThemedText>
          ) : null}
        </View>
        <Switch
          value={value.enabled}
          onValueChange={(enabled) => {
            tapFeedback();
            onChange({ ...value, enabled });
          }}
          trackColor={{ true: theme.tint, false: theme.element }}
          thumbColor={theme.card}
          accessibilityLabel={task === 'water' ? 'Watering reminders' : 'Feeding reminders'}
        />
      </View>
      {value.enabled && (
        <Stepper
          value={value.intervalDays}
          onChange={(intervalDays) => onChange({ ...value, intervalDays })}
          max={task === 'water' ? 90 : 180}
          unit={days}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  schedule: { gap: Spacing.three },
  scheduleHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
});
