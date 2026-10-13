import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { careFor, displayName, getSpecies, type Care } from '@/catalog';
import { descriptionFor, detailsFor } from '@/catalog/media';
import {
  AboutSection,
  CareSection,
  GrowingSection,
  ProblemsSection,
  QuickFacts,
  Section,
  SectionTabs,
  useSections,
  type CareContext,
  type SectionName,
} from '@/components/care/care-sections';
import { Icon, type IconName } from '@/components/icons/icon';
import { PlantAvatar } from '@/components/plant-avatar';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Divider, IconButton, SectionTitle } from '@/components/ui';
import { UndoBar } from '@/components/undo-bar';
import { Radius, Spacing } from '@/constants/theme';
import {
  completeTask,
  deleteEntries,
  dismissIntervalHint,
  listJournal,
  setSchedule,
  type JournalItem,
} from '@/db/garden';
import {
  ENTRY_ICON,
  ENTRY_LABEL,
  HEALTH,
  type HealthStatus,
  type Schedule,
  type Task,
} from '@/db/types';
import { useDbQuery } from '@/db/use-db-query';
import { useSettings } from '@/db/use-settings';
import { useClimateLows } from '@/hooks/use-climate';
import { useGarden } from '@/hooks/use-garden';
import { useToday } from '@/hooks/use-today';
import { addPlantPhoto } from '@/lib/add-photo';
import { buildTasks, type CareTask } from '@/lib/care-tasks';
import { dateOf, formatRelativeDay, formatTime } from '@/lib/dates';
import { successFeedback } from '@/lib/haptics';
import { lightFit } from '@/lib/light';
import { checkSpot, effectiveLight } from '@/lib/spot';
import { doneMessage, taskForEntry, taskIcon, taskLabel } from '@/lib/tasks';
import { useTaskColors } from '@/hooks/use-task-colors';
import { CuttingsCard } from '@/components/plant/cuttings-card';
import { HealthChip } from '@/components/plant/health-chip';
import { photoUri } from '@/lib/photos';
import { describeDue, endOfWinter, isWinter } from '@/lib/schedule';
import { useTheme } from '@/theme/theme-provider';

type Undo = { message: string; entryIds: string[] };

const SECTIONS: SectionName[] = ['care', 'about', 'growing', 'problems', 'journal'];

export default function PlantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const theme = useTheme();
  const garden = useGarden();
  const settings = useSettings();
  const today = useToday();
  const journal = useDbQuery(['entry', 'photo'], (d) => listJournal(d, id), [id]);
  const [undo, setUndo] = useState<Undo | null>(null);
  const { scrollRef, register, scrollTo, onScroll, onScrollBeginDrag, onTabsLayout, active } =
    useSections(SECTIONS);
  const lows = useClimateLows();
  const hideUndo = useCallback(() => setUndo(null), []);

  const plant = garden.data?.plants.find((p) => p.id === id);
  if (!garden.data || !settings.data) return <Screen belowHeader>{null}</Screen>;
  if (!plant) {
    // Deleted: leave quietly.
    return <Screen belowHeader>{null}</Screen>;
  }
  const room = garden.data.rooms.find((r) => r.id === plant.roomId);
  const care = careFor(plant.groupId, plant.speciesId);
  const details = detailsFor(plant.groupId);
  const species = getSpecies(plant.speciesId);
  const name = displayName(plant);
  const cover = garden.data.covers.get(plant.id);
  const tasks = buildTasks(garden.data, settings.data.hemisphere, today).filter(
    (t) => t.plant.id === plant.id,
  );
  const schedules = garden.data.schedules.filter((s) => s.plantId === plant.id);
  const photos = (journal.data ?? [])
    .flatMap((e) => e.photos)
    .sort((a, b) => b.takenAt - a.takenAt);

  const log = async (task: Task) => {
    successFeedback();
    const ids = await completeTask(db, [plant.id], task);
    setUndo({ message: doneMessage(task, null, name), entryIds: ids });
  };

  const undoLast = async () => {
    if (!undo) return;
    setUndo(null);
    await deleteEntries(db, undo.entryIds);
  };

  const openPhotos = (photoId?: string) =>
    router.push({ pathname: '/plant/photos/[id]', params: { id: plant.id, photo: photoId ?? '' } });

  const waterTask = tasks.find((t) => t.task === 'water');
  const feedTask = tasks.find((t) => t.task === 'fertilize');
  const waterDays = schedules.find((x) => x.task === 'water')?.intervalDays ?? care.water.days;
  const context: CareContext = {
    waterDays,
    winterWaterDays: Math.max(waterDays, Math.round(waterDays * care.water.winterFactor)),
    nextWater: waterTask ? `next: ${describeDue(waterTask.days).toLowerCase()}` : undefined,
    feedDays: schedules.find((x) => x.task === 'fertilize')?.intervalDays,
    nextFeed: feedTask ? `next: ${describeDue(feedTask.days).toLowerCase()}` : undefined,
    roomFit:
      room && effectiveLight(room) != null
        ? {
            room: room.growLight ? `${room.name} (with its grow light)` : room.name,
            fit: lightFit(effectiveLight(room)!, care.light),
          }
        : undefined,
    spotChecks: room
      ? checkSpot(care, room, {
          lows,
          month: new Date().getMonth(),
          unit: settings.data.temperatureUnit,
          idealMaxC: details?.idealTempC[1],
        })
      : [],
  };
  const description = descriptionFor(plant.speciesId);
  // Watering and feeding always show (even when off); other reminders only while set.
  const builtIn = (task: Task): Schedule =>
    schedules.find((x) => x.task === task) ?? {
      plantId: plant.id,
      task,
      label: null,
      intervalDays: 0,
      enabled: false,
      hintDismissedAt: null,
      startedAt: null,
    };
  const shownSchedules = [
    builtIn('water'),
    builtIn('fertilize'),
    ...schedules.filter((x) => x.task !== 'water' && x.task !== 'fertilize' && x.enabled),
  ];
  const labels = new Map(schedules.map((x) => [x.task, x.label]));
  const suggestions = tasks.filter((t) => t.suggestion != null);

  const tabs = (
    <SectionTabs
      key="tabs"
      sections={SECTIONS}
      active={active}
      onPress={scrollTo}
      onLayout={onTabsLayout}
    />
  );
  const children = [
    <View key="hero" style={styles.hero}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={cover ? 'Open photos' : 'Add a photo'}
        onPress={() => (cover ? openPhotos(cover.id) : addPlantPhoto(db, plant.id))}>
        <PlantAvatar
          photo={cover}
          groupId={plant.groupId}
          speciesId={plant.speciesId}
          size={132}
          radius={Radius.large + 10}
        />
        {!cover && (
          <View style={[styles.cameraBadge, { backgroundColor: theme.tint }]}>
            <Icon name="camera" size={18} color={theme.onTint} />
          </View>
        )}
      </Pressable>
      <View style={styles.heroText}>
        <ThemedText type="title" style={styles.center}>
          {name}
        </ThemedText>
        {species && (
          <ThemedText type="body" color="textSecondary" style={[styles.center, styles.italic]}>
            {plant.nickname ? `${species.common[0]} · ` : ''}
            {species.scientific}
          </ThemedText>
        )}
        {!species && (
          <ThemedText type="body" color="textSecondary" style={styles.center}>
            Cared for like: {care.name}
          </ThemedText>
        )}
        {room && (
          <View style={[styles.roomChip, { backgroundColor: theme.element }]}>
            <Icon name={room.icon} size={16} color={theme.textSecondary} />
            <ThemedText type="caption" color="textSecondary">
              {room.name}
              {room.outdoor ? ' · outdoors' : ''}
            </ThemedText>
          </View>
        )}
        <HealthChip plantId={plant.id} status={garden.data.health.get(plant.id)} />
      </View>
    </View>,
    <View key="actions" style={styles.actions}>
      <QuickAction
        icon="drop"
        label="Watered"
        color={theme.water}
        background={theme.waterSoft}
        onPress={() => log('water')}
      />
      <QuickAction
        icon="flask"
        label="Fed"
        color={theme.fertilize}
        background={theme.fertilizeSoft}
        onPress={() => log('fertilize')}
      />
      <QuickAction
        icon="camera"
        label="Photo"
        color={theme.tint}
        background={theme.tintSoft}
        onPress={() => addPlantPhoto(db, plant.id)}
      />
      <QuickAction
        icon="note-pencil"
        label="Journal"
        color={theme.tint}
        background={theme.tintSoft}
        onPress={() => router.push({ pathname: '/plant/log/[id]', params: { id: plant.id } })}
      />
    </View>,
    suggestions.length > 0 ? (
      <View key="suggestions" style={styles.gap}>
        {suggestions.map((t) => (
          <Card
            key={t.task}
            style={{ backgroundColor: theme.tintSoft, borderColor: 'transparent' }}>
            <View style={styles.suggestion}>
              <Icon name="lightbulb" size={24} color={theme.tint} />
              <ThemedText type="body" style={styles.flex}>
                The soil has been too damp to {t.task === 'water' ? 'water' : 'feed'} three times in
                a row. Change to every {t.suggestion} days?
              </ThemedText>
            </View>
            <View style={styles.suggestionButtons}>
              <Button
                title="Keep as is"
                size="small"
                variant="ghost"
                onPress={() => dismissIntervalHint(db, plant.id, t.task)}
              />
              <Button
                title={`Every ${t.suggestion} days`}
                size="small"
                onPress={() =>
                  setSchedule(db, plant.id, t.task, { intervalDays: t.suggestion!, enabled: true })
                }
              />
            </View>
          </Card>
        ))}
      </View>
    ) : null,
    <Card key="schedule">
      {shownSchedules.map((schedule, i) => (
        <View key={schedule.task} style={styles.gap}>
          {i > 0 && <Divider />}
          <ScheduleLine
            schedule={schedule}
            due={tasks.find((t) => t.task === schedule.task)}
            care={care}
            hemisphere={settings.data!.hemisphere}
            today={today}
            onEdit={() => router.push({ pathname: '/plant/edit/[id]', params: { id: plant.id } })}
          />
        </View>
      ))}
    </Card>,
    <CuttingsCard key="cuttings" plant={plant} garden={garden.data} today={today} />,
    photos.length > 0 ? (
      <View key="photos" style={styles.section}>
        <SectionTitle
          right={
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => openPhotos()}>
              <ThemedText type="label" color="tint">
                See all
              </ThemedText>
            </Pressable>
          }>
          {`Photos (${photos.length})`}
        </SectionTitle>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}>
          {photos.slice(0, 12).map((photo) => (
            <Pressable
              key={photo.id}
              accessibilityRole="imagebutton"
              accessibilityLabel={`Photo from ${formatRelativeDay(dateOf(photo.takenAt), today)}`}
              onPress={() => openPhotos(photo.id)}>
              <Image
                source={{ uri: photoUri(photo.file) }}
                style={[styles.thumb, { backgroundColor: theme.element }]}
                contentFit="cover"
                transition={150}
              />
              <ThemedText type="caption" color="textSecondary" style={styles.thumbDate}>
                {formatRelativeDay(dateOf(photo.takenAt), today)}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    ) : null,
    description ? (
      <ThemedText key="description" type="body">
        {description}
      </ThemedText>
    ) : null,
    <QuickFacts key="facts" care={care} waterDays={waterDays} />,
    tabs,
    <Section key="care" onLayout={register('care')}>
      <CareSection care={care} details={details} context={context} />
    </Section>,
    <Section key="about" title="About" onLayout={register('about')}>
      <AboutSection care={care} details={details} />
    </Section>,
    <Section key="growing" title="Growing" onLayout={register('growing')}>
      <GrowingSection
        care={care}
        details={details}
        unit={settings.data.temperatureUnit}
        lows={lows}
      />
    </Section>,
    <Section key="problems" title="Problems" onLayout={register('problems')}>
      <ProblemsSection details={details} />
    </Section>,
    <Section key="journal" title="Journal" onLayout={register('journal')}>
      <Card>
        {(journal.data ?? []).length === 0 ? (
          <ThemedText type="body" color="textSecondary">
            Waterings, feeds, photos and notes will collect here.
          </ThemedText>
        ) : (
          (journal.data ?? []).slice(0, 40).map((entry, i) => (
            <Animated.View
              key={entry.id}
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              layout={LinearTransition.duration(200)}
              style={styles.gap}>
              {i > 0 && <Divider />}
              <JournalRow entry={entry} today={today} labels={labels} />
            </Animated.View>
          ))
        )}
      </Card>
    </Section>,
  ].filter((child) => child != null);
  const stickyIndex = children.indexOf(tabs);

  return (
    <View style={styles.fill}>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <IconButton
              icon="pencil-simple"
              label="Edit plant"
              onPress={() =>
                router.push({ pathname: '/plant/edit/[id]', params: { id: plant.id } })
              }
            />
          ),
        }}
      />
      <Screen
        belowHeader
        ref={scrollRef}
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        stickyHeaderIndices={[stickyIndex]}>
        {children}
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

function QuickAction({
  icon,
  label,
  color,
  background,
  onPress,
}: {
  icon: IconName;
  label: string;
  color: string;
  background: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
      <View style={[styles.actionIcon, { backgroundColor: background }]}>
        <Icon name={icon} size={26} color={color} />
      </View>
      <ThemedText type="caption">{label}</ThemedText>
    </Pressable>
  );
}

function ScheduleLine({
  schedule,
  due,
  care,
  hemisphere,
  today,
  onEdit,
}: {
  schedule: Schedule;
  due: CareTask | undefined;
  care: Care;
  hemisphere: 'north' | 'south';
  today: string;
  onEdit: () => void;
}) {
  const { task } = schedule;
  const intervalDays = schedule.enabled ? schedule.intervalDays : undefined;
  const { color, soft } = useTaskColors(task);
  let status: string;
  let detail: string;
  if (!due || intervalDays == null) {
    status = 'No reminders';
    detail = task === 'fertilize' && !care.fertilize ? 'Rarely needs feeding' : 'Turned off';
  } else {
    status = describeDue(due.days);
    const winterPause =
      task === 'fertilize' && !(care.fertilize?.winter ?? false) && isWinter(today, hemisphere);
    detail = winterPause
      ? `Resting for winter until ${formatRelativeDay(endOfWinter(today, hemisphere), today)}`
      : `Every ${intervalDays} days${task === 'water' && isWinter(today, hemisphere) && care.water.winterFactor > 1 ? ' (longer in winter)' : ''}`;
    if (due.lastDoneAt)
      detail += ` · last ${formatRelativeDay(dateOf(due.lastDoneAt), today).toLowerCase()}`;
  }
  return (
    <Pressable accessibilityRole="button" onPress={onEdit} style={styles.schedule}>
      <View style={[styles.scheduleIcon, { backgroundColor: soft }]}>
        <Icon name={taskIcon(task)} size={22} color={color} />
      </View>
      <View style={styles.flex}>
        <ThemedText type="label" color="textSecondary">
          {taskLabel(task, schedule.label)}
        </ThemedText>
        <ThemedText type="subheading" style={due && due.days <= 0 ? { color } : undefined}>
          {status}
        </ThemedText>
        <ThemedText type="caption" color="textSecondary">
          {detail}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const PROPAGATION_STAGE: Record<string, string> = {
  started: 'Cutting started',
  rooted: 'Cutting rooted',
  potted: 'Potted up',
};

function JournalRow({
  entry,
  today,
  labels,
}: {
  entry: JournalItem;
  today: string;
  labels: Map<Task, string | null>;
}) {
  const theme = useTheme();
  const color =
    entry.type === 'water'
      ? theme.water
      : entry.type === 'fertilize'
        ? theme.fertilize
        : theme.tint;
  const background =
    entry.type === 'water'
      ? theme.waterSoft
      : entry.type === 'fertilize'
        ? theme.fertilizeSoft
        : theme.tintSoft;
  const skipDays =
    entry.type === 'skip' && typeof entry.data.days === 'number' ? entry.data.days : null;
  const skipTask = typeof entry.data.task === 'string' ? (entry.data.task as Task) : 'water';
  const customTask = taskForEntry(entry.type, entry.data);
  // Entries keep their task's name, so it survives the reminder being removed.
  const savedLabel = typeof entry.data.label === 'string' ? entry.data.label : null;
  const nameOf = (task: Task) => labels.get(task) ?? savedLabel;
  const label =
    entry.type === 'skip'
      ? `Not yet${skipTask !== 'water' ? ` (${taskLabel(skipTask, nameOf(skipTask)).toLowerCase()})` : ''}${skipDays ? ` · check in ${skipDays} ${skipDays === 1 ? 'day' : 'days'}` : ''}`
      : entry.type === 'custom' && customTask
        ? `Done: ${taskLabel(customTask, nameOf(customTask))}`
        : entry.type === 'health' && typeof entry.data.status === 'string'
          ? `Health: ${HEALTH[entry.data.status as HealthStatus]?.label ?? entry.data.status}`
          : entry.type === 'propagation'
            ? (PROPAGATION_STAGE[String(entry.data.stage)] ?? 'Cutting')
            : ENTRY_LABEL[entry.type];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/entry/[id]', params: { id: entry.id } })}
      style={({ pressed }) => [styles.journalRow, pressed && styles.pressed]}>
      <View style={[styles.journalIcon, { backgroundColor: background }]}>
        <Icon name={ENTRY_ICON[entry.type]} size={18} color={color} />
      </View>
      <View style={styles.flex}>
        <View style={styles.journalTop}>
          <ThemedText type="label" style={styles.flex}>
            {label}
          </ThemedText>
          <ThemedText type="caption" color="textSecondary">
            {formatRelativeDay(dateOf(entry.at), today)}, {formatTime(entry.at)}
          </ThemedText>
        </View>
        {entry.note ? <ThemedText type="body">{entry.note}</ThemedText> : null}
        {entry.photos.length > 0 && (
          <View style={styles.journalPhotos}>
            {entry.photos.map((photo) => (
              <Image
                key={photo.id}
                source={{ uri: photoUri(photo.file) }}
                style={[styles.journalThumb, { backgroundColor: theme.element }]}
                contentFit="cover"
              />
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  italic: { fontStyle: 'italic' },
  gap: { gap: Spacing.three },
  pressed: { opacity: 0.7 },
  hero: { alignItems: 'center', gap: Spacing.three },
  heroText: { alignItems: 'center', gap: Spacing.one },
  cameraBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: Spacing.one,
  },
  actions: { flexDirection: 'row', justifyContent: 'space-around' },
  action: { alignItems: 'center', gap: 6, minWidth: 72 },
  actionIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestion: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  suggestionButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two },
  schedule: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  scheduleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { gap: Spacing.three },
  strip: { gap: Spacing.two + 2 },
  thumb: { width: 112, height: 112, borderRadius: Radius.medium },
  thumbDate: { marginTop: 4 },
  fact: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  fit: { borderRadius: Radius.small, padding: Spacing.two + 2, marginLeft: 22 + Spacing.three },
  tip: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 9, marginLeft: 8 },
  journalRow: { flexDirection: 'row', gap: Spacing.three },
  journalIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journalTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 34 },
  journalPhotos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  journalThumb: { width: 84, height: 84, borderRadius: Radius.small },
});
