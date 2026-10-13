import { router } from 'expo-router';
import { Directory, Paths } from 'expo-file-system';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button, TextField } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { eraseAllData } from '@/db/backup';
import { setSetting } from '@/db/settings';
import { useGarden } from '@/hooks/use-garden';
import { shareBackup } from '@/lib/data-transfer';
import { syncReminders } from '@/lib/notifications';

const CONFIRM_WORD = 'DELETE';

/** "Start over": deletes every plant, room, photo and setting. Typing DELETE guards it. */
export default function EraseScreen() {
  const db = useSQLiteContext();
  const garden = useGarden();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const confirmed = typed.trim().toUpperCase() === CONFIRM_WORD;
  const plants = garden.data?.plants.length ?? 0;

  const backUpFirst = async () => {
    try {
      await shareBackup(db);
      await setSetting(db, 'lastBackupAt', Date.now());
    } catch (error) {
      Alert.alert('Backup failed', (error as Error).message);
    }
  };

  const erase = async () => {
    setBusy(true);
    try {
      await syncReminders([]).catch(() => {});
      router.dismissAll();
      try {
        await eraseAllData(db);
      } finally {
        const photos = new Directory(Paths.document, 'photos');
        if (photos.exists) photos.delete();
      }
      // With settings gone the app returns to the welcome screen by itself.
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen belowHeader>
      <View style={styles.group}>
        <ThemedText type="heading">Erase everything?</ThemedText>
        <ThemedText type="body">
          This permanently deletes all {plants} {plants === 1 ? 'plant' : 'plants'}, their journals
          and photos, your rooms and settings from this phone. It can’t be undone.
        </ThemedText>
        <ThemedText type="body" color="textSecondary">
          Make a backup first if you might want them again.
        </ThemedText>
      </View>
      <Button
        title="Back up first"
        icon="upload-simple"
        variant="secondary"
        onPress={backUpFirst}
      />
      <TextField
        label={`Type ${CONFIRM_WORD} to confirm`}
        value={typed}
        onChangeText={setTyped}
        placeholder={CONFIRM_WORD}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
      />
      <Button
        title="Erase all data"
        icon="trash"
        variant="danger"
        disabled={!confirmed}
        busy={busy}
        onPress={erase}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.two },
});
