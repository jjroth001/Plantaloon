import { router } from 'expo-router';
import { StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  Card,
  Chip,
  Divider,
  Field,
  Segmented,
  Stepper,
  SwitchRow,
  TextField,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import type { PotSize, Room, Task } from '@/db/types';
import { tapFeedback } from '@/lib/haptics';
import { useTheme } from '@/theme/theme-provider';

export type ScheduleValue = { enabled: boolean; intervalDays: number };

export type PlantFormValue = {
  nickname: string;
  roomId: string | null;
  potSize: PotSize;
  potDrainage: boolean;
  water: ScheduleValue;
  fertilize: ScheduleValue;
};

const days = (n: number) => (n === 1 ? 'Every day' : `Every ${n} days`);

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
  const set = <K extends keyof PlantFormValue>(key: K, v: PlantFormValue[K]) =>
    onChange({ ...value, [key]: v });

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
