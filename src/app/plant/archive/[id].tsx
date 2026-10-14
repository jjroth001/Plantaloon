import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { displayName } from '@/catalog';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button, Chip, Field, TextField } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { archivePlant, getPlant } from '@/db/garden';
import { ARCHIVE_REASON, type ArchiveReason } from '@/db/types';
import { useDbQuery } from '@/db/use-db-query';
import { successFeedback } from '@/lib/haptics';

const REASONS = Object.keys(ARCHIVE_REASON) as ArchiveReason[];

/** Moves a plant to the archive, with why. */
export default function ArchivePlant() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const plant = useDbQuery([], (d) => getPlant(d, id), [id]).data;
  const [reason, setReason] = useState<ArchiveReason>('died');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  if (!plant) return <Screen belowHeader>{null}</Screen>;
  const name = displayName(plant);

  const save = async () => {
    setBusy(true);
    try {
      await archivePlant(db, plant.id, { reason, note });
      successFeedback();
      router.dismissAll();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      belowHeader
      footer={<Button title="Move to archive" icon="archive" onPress={save} busy={busy} />}>
      <ThemedText type="body" color="textSecondary">
        {name} stops getting reminders and leaves your plant list. Its journal and photos are kept
        in the archive, and you can bring it back any time.
      </ThemedText>
      <Field label="What happened">
        <View style={styles.chips}>
          {REASONS.map((r) => (
            <Chip
              key={r}
              label={ARCHIVE_REASON[r]}
              selected={reason === r}
              onPress={() => setReason(r)}
            />
          ))}
        </View>
      </Field>
      <TextField
        label="Note (optional)"
        value={note}
        onChangeText={setNote}
        placeholder={
          reason === 'died'
            ? 'What you think went wrong, for next time'
            : reason === 'gave_away'
              ? 'Who it went to'
              : 'Anything to remember'
        }
        multiline
        maxLength={500}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
