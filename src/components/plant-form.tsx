import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Switch, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Icon } from '@/components/icons/icon';
import { IntervalField } from '@/components/interval-field';
import { ThemedText } from '@/components/themed-text';
import {
  Card,
  Chip,
  Divider,
  Field,
  IconButton,
  Segmented,
  SwitchRow,
  TextField,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { newCustomTask } from '@/db/garden';
import { displayName } from '@/catalog';
import { POT_MATERIAL, type Plant, type PotMaterial, type Room, type Task } from '@/db/types';
import {
  diameterCm,
  isInGround,
  type ExtraTask,
  type FormSection,
  type LengthUnit,
  type PlantFormValue,
  type ScheduleValue,
} from '@/lib/plant-form-value';
import { potSizeFor } from '@/lib/schedule';
import { tapFeedback } from '@/lib/haptics';
import { EXTRA_TASKS, kindOf, TASK_INFO, taskIcon, taskLabel } from '@/lib/tasks';
import { useTheme } from '@/theme/theme-provider';

export * from '@/lib/plant-form-value';

const MATERIALS = Object.keys(POT_MATERIAL) as PotMaterial[];

/** The fields shared by "Add a plant" and "Edit plant": all of them, or one section. */
export function PlantForm({
  value,
  onChange,
  rooms,
  namePlaceholder,
  pausedInWinter,
  unit,
  mateCandidates,
  section,
  inFold,
}: {
  value: PlantFormValue;
  onChange: (value: PlantFormValue) => void;
  rooms: Room[];
  /** Pot sizes in centimetres or inches. */
  unit: LengthUnit;
  /** Other plants that could share this pot (the form shows those in the chosen room). */
  mateCandidates: Plant[];
  namePlaceholder: string;
  /** Feeding pauses over winter for this kind of plant. */
  pausedInWinter: boolean;
  /** Only this part of the form; everything when left out. */
  section?: FormSection;
  /** Inside a fold that's already a card: lists sit on it directly. */
  inFold?: boolean;
}) {
  const show = (s: FormSection) => section == null || section === s;
  const Box = inFold ? Plain : Card;
  const theme = useTheme();
  const set = <K extends keyof PlantFormValue>(key: K, v: PlantFormValue[K]) =>
    onChange({ ...value, [key]: v });
  const setExtra = (index: number, patch: Partial<ExtraTask>) =>
    set(
      'extras',
      value.extras.map((e, i) => (i === index ? { ...e, ...patch } : e)),
    );
  const used = new Set(value.extras.map((e) => kindOf(e.task)));
  // Pot-mates: plants in the chosen room, plus any already chosen.
  const mates = mateCandidates.filter(
    (p) =>
      p.roomId === value.roomId ||
      value.potMates.includes(p.id) ||
      // Keep a picked pot's other plants visible, wherever they are.
      (p.sharedPot != null &&
        mateCandidates.some((m) => m.sharedPot === p.sharedPot && value.potMates.includes(m.id))),
  );
  const outdoors = rooms.some((r) => r.id === value.roomId && r.outdoor);
  const ground = isInGround(value, rooms);
  // Nothing to repot in a garden bed.
  const addable = EXTRA_TASKS.filter(
    (k) => (k === 'custom' || !used.has(k)) && !(ground && k === 'repot'),
  );

  return (
    <>
      {show('name') && (
        <TextField
          label="Name (optional)"
          value={value.nickname}
          onChangeText={(t) => set('nickname', t)}
          placeholder={namePlaceholder}
          maxLength={40}
        />
      )}

      {show('room') && (
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
      )}

      {show('room') && outdoors && (
        <Card>
          <SwitchRow
            title="Planted in the ground"
            subtitle="In a garden bed rather than a pot"
            value={value.inGround}
            onChange={(v) => set('inGround', v)}
          />
        </Card>
      )}

      {show('pot') && !ground && (
        <>
          <Field label="Pot size">
            <Segmented
              options={[
                { value: 's', label: 'Small' },
                { value: 'm', label: 'Medium' },
                { value: 'l', label: 'Large' },
              ]}
              value={value.potSize}
              // A quick pick replaces a typed size.
              onChange={(v) => onChange({ ...value, potSize: v, potDiameter: '' })}
            />
            <View style={styles.diameter}>
              <ThemedText type="body" color="textSecondary" style={styles.flex}>
                Or the exact width across the top
              </ThemedText>
              <TextInput
                value={value.potDiameter}
                onChangeText={(text) => {
                  const cm = diameterCm(text, unit);
                  onChange({
                    ...value,
                    potDiameter: text,
                    potSize: cm ? potSizeFor(cm) : value.potSize,
                  });
                }}
                keyboardType="decimal-pad"
                placeholder={unit === 'in' ? '6' : '15'}
                placeholderTextColor={theme.textSecondary}
                maxLength={5}
                accessibilityLabel={`Pot diameter in ${unit === 'in' ? 'inches' : 'centimetres'}`}
                style={[
                  styles.diameterInput,
                  { backgroundColor: theme.element, color: theme.text },
                ]}
              />
              <ThemedText type="body" color="textSecondary">
                {unit}
              </ThemedText>
            </View>
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

          {mates.length > 0 && (
            <Field label="Shares a pot with">
              <View style={styles.chips}>
                {mates.map((p) => (
                  <Chip
                    key={p.id}
                    label={displayName(p)}
                    icon="potted-plant"
                    selected={value.potMates.includes(p.id)}
                    onPress={() => {
                      // A plant already in a pot comes with its whole pot.
                      const pot = p.sharedPot
                        ? mates.filter((m) => m.sharedPot === p.sharedPot).map((m) => m.id)
                        : [p.id];
                      set(
                        'potMates',
                        value.potMates.includes(p.id)
                          ? value.potMates.filter((id) => !pot.includes(id))
                          : [...new Set([...value.potMates, ...pot])],
                      );
                    }}
                  />
                ))}
              </View>
              <ThemedText type="caption" color="textSecondary">
                Plants in one pot are watered and fed together, at the pace of the thirstiest.
              </ThemedText>
            </Field>
          )}
        </>
      )}

      {show('care') && (
        <Box>
          <ScheduleField task="water" value={value.water} onChange={(v) => set('water', v)} />
          <Divider />
          <ScheduleField
            task="fertilize"
            value={value.fertilize}
            onChange={(v) => set('fertilize', v)}
            hint={pausedInWinter ? 'Pauses over winter, when plants rest.' : undefined}
          />
        </Box>
      )}

      {show('extras') && (
        <Box>
          {section == null && <ThemedText type="subheading">Other reminders</ThemedText>}
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
              <IntervalField
                kind={kindOf(extra.task)}
                title={`${taskLabel(extra.task, extra.label)} every…`}
                value={extra.intervalDays}
                onChange={(intervalDays) => setExtra(i, { intervalDays })}
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
        </Box>
      )}
    </>
  );
}

function Plain({ children }: { children: ReactNode }) {
  return <View style={styles.schedule}>{children}</View>;
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
        <IntervalField
          kind={task === 'water' ? 'water' : 'fertilize'}
          title={task === 'water' ? 'Water every…' : 'Feed every…'}
          value={value.intervalDays}
          onChange={(intervalDays) => onChange({ ...value, intervalDays })}
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
  diameter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  diameterInput: {
    width: 72,
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: Spacing.two,
    fontSize: 17,
    textAlign: 'center',
  },
});
