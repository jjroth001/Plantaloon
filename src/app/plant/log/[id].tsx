import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EntryForm, onDay, type EntryFormValue } from '@/components/entry-form';
import { Icon } from '@/components/icons/icon';
import { Screen } from '@/components/screen';
import { Button, Field } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { addEntry, addPhoto } from '@/db/garden';
import { choosePhoto } from '@/lib/add-photo';
import { todayString } from '@/lib/dates';
import { successFeedback } from '@/lib/haptics';
import { deletePhotoFiles, photoUri, type StoredPhoto } from '@/lib/photos';
import { useTheme } from '@/theme/theme-provider';

/** Adds a journal entry (with optional photos) to a plant. */
export default function LogEntry() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const theme = useTheme();
  const [value, setValue] = useState<EntryFormValue>({
    type: 'note',
    day: todayString(),
    note: '',
  });
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [busy, setBusy] = useState(false);

  // Photos taken for an entry that's never saved are removed again.
  const saved = useRef(false);
  const pending = useRef<StoredPhoto[]>([]);
  useEffect(() => {
    pending.current = photos;
  }, [photos]);
  useEffect(
    () => () => {
      if (!saved.current) deletePhotoFiles(pending.current.map((p) => p.file));
    },
    [],
  );

  const addOne = async () => {
    const photo = await choosePhoto();
    if (photo) setPhotos((list) => [...list, photo]);
  };

  const save = async () => {
    setBusy(true);
    try {
      const at = onDay(Date.now(), value.day);
      const entryId = await addEntry(db, {
        plantId: id,
        type: value.type,
        at,
        note: value.note,
        data: {},
      });
      for (const photo of photos) {
        await addPhoto(db, { plantId: id, entryId, ...photo, takenAt: at });
      }
      saved.current = true;
      successFeedback();
      router.back();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen belowHeader footer={<Button title="Save" icon="check" onPress={save} busy={busy} />}>
      <EntryForm value={value} onChange={setValue} />
      <Field label="Photos">
        <View style={styles.photos}>
          {photos.map((photo) => (
            <Pressable
              key={photo.file}
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
              onPress={() => {
                deletePhotoFiles([photo.file]);
                setPhotos((list) => list.filter((p) => p !== photo));
              }}>
              <Image
                source={{ uri: photoUri(photo.file) }}
                style={styles.thumb}
                contentFit="cover"
              />
              <View style={[styles.remove, { backgroundColor: theme.card }]}>
                <Icon name="x" size={14} color={theme.text} duotone={false} />
              </View>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add a photo"
            onPress={addOne}
            style={[styles.thumb, styles.add, { backgroundColor: theme.tintSoft }]}>
            <Icon name="camera" size={28} color={theme.tint} />
          </Pressable>
        </View>
      </Field>
    </Screen>
  );
}

const styles = StyleSheet.create({
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  thumb: { width: 92, height: 92, borderRadius: Radius.medium },
  add: { alignItems: 'center', justifyContent: 'center' },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
