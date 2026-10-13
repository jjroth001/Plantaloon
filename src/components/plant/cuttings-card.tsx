import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Pressable, StyleSheet, View } from 'react-native';

import { careFor, displayName } from '@/catalog';
import { getGuide } from '@/catalog/media';
import { Icon } from '@/components/icons/icon';
import { PlantAvatar } from '@/components/plant-avatar';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Divider } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { advanceCutting, removeSchedule, setSchedule, type Garden } from '@/db/garden';
import type { Plant } from '@/db/types';
import { formatRelativeDay, dateOf } from '@/lib/dates';
import { successFeedback } from '@/lib/haptics';
import { suggestedWaterDays } from '@/lib/schedule';
import { useTheme } from '@/theme/theme-provider';

export const CHANGE_WATER = 'Change the water';

const STAGE_TEXT = {
  rooting: {
    title: 'Growing roots',
    next: 'It has roots',
    hint: 'Roots usually show in 2–6 weeks.',
  },
  rooted: {
    title: 'Rooted',
    next: 'Potted up',
    hint: 'Once roots are a few centimetres long, plant it in a small pot.',
  },
} as const;

/**
 * Cuttings: for a plant, its cuttings in progress and a way to start one; for a cutting, how
 * far along it is and the next step. Once potted up it becomes an ordinary plant.
 */
export function CuttingsCard({
  plant,
  garden,
  today,
}: {
  plant: Plant;
  garden: Garden;
  today: string;
}) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const parent = plant.parentId ? garden.plants.find((p) => p.id === plant.parentId) : undefined;
  const children = garden.plants.filter((p) => p.parentId === plant.id);

  if (plant.propStage) {
    const stage = STAGE_TEXT[plant.propStage];
    const method = plant.propMethod ? getGuide(plant.propMethod) : undefined;

    const next = async () => {
      successFeedback();
      if (plant.propStage === 'rooting') {
        await advanceCutting(db, plant.id, 'rooted');
        return;
      }
      await advanceCutting(db, plant.id, 'potted');
      // A potted cutting gets the normal care schedule for its kind.
      const care = careFor(plant.groupId, plant.speciesId);
      await setSchedule(db, plant.id, 'water', {
        intervalDays: suggestedWaterDays(care.water.days, 's', plant.potMaterial),
        enabled: true,
      });
      await setSchedule(db, plant.id, 'fertilize', {
        intervalDays: care.fertilize?.days ?? 30,
        enabled: care.fertilize != null,
      });
      for (const s of garden.schedules) {
        if (s.plantId === plant.id && s.label === CHANGE_WATER)
          await removeSchedule(db, plant.id, s.task);
      }
    };

    return (
      <Card style={{ backgroundColor: theme.tintSoft, borderColor: 'transparent' }}>
        <View style={styles.row}>
          <Icon name="scissors" size={26} color={theme.tint} />
          <View style={styles.flex}>
            <ThemedText type="subheading">Cutting: {stage.title}</ThemedText>
            <ThemedText type="caption" color="textSecondary">
              {method ? `${method.title} · ` : ''}
              started {formatRelativeDay(dateOf(plant.createdAt), today).toLowerCase()}
            </ThemedText>
          </View>
        </View>
        <ThemedText type="body">{stage.hint}</ThemedText>
        <View style={styles.buttons}>
          {method && (
            <Button
              title="How to"
              size="small"
              variant="ghost"
              onPress={() => router.push({ pathname: '/guide/[id]', params: { id: method.id } })}
            />
          )}
          <Button title={stage.next} icon="check" size="small" onPress={next} />
        </View>
        {parent && (
          <ThemedText type="caption" color="textSecondary">
            From {displayName(parent)}
          </ThemedText>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <View style={styles.row}>
        <ThemedText type="subheading" style={styles.flex}>
          Cuttings
        </ThemedText>
        <Button
          title="Start a cutting"
          icon="scissors"
          size="small"
          variant="secondary"
          onPress={() => router.push({ pathname: '/plant/cutting/[id]', params: { id: plant.id } })}
        />
      </View>
      {parent && (
        <ThemedText type="caption" color="textSecondary">
          Grown from a cutting of {displayName(parent)}
        </ThemedText>
      )}
      {children.length === 0 ? (
        <ThemedText type="caption" color="textSecondary">
          Take a cutting to grow a new plant from this one, and follow it from rooting to potting.
        </ThemedText>
      ) : (
        children.map((child, i) => (
          <View key={child.id} style={styles.gap}>
            {i > 0 && <Divider />}
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/plant/[id]', params: { id: child.id } })}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
              <PlantAvatar
                photo={garden.covers.get(child.id)}
                groupId={child.groupId}
                speciesId={child.speciesId}
                size={36}
              />
              <ThemedText style={styles.flex} numberOfLines={1}>
                {displayName(child)}
              </ThemedText>
              <ThemedText type="caption" color="textSecondary">
                {child.propStage ? STAGE_TEXT[child.propStage].title : 'Potted'}
              </ThemedText>
            </Pressable>
          </View>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two },
});
