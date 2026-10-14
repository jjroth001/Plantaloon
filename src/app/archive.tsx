import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { displayName } from '@/catalog';
import { Icon } from '@/components/icons/icon';
import { PlantAvatar } from '@/components/plant-avatar';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Card, Divider, EmptyState } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { ARCHIVE_REASON } from '@/db/types';
import { useGarden } from '@/hooks/use-garden';
import { dateOf, formatLongDate } from '@/lib/dates';
import { useTheme } from '@/theme/theme-provider';

/** Plants that died, were given away or otherwise moved on. */
export default function ArchiveScreen() {
  const theme = useTheme();
  const garden = useGarden();

  if (!garden.data) return <Screen belowHeader>{null}</Screen>;
  const { archived } = garden.data;

  return (
    <Screen belowHeader>
      {archived.length === 0 ? (
        <EmptyState
          icon="archive"
          title="Nothing in the archive"
          body="When a plant dies or you give it away, move it here from Edit plant. Its journal and photos are kept."
        />
      ) : (
        <>
          <ThemedText type="body" color="textSecondary">
            These plants get no reminders. Their journals and photos are kept here.
          </ThemedText>
          <Card>
            {archived.map((plant, i) => (
              <View key={plant.id} style={styles.gap}>
                {i > 0 && <Divider />}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: '/plant/[id]', params: { id: plant.id } })}
                  style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
                  <PlantAvatar
                    photo={garden.data!.covers.get(plant.id)}
                    groupId={plant.groupId}
                    speciesId={plant.speciesId}
                    size={44}
                  />
                  <View style={styles.flex}>
                    <ThemedText numberOfLines={1}>{displayName(plant)}</ThemedText>
                    <ThemedText type="caption" color="textSecondary" numberOfLines={1}>
                      {plant.archiveReason ? ARCHIVE_REASON[plant.archiveReason] : 'Archived'}
                      {plant.archivedAt != null
                        ? ` · ${formatLongDate(dateOf(plant.archivedAt))}`
                        : ''}
                    </ThemedText>
                  </View>
                  <Icon name="caret-right" size={18} color={theme.textSecondary} duotone={false} />
                </Pressable>
              </View>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
});
