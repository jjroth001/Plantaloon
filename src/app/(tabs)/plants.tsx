import { router } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { displayName, getSpecies } from '@/catalog';
import { Icon } from '@/components/icons/icon';
import { PlantAvatar } from '@/components/plant-avatar';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button, EmptyState, IconButton } from '@/components/ui';
import { PRESSED_OPACITY, Radius, Spacing } from '@/constants/theme';
import { useSettings } from '@/db/use-settings';
import { useGarden } from '@/hooks/use-garden';
import { useToday } from '@/hooks/use-today';
import { buildTasks, type CareTask } from '@/lib/care-tasks';
import { LIGHT_LABEL } from '@/lib/light';
import { describeDue } from '@/lib/schedule';
import { useTheme } from '@/theme/theme-provider';

const GAP = Spacing.three;
const SIDE = Spacing.three + Spacing.one;

export default function PlantsScreen() {
  const theme = useTheme();
  const garden = useGarden();
  const settings = useSettings();
  const today = useToday();
  const { width } = useWindowDimensions();
  const columns = width >= 600 ? 3 : 2;
  const cardWidth = (width - SIDE * 2 - GAP * (columns - 1)) / columns;

  const header = (
    <IconButton
      icon="plus"
      label="Add a plant"
      onPress={() => router.push('/add')}
      background={theme.tint}
      color={theme.onTint}
    />
  );
  // Labelled, so there's nothing to guess.
  const shortcuts = (
    <View style={styles.shortcuts}>
      <Button
        title="Rooms"
        icon="house"
        size="small"
        variant="secondary"
        onPress={() => router.push('/rooms')}
      />
      <Button
        title="Wishlist"
        icon="heart"
        size="small"
        variant="secondary"
        onPress={() => router.push('/wishlist')}
      />
      {(garden.data?.archived.length ?? 0) > 0 && (
        <Button
          title="Archive"
          icon="archive"
          size="small"
          variant="secondary"
          onPress={() => router.push('/archive')}
        />
      )}
    </View>
  );

  if (!garden.data || !settings.data) return <Screen title="Plants">{null}</Screen>;
  const { rooms, plants } = garden.data;
  const tasks = buildTasks(garden.data, settings.data.hemisphere, today);
  // Late is a heads-up (warning), due today is water blue, later is quiet.
  const dueColor = (days: number) =>
    days < 0 ? theme.warning : days === 0 ? theme.water : theme.textSecondary;
  const nextWater = new Map<string, CareTask>();
  for (const t of tasks)
    if (t.task === 'water' && !nextWater.has(t.plant.id)) nextWater.set(t.plant.id, t);

  return (
    <Screen title="Plants" titleAccessory={header}>
      {shortcuts}
      {plants.length === 0 ? (
        <EmptyState
          icon="plant"
          title="Your plants live here"
          body="Add a plant to see it here, grouped by the room it lives in."
          action={<Button title="Add a plant" icon="plus" onPress={() => router.push('/add')} />}
        />
      ) : (
        rooms.map((room) => {
          const inRoom = plants
            .filter((p) => p.roomId === room.id)
            .map((p) => ({ plant: p, name: displayName(p), task: nextWater.get(p.id) }))
            .sort((a, b) => a.name.localeCompare(b.name));
          if (inRoom.length === 0) return null;
          return (
            <View key={room.id} style={styles.room}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${room.name}, edit room`}
                onPress={() => router.push({ pathname: '/room/[id]', params: { id: room.id } })}
                style={styles.roomHeader}>
                <Icon name={room.icon} size={22} color={theme.textSecondary} />
                <ThemedText type="section" style={styles.flex}>
                  {room.name}
                </ThemedText>
                {room.lightTier && (
                  <View style={[styles.badge, { backgroundColor: theme.element }]}>
                    <Icon name="sun" size={14} color={theme.textSecondary} duotone={false} />
                    <ThemedText type="caption" color="textSecondary">
                      {LIGHT_LABEL[room.lightTier]}
                    </ThemedText>
                  </View>
                )}
              </Pressable>
              <View style={styles.grid}>
                {inRoom.map(({ plant, name, task }) => (
                  <Pressable
                    key={plant.id}
                    accessibilityRole="button"
                    onPress={() =>
                      router.push({ pathname: '/plant/[id]', params: { id: plant.id } })
                    }
                    style={({ pressed }) => [
                      styles.card,
                      { width: cardWidth, backgroundColor: theme.card, borderColor: theme.border },
                      pressed && styles.pressed,
                    ]}>
                    <PlantAvatar
                      photo={garden.data!.covers.get(plant.id)}
                      groupId={plant.groupId}
                      speciesId={plant.speciesId}
                      size={cardWidth}
                      radius={0}
                    />
                    <View style={styles.cardText}>
                      <ThemedText type="name" numberOfLines={1}>
                        {name}
                      </ThemedText>
                      <ThemedText
                        type="caption"
                        color="textSecondary"
                        numberOfLines={1}
                        style={!plant.nickname && styles.italic}>
                        {plant.nickname
                          ? (getSpecies(plant.speciesId)?.common[0] ?? ' ')
                          : (getSpecies(plant.speciesId)?.scientific ?? ' ')}
                      </ThemedText>
                      {plant.sharedPot && (
                        <View style={styles.due}>
                          <Icon
                            name="potted-plant"
                            size={13}
                            color={theme.textSecondary}
                            duotone={false}
                          />
                          <ThemedText type="caption" color="textSecondary">
                            Shared pot
                          </ThemedText>
                        </View>
                      )}
                      {plant.propStage && (
                        <View style={styles.due}>
                          <Icon name="scissors" size={13} color={theme.tint} duotone={false} />
                          <ThemedText type="caption" style={{ color: theme.tint }}>
                            {plant.propStage === 'rooting'
                              ? 'Cutting · rooting'
                              : 'Cutting · rooted'}
                          </ThemedText>
                        </View>
                      )}
                      {!plant.propStage && task && (
                        <View style={styles.due}>
                          <Icon name="drop" size={13} color={dueColor(task.days)} duotone={false} />
                          <ThemedText
                            type="caption"
                            style={{
                              color: dueColor(task.days),
                              fontWeight: task.days <= 0 ? 600 : 500,
                            }}>
                            {describeDue(task.days)}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  shortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: -Spacing.two },
  italic: { fontStyle: 'italic' },
  room: { gap: Spacing.three },
  roomHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 48 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  card: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
  },
  cardText: { padding: Spacing.three, paddingTop: Spacing.two + 2, gap: 1 },
  due: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  pressed: { opacity: PRESSED_OPACITY },
});
