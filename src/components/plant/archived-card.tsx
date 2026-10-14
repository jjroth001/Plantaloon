import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, StyleSheet, View } from 'react-native';

import { displayName } from '@/catalog';
import { Icon } from '@/components/icons/icon';
import { ThemedText } from '@/components/themed-text';
import { Button, Card } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { deletePlant, restorePlant } from '@/db/garden';
import { ARCHIVE_REASON, type Plant } from '@/db/types';
import { dateOf, formatLongDate } from '@/lib/dates';
import { successFeedback } from '@/lib/haptics';
import { deletePhotoFiles } from '@/lib/photos';
import { useTheme } from '@/theme/theme-provider';

/** On an archived plant's page: what happened, and a way back (or out for good). */
export function ArchivedCard({ plant }: { plant: Plant }) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const name = displayName(plant);

  const remove = () =>
    Alert.alert(
      `Delete ${name} for good?`,
      'Its journal and photos are deleted too. This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const files = await deletePlant(db, plant.id);
            deletePhotoFiles(files);
            router.back();
          },
        },
      ],
    );

  return (
    <Card style={{ backgroundColor: theme.element, borderColor: 'transparent' }}>
      <View style={styles.row}>
        <Icon name="archive" size={24} color={theme.textSecondary} />
        <View style={styles.flex}>
          <ThemedText type="subheading">
            {plant.archiveReason ? ARCHIVE_REASON[plant.archiveReason] : 'In the archive'}
          </ThemedText>
          {plant.archivedAt != null && (
            <ThemedText type="caption" color="textSecondary">
              Archived {formatLongDate(dateOf(plant.archivedAt))}
            </ThemedText>
          )}
        </View>
      </View>
      {plant.archiveNote && <ThemedText type="body">{plant.archiveNote}</ThemedText>}
      <View style={styles.buttons}>
        <Button title="Delete for good" size="small" variant="ghost" onPress={remove} />
        <Button
          title="Bring it back"
          icon="arrow-counter-clockwise"
          size="small"
          onPress={async () => {
            await restorePlant(db, plant.id);
            successFeedback();
          }}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two },
});
