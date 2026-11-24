import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { careFor, displayName, getGroup, getSpecies, type Care } from '@/catalog';
import { catalogPhoto, descriptionFor, detailsFor } from '@/catalog/media';
import {
  AboutSection,
  CareSection,
  GrowingSection,
  ProblemsSection,
  QuickFacts,
  sectionLines,
  type CareContext,
} from '@/components/care/care-sections';
import { Fold, FoldGroup } from '@/components/fold';
import { Icon, type IconName } from '@/components/icons/icon';
import { Screen, SCREEN_SIDE } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Divider, pressedStyle, SectionTitle } from '@/components/ui';
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
  type Photo,
  type Schedule,
  type Task,
} from '@/db/types';
import { useSharedQuery } from '@/db/use-shared-query';
import { useSettings } from '@/db/use-settings';
import { useClimateLows } from '@/hooks/use-climate';
import { useGarden } from '@/hooks/use-garden';
import { useToday } from '@/hooks/use-today';
import { addPlantPhoto } from '@/lib/add-photo';
import { buildTasks, type CareTask } from '@/lib/care-tasks';
import { dateOf, formatRelativeDay, formatTime } from '@/lib/dates';
import { successFeedback } from '@/lib/haptics';
import { lightFit } from '@/lib/light';
import { checkSpot, effectiveLight, spotOf } from '@/lib/spot';
import { doneMessage, taskForEntry, taskIcon, taskLabel } from '@/lib/tasks';
import { useTaskColors } from '@/hooks/use-task-colors';
import { ArchivedCard } from '@/components/plant/archived-card';
import { CuttingsCard } from '@/components/plant/cuttings-card';
import { HealthChip } from '@/components/plant/health-chip';
import { SharedPotCard } from '@/components/plant/shared-pot-card';
import { photoUri } from '@/lib/photos';
import { describeInterval } from '@/lib/interval';
import { describeDue, endOfWinter, isWinter } from '@/lib/schedule';
import { useTheme } from '@/theme/theme-provider';

type Undo = { message: string; entryIds: string[] };

/** Journal entries shown at first, and added by each "Show older entries". */
const JOURNAL_PAGE = 40;

/** The floating buttons over the cover photo, and the bar that appears behind them. */
const BAR_HEIGHT = 56;
const FLOAT_SIZE = 40;

export default function PlantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const garden = useGarden();
  const settings = useSettings();
  const today = useToday();
  // Shared per plant, so coming back to a plant shows its journal straight away.
  const journal = useSharedQuery(`journal:${id}`, ['entry', 'photo'], (d) => listJournal(d, id));
  const [undo, setUndo] = useState<Undo | null>(null);
  // Care, About, Growing, Problems and Journal start closed.
  const [openFolds, setOpenFolds] = useState<string[]>([]);
  // The journal shows its newest entries first; "Show older" adds a page at a time.
  const [journalShown, setJournalShown] = useState(JOURNAL_PAGE);
  // Scrolled past the cover photo: a solid bar appears behind the floating buttons.
  const [pastCover, setPastCover] = useState(false);
  // Ignores a second tap on Watered / Fed while the first is still being saved.
  const logging = useRef(false);
  const lows = useClimateLows();
  const hideUndo = useCallback(() => setUndo(null), []);

  const coverHeight = Math.round(Math.min(Math.max(width * 0.85, 280), 420));
  // Light status bar icons over the photo; the theme's own once the bar covers it.
  const lightIcons = !pastCover;
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(lightIcons ? 'light' : theme.dark ? 'light' : 'dark', true);
      return () => setStatusBarStyle(theme.dark ? 'light' : 'dark', true);
    }, [lightIcons, theme.dark]),
  );

  const plant =
    garden.data?.plants.find((p) => p.id === id) ?? garden.data?.archived.find((p) => p.id === id);
  if (!garden.data || !settings.data || !plant) {
    // Still loading, or deleted: leave quietly.
    return <Screen>{null}</Screen>;
  }
  const isArchived = plant.archivedAt != null;
  const roomRow = garden.data.rooms.find((r) => r.id === plant.roomId);
  // The room, with anything set differently for this plant.
  const room = roomRow && spotOf(roomRow, plant);
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
    if (logging.current) return;
    logging.current = true;
    try {
      successFeedback();
      const ids = await completeTask(db, [plant.id], task);
      const others = ids.length - 1;
      setUndo({
        message:
          others > 0
            ? `${doneMessage(task, null, name)} and ${others === 1 ? 'its pot-mate' : `${others} pot-mates`}`
            : doneMessage(task, null, name),
        entryIds: ids,
      });
    } finally {
      logging.current = false;
    }
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
            room: room.ownLight
              ? room.growLight
                ? 'Its spot (with a grow light)'
                : 'Its spot'
              : room.growLight
                ? `${room.name} (with its grow light)`
                : room.name,
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

  const lines = sectionLines(care, details, context, settings.data.temperatureUnit);
  const entries = journal.data ?? [];
  const fold = (key: string, title: string, line: { text: string; alert?: boolean }) => ({
    title,
    summary: line.text,
    alert: line.alert,
    open: openFolds.includes(key),
    onToggle: () =>
      setOpenFolds((o) => (o.includes(key) ? o.filter((k) => k !== key) : [...o, key])),
  });
  const editPlant = () => router.push({ pathname: '/plant/edit/[id]', params: { id: plant.id } });

  const descriptionText = description ? <ThemedText type="body">{description}</ThemedText> : null;

  const journalFold = (
    <Fold
      {...fold('journal', 'Journal', {
        text: entries.length
          ? `${entries.length === 1 ? '1 entry' : `${entries.length} entries`} · latest ${formatRelativeDay(dateOf(entries[0].at), today).toLowerCase()}`
          : 'Nothing yet',
      })}>
      <Card>
        {entries.length === 0 ? (
          <ThemedText type="body" color="textSecondary">
            Waterings, feeds, photos and notes will collect here.
          </ThemedText>
        ) : (
          entries.slice(0, journalShown).map((entry, i) => (
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
        {entries.length > journalShown && (
          <Animated.View layout={LinearTransition.duration(200)}>
            <Button
              title={`Show older entries (${entries.length - journalShown} more)`}
              size="small"
              variant="ghost"
              onPress={() => setJournalShown((n) => n + JOURNAL_PAGE)}
            />
          </Animated.View>
        )}
      </Card>
    </Fold>
  );

  const roomChip = room ? (
    <View style={[styles.roomChip, { backgroundColor: theme.element }]}>
      <Icon name={room.icon} size={16} color={theme.textSecondary} />
      <ThemedText type="caption" color="textSecondary">
        {room.name}
        {room.outdoor ? (plant.inGround ? ' · in the ground' : ' · outdoors') : ''}
      </ThemedText>
    </View>
  ) : null;

  const children = [
    // The cover photo, edge to edge, fading into the page.
    <Pressable
      key="cover"
      accessibilityRole="button"
      accessibilityLabel={cover ? 'Open photos' : 'Add a photo'}
      onPress={() => (cover ? openPhotos(cover.id) : addPlantPhoto(db, plant.id))}
      style={[styles.cover, { height: coverHeight }]}>
      <Cover
        photo={cover}
        groupId={plant.groupId}
        speciesId={plant.speciesId}
        width={width}
        height={coverHeight}
      />
      <Svg style={StyleSheet.absoluteFill} width={width} height={coverHeight} pointerEvents="none">
        <Defs>
          <LinearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000000" stopOpacity={0.4} />
            <Stop offset="1" stopColor="#000000" stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.background} stopOpacity={0} />
            <Stop offset="1" stopColor={theme.background} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        {/* Keeps the status bar and the floating buttons readable on bright photos. */}
        <Rect x={0} y={0} width={width} height={insets.top + BAR_HEIGHT + 24} fill="url(#shade)" />
        <Rect
          x={0}
          y={coverHeight * 0.62}
          width={width}
          height={coverHeight * 0.38 + 1}
          fill="url(#fade)"
        />
      </Svg>
    </Pressable>,
    <View key="name" style={styles.nameBlock}>
      <ThemedText type="title" accessibilityRole="header">
        {name}
      </ThemedText>
      {species ? (
        <ThemedText type="body" color="textSecondary">
          {plant.nickname ? `${species.common[0]} · ` : ''}
          <ThemedText type="body" color="textSecondary" style={styles.italic}>
            {species.scientific}
          </ThemedText>
        </ThemedText>
      ) : (
        <ThemedText type="body" color="textSecondary">
          Cared for like: {care.name}
        </ThemedText>
      )}
      <View style={styles.chips}>
        {isArchived ? (
          roomChip
        ) : (
          <HealthChip
            plantId={plant.id}
            status={garden.data.health.get(plant.id)}
            leading={roomChip}
          />
        )}
      </View>
    </View>,
    isArchived ? <ArchivedCard key="archived" plant={plant} /> : null,

    // Care now: quick actions, what's due, and anything this plant is part of.
    isArchived ? null : (
      <View key="care" style={styles.zone}>
        <SectionTitle>Care</SectionTitle>
        <View style={styles.actions}>
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
        </View>
        {suggestions.map((t) => (
          <Card key={t.task} tone="tip">
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
        <Card>
          {shownSchedules.map((schedule, i) => (
            <View key={schedule.task} style={styles.gap}>
              {i > 0 && <Divider />}
              <ScheduleLine
                schedule={schedule}
                due={tasks.find((t) => t.task === schedule.task)}
                care={care}
                hemisphere={settings.data!.hemisphere}
                today={today}
                onEdit={editPlant}
              />
            </View>
          ))}
        </Card>
        {plant.sharedPot ? <SharedPotCard plant={plant} garden={garden.data} /> : null}
        <CuttingsCard plant={plant} garden={garden.data} today={today} />
      </View>
    ),

    // Its story: photos and the journal.
    <View key="story" style={styles.zone}>
      <SectionTitle
        right={
          photos.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={12}
              onPress={() => openPhotos()}
              style={({ pressed }) => [styles.seeAll, pressed && pressedStyle]}>
              <ThemedText type="label" color="tint">
                {`See all ${photos.length}`}
              </ThemedText>
            </Pressable>
          ) : undefined
        }>
        Photos and journal
      </SectionTitle>
      {photos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.stripScroll}
          contentContainerStyle={styles.strip}>
          {photos.slice(0, 12).map((photo) => (
            <Pressable
              key={photo.id}
              accessibilityRole="imagebutton"
              accessibilityLabel={`Photo from ${formatRelativeDay(dateOf(photo.takenAt), today)}`}
              onPress={() => openPhotos(photo.id)}>
              <Image
                cachePolicy="memory-disk"
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
      )}
      {journalFold}
    </View>,

    // Reference: what the plant is and how to grow it. An archived plant keeps its story only.
    isArchived ? (
      descriptionText ? (
        <View key="about" style={styles.zone}>
          <SectionTitle>About this plant</SectionTitle>
          {descriptionText}
        </View>
      ) : null
    ) : (
      <View key="about" style={styles.zone}>
        <SectionTitle>About this plant</SectionTitle>
        <QuickFacts care={care} waterDays={waterDays} />
        <FoldGroup>
          {[
            <Fold key="about" grouped {...fold('about', 'About', lines.about)}>
              {descriptionText}
              <AboutSection care={care} details={details} />
            </Fold>,
            <Fold key="care" grouped {...fold('care', 'Care', lines.care)}>
              <CareSection care={care} details={details} context={context} />
            </Fold>,
            <Fold key="growing" grouped {...fold('growing', 'Growing', lines.growing)}>
              <GrowingSection
                care={care}
                details={details}
                unit={settings.data.temperatureUnit}
                lows={lows}
              />
            </Fold>,
            <Fold key="problems" grouped {...fold('problems', 'Problems', lines.problems)}>
              <ProblemsSection details={details} />
            </Fold>,
          ]}
        </FoldGroup>
      </View>
    ),
  ].filter((child) => child != null);

  // Over the photo the buttons are dark glass with white icons; once the bar is behind
  // them they take the page's own colors.
  const floatBg = pastCover ? theme.element : 'rgba(0,0,0,0.38)';
  const floatInk = pastCover ? theme.text : '#FFFFFF';
  const pastAt = coverHeight - insets.top - BAR_HEIGHT;

  return (
    <View style={styles.fill}>
      <Screen
        bleed
        onScroll={(e) => {
          const past = e.nativeEvent.contentOffset.y > pastAt;
          if (past !== pastCover) setPastCover(past);
        }}>
        {children}
      </Screen>
      {pastCover && (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(180)}
          pointerEvents="none"
          style={[
            styles.bar,
            {
              height: insets.top + BAR_HEIGHT,
              backgroundColor: theme.background,
              borderBottomColor: theme.border,
            },
          ]}>
          <ThemedText type="heading" numberOfLines={1} style={styles.barTitle}>
            {name}
          </ThemedText>
        </Animated.View>
      )}
      <View style={[styles.floats, { top: insets.top + (BAR_HEIGHT - FLOAT_SIZE) / 2 }]}>
        <FloatButton
          icon="caret-left"
          label="Back"
          bg={floatBg}
          ink={floatInk}
          // Opened from a reminder there may be nothing behind it: go to Today then.
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
        <View style={styles.flex} />
        {!isArchived && (
          <FloatButton
            icon="camera"
            label="Add a photo"
            bg={floatBg}
            ink={floatInk}
            onPress={() => addPlantPhoto(db, plant.id)}
          />
        )}
        {!isArchived && (
          <FloatButton
            icon="pencil-simple"
            label="Edit plant"
            bg={floatBg}
            ink={floatInk}
            onPress={editPlant}
          />
        )}
      </View>
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

/** The plant's own photo, the catalog's photo of its species, or its group's icon on a tint. */
function Cover({
  photo,
  groupId,
  speciesId,
  width,
  height,
}: {
  photo: Photo | null | undefined;
  groupId: string;
  speciesId: string | null;
  width: number;
  height: number;
}) {
  const theme = useTheme();
  const size = { width, height };
  if (photo) {
    return (
      <Image
        cachePolicy="memory-disk"
        source={{ uri: photoUri(photo.file) }}
        style={[size, { backgroundColor: theme.element }]}
        contentFit="cover"
        transition={180}
        accessible={false}
      />
    );
  }
  const fallback = catalogPhoto(speciesId);
  if (fallback) {
    return (
      <Image
        cachePolicy="memory-disk"
        source={fallback.image}
        style={[size, { backgroundColor: theme.element }]}
        contentFit="cover"
        transition={180}
        accessible={false}
      />
    );
  }
  return (
    <View style={[size, styles.coverEmpty, { backgroundColor: theme.tintSoft }]}>
      <Icon name={getGroup(groupId).icon} size={Math.round(height * 0.32)} color={theme.tint} />
    </View>
  );
}

/** A round button floating over the cover photo. */
function FloatButton({
  icon,
  label,
  bg,
  ink,
  onPress,
}: {
  icon: IconName;
  label: string;
  bg: string;
  ink: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [styles.float, { backgroundColor: bg }, pressed && pressedStyle]}>
      <Icon name={icon} size={22} color={ink} duotone={false} />
    </Pressable>
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
      : `${describeInterval(intervalDays)}${task === 'water' && isWinter(today, hemisphere) && care.water.winterFactor > 1 ? ' (longer in winter)' : ''}`;
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
                cachePolicy="memory-disk"
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
  italic: { fontStyle: 'italic' },
  gap: { gap: Spacing.three },
  pressed: pressedStyle,
  cover: {
    marginHorizontal: -SCREEN_SIDE,
    // The name sits on the faded bottom of the photo.
    marginBottom: -Spacing.five - Spacing.two,
    overflow: 'hidden',
  },
  coverEmpty: { alignItems: 'center', justifyContent: 'center' },
  nameBlock: { gap: Spacing.one },
  chips: { marginTop: Spacing.two },
  roomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  zone: { gap: Spacing.three, marginTop: Spacing.two },
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },
  barTitle: {
    height: BAR_HEIGHT,
    lineHeight: BAR_HEIGHT,
    marginHorizontal: SCREEN_SIDE + FLOAT_SIZE + Spacing.three,
  },
  floats: {
    position: 'absolute',
    left: SCREEN_SIDE - Spacing.one,
    right: SCREEN_SIDE - Spacing.one,
    flexDirection: 'row',
    gap: Spacing.two,
  },
  float: {
    width: FLOAT_SIZE,
    height: FLOAT_SIZE,
    borderRadius: FLOAT_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeAll: { minHeight: 32, justifyContent: 'center' },
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
  // The strip runs to the screen edges and scrolls under them.
  stripScroll: { marginHorizontal: -SCREEN_SIDE },
  strip: { gap: Spacing.two + 2, paddingHorizontal: SCREEN_SIDE },
  thumb: { width: 112, height: 112, borderRadius: Radius.medium },
  thumbDate: { marginTop: 4 },
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
