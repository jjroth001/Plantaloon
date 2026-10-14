import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Icon } from '@/components/icons/icon';
import { PlantAvatar } from '@/components/plant-avatar';
import { Screen } from '@/components/screen';
import { TaskRow } from '@/components/task-row';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Divider, EmptyState, IconButton, SectionTitle } from '@/components/ui';
import { UndoBar } from '@/components/undo-bar';
import { Spacing } from '@/constants/theme';
import {
  completeTask,
  deleteEntries,
  dismissIntervalHint,
  setSchedule,
  skipTask,
} from '@/db/garden';
import { careFor, displayName } from '@/catalog';
import { useClimateLows } from '@/hooks/use-climate';
import { useTaskColors } from '@/hooks/use-task-colors';
import { checkSpot } from '@/lib/spot';
import { doneMessage, kindOf, TASK_INFO, taskIcon, taskLabel } from '@/lib/tasks';
import { useSettings } from '@/db/use-settings';
import { useGarden } from '@/hooks/use-garden';
import { useToday } from '@/hooks/use-today';
import { buildTasks, groupByRoom, mergeSharedPots, type CareTask } from '@/lib/care-tasks';
import { formatLongDate } from '@/lib/dates';
import { successFeedback, tapFeedback } from '@/lib/haptics';
import { describeDue } from '@/lib/schedule';
import { useTheme } from '@/theme/theme-provider';

type Undo = { message: string; entryIds: string[] };

export default function TodayScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const garden = useGarden();
  const settings = useSettings();
  const today = useToday();
  const [undo, setUndo] = useState<Undo | null>(null);
  const hideUndo = useCallback(() => setUndo(null), []);
  const lows = useClimateLows();

  if (!garden.data || !settings.data) return <Screen title="Today">{null}</Screen>;

  const tasks = mergeSharedPots(buildTasks(garden.data, settings.data.hemisphere, today));
  const due = tasks.filter((t) => t.days <= 0);
  const upcoming = tasks.filter((t) => t.days > 0 && t.days <= 7);
  const suggestions = tasks.filter((t) => t.suggestion != null && t.days <= 0).slice(0, 2);
  const hasPlants = garden.data.plants.length > 0;
  // Outdoor plants that should come inside now, by the local climate.
  const month = new Date().getMonth();
  const bringIn = garden.data.plants.flatMap((plant) => {
    const room = garden.data!.rooms.find((r) => r.id === plant.roomId);
    if (!room?.outdoor || !lows) return [];
    const care = careFor(plant.groupId, plant.speciesId);
    const urgent = checkSpot(care, room, {
      lows,
      month,
      unit: settings.data!.temperatureUnit,
    }).find((c) => c.urgent);
    return urgent ? [{ plant, room, care }] : [];
  });

  const done = async (list: CareTask[]) => {
    successFeedback();
    const ids = await completeTask(
      db,
      list.map((t) => t.plant.id),
      list[0].task,
      undefined,
      list[0].label,
    );
    const first = list[0];
    setUndo({
      message:
        list.length === 1
          ? doneMessage(first.task, first.label, first.name)
          : `${TASK_INFO[kindOf(first.task)].done} ${list.length} plants`,
      entryIds: ids,
    });
  };

  const skip = async (task: CareTask, days: number) => {
    tapFeedback();
    const ids = await skipTask(db, task.plant.id, task.task, days, undefined, task.label);
    setUndo({
      message: `${task.name}: check again ${days === 1 ? 'tomorrow' : `in ${days} days`}`,
      entryIds: ids,
    });
  };

  const undoLast = async () => {
    if (!undo) return;
    setUndo(null);
    await deleteEntries(db, undo.entryIds);
  };

  return (
    <View style={styles.fill}>
      <Screen
        title="Today"
        titleAccessory={
          hasPlants ? (
            <IconButton
              icon="plus"
              label="Add a plant"
              onPress={() => router.push('/add')}
              background={theme.tint}
              color={theme.onTint}
            />
          ) : undefined
        }>
        <ThemedText type="body" color="textSecondary" style={styles.date}>
          {formatLongDate(today)}
        </ThemedText>

        {bringIn.length > 0 && (
          <Card style={{ backgroundColor: theme.dangerSoft, borderColor: 'transparent' }}>
            <View style={styles.suggestion}>
              <Icon name="snowflake" size={24} color={theme.danger} />
              <View style={styles.flex}>
                <ThemedText type="subheading">Time to bring inside</ThemedText>
                <ThemedText type="body">
                  Nights near you are now too cold for{' '}
                  {bringIn.map((b) => `${displayName(b.plant)} (${b.room.name})`).join(', ')}. Move{' '}
                  {bringIn.length === 1 ? 'it' : 'them'} indoors, then change the room on the
                  plant’s page.
                </ThemedText>
              </View>
            </View>
          </Card>
        )}

        {!hasPlants ? (
          <EmptyState
            icon="potted-plant"
            title="No plants yet"
            body="Add your first plant and Plantaloon will tell you when it needs water and food."
            action={<Button title="Add a plant" icon="plus" onPress={() => router.push('/add')} />}
          />
        ) : due.length === 0 ? (
          <Animated.View entering={FadeIn.duration(250)}>
            <EmptyState
              icon="check-circle"
              title="All done for today"
              body={
                upcoming.length > 0
                  ? `Next up: ${upcoming[0].name}, ${describeDue(upcoming[0].days).toLowerCase()}.`
                  : 'Nothing is due this week. Enjoy the green.'
              }
            />
          </Animated.View>
        ) : (
          <>
            {suggestions.map((task) => (
              <SuggestionCard
                key={`${task.plant.id}:${task.task}`}
                task={task}
                onAccept={() =>
                  setSchedule(db, task.plant.id, task.task, {
                    intervalDays: task.suggestion!,
                    enabled: true,
                  })
                }
                onDismiss={() => dismissIntervalHint(db, task.plant.id, task.task)}
              />
            ))}
            {groupByRoom(due).map(({ room, items }) => {
              const water = items.filter((t) => t.task === 'water');
              return (
                <Animated.View
                  key={room?.id ?? 'none'}
                  layout={LinearTransition.duration(220)}
                  exiting={FadeOut.duration(160)}>
                  <Card>
                    <View style={styles.roomHeader}>
                      <Icon name={room?.icon ?? 'house'} size={20} color={theme.textSecondary} />
                      <ThemedText type="label" color="textSecondary" style={styles.roomName}>
                        {room?.name ?? 'No room'}
                      </ThemedText>
                      {water.length > 1 && (
                        <Button
                          title={`Water all ${water.length}`}
                          icon="drop"
                          size="small"
                          variant="secondary"
                          onPress={() => done(water)}
                        />
                      )}
                    </View>
                    {items.map((task, i) => (
                      <Animated.View
                        key={`${task.plant.id}:${task.task}`}
                        exiting={FadeOut.duration(160)}
                        layout={LinearTransition.duration(220)}
                        style={styles.taskGap}>
                        {i > 0 && <Divider />}
                        <TaskRow task={task} onDone={(t) => done([t])} onSkip={skip} />
                      </Animated.View>
                    ))}
                  </Card>
                </Animated.View>
              );
            })}
          </>
        )}

        {hasPlants && upcoming.length > 0 && (
          <Animated.View layout={LinearTransition.duration(220)} style={styles.section}>
            <SectionTitle>Coming up this week</SectionTitle>
            <Card>
              {upcoming.slice(0, 12).map((task, i) => (
                <View key={`${task.plant.id}:${task.task}`} style={styles.taskGap}>
                  {i > 0 && <Divider />}
                  <UpcomingRow task={task} />
                </View>
              ))}
            </Card>
          </Animated.View>
        )}
      </Screen>
      {undo && (
        <UndoBar
          key={undo.entryIds.join()}
          message={undo.message}
          onUndo={undoLast}
          onHide={hideUndo}
        />
      )}
    </View>
  );
}

function UpcomingRow({ task }: { task: CareTask }) {
  const { color } = useTaskColors(task.task);
  return (
    <View style={styles.upcoming}>
      <PlantAvatar
        photo={task.cover}
        groupId={task.plant.groupId}
        speciesId={task.plant.speciesId}
        size={36}
      />
      <View style={styles.flex}>
        <ThemedText numberOfLines={1}>{task.name}</ThemedText>
        <View style={styles.meta}>
          <Icon name={taskIcon(task.task)} size={14} color={color} duotone={false} />
          <ThemedText type="caption" style={{ color }}>
            {taskLabel(task.task, task.label)}
          </ThemedText>
        </View>
      </View>
      <ThemedText type="caption" color="textSecondary">
        {describeDue(task.days)}
      </ThemedText>
    </View>
  );
}

function SuggestionCard({
  task,
  onAccept,
  onDismiss,
}: {
  task: CareTask;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const theme = useTheme();
  const verb = task.task === 'water' ? 'Water' : 'Feed';
  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(160)}>
      <Card style={{ backgroundColor: theme.tintSoft, borderColor: 'transparent' }}>
        <View style={styles.suggestion}>
          <Icon name="lightbulb" size={24} color={theme.tint} />
          <ThemedText type="body" style={styles.flex}>
            {task.name} has been “not yet” three times in a row. {verb} every {task.suggestion} days
            instead of {task.intervalDays}?
          </ThemedText>
        </View>
        <View style={styles.suggestionButtons}>
          <Button title="Keep as is" size="small" variant="ghost" onPress={onDismiss} />
          <Button title={`Every ${task.suggestion} days`} size="small" onPress={onAccept} />
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  date: { marginTop: -Spacing.three },
  section: { gap: Spacing.three },
  roomHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 40 },
  roomName: { flex: 1 },
  taskGap: { gap: Spacing.three },
  upcoming: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  suggestion: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  suggestionButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two },
});
