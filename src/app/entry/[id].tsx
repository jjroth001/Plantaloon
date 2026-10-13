import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert } from 'react-native';

import { EntryForm, onDay, type EntryFormValue } from '@/components/entry-form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { deleteEntries, getEntry, updateEntry } from '@/db/garden';
import { LOGGABLE, type EntryType } from '@/db/types';
import { useDbQuery } from '@/db/use-db-query';
import { dateOf } from '@/lib/dates';
import { deletePhotoFiles } from '@/lib/photos';

/** Edit or delete a journal entry. */
export default function EditEntry() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const entry = useDbQuery([], (d) => getEntry(d, id), [id]);
  const [form, setForm] = useState<EntryFormValue | null>(null);
  const [busy, setBusy] = useState(false);

  const e = entry.data;
  if (!e) return <Screen belowHeader>{null}</Screen>;
  const value: EntryFormValue = form ?? { type: e.type, day: dateOf(e.at), note: e.note ?? '' };
  // "Not yet" and photo entries keep their type; the rest can switch between loggable types.
  const fixedType = !LOGGABLE.includes(e.type);
  const types: readonly EntryType[] = fixedType ? [e.type] : LOGGABLE;

  const save = async () => {
    setBusy(true);
    try {
      await updateEntry(db, e.id, {
        type: value.type,
        at: onDay(e.at, value.day),
        note: value.note,
      });
      router.back();
    } finally {
      setBusy(false);
    }
  };

  const remove = () =>
    Alert.alert('Delete this entry?', 'Any photos in it are deleted too.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          deletePhotoFiles(await deleteEntries(db, [e.id]));
          router.back();
        },
      },
    ]);

  return (
    <Screen belowHeader footer={<Button title="Save" icon="check" onPress={save} busy={busy} />}>
      {e.type === 'skip' && (
        <ThemedText type="body" color="textSecondary">
          You checked this plant and it didn’t need care yet. Deleting this brings the reminder
          back.
        </ThemedText>
      )}
      {e.type === 'custom' && typeof e.data.label === 'string' && (
        <ThemedText type="subheading">Done: {e.data.label}</ThemedText>
      )}
      <EntryForm value={value} onChange={setForm} types={types} />
      <Button title="Delete entry" icon="trash" variant="ghost" onPress={remove} />
    </Screen>
  );
}
