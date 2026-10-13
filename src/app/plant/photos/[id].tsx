import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icons/icon';
import { IconButton } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { deletePhoto, getPlant, listPhotos, updatePlant } from '@/db/garden';
import { useDbQuery } from '@/db/use-db-query';
import { formatLongDate, dateOf } from '@/lib/dates';
import { successFeedback } from '@/lib/haptics';
import { deletePhotoFiles, photoUri } from '@/lib/photos';

const INK = '#FFFFFF';
const DIM = 'rgba(255,255,255,0.16)';

/** Full-screen photos of one plant, oldest on the left: swipe to watch it grow. */
export default function PlantPhotos() {
  const { id, photo } = useLocalSearchParams<{ id: string; photo?: string }>();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const data = useDbQuery(
    ['photo', 'plant'],
    async (d) => ({ photos: (await listPhotos(d, id)).reverse(), plant: await getPlant(d, id) }),
    [id],
  );
  const [index, setIndex] = useState<number | null>(null);

  const photos = data.data?.photos ?? [];
  const startIndex = Math.max(
    0,
    photos.findIndex((p) => p.id === photo),
  );
  const current = Math.min(index ?? startIndex, photos.length - 1);
  const shown = photos[current];
  const isCover = shown && data.data?.plant?.coverPhotoId === shown.id;

  const remove = () => {
    if (!shown) return;
    Alert.alert('Delete this photo?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const file = await deletePhoto(db, shown.id);
          deletePhotoFiles([file]);
          if (photos.length <= 1) router.back();
          else setIndex(Math.max(0, current - 1));
        },
      },
    ]);
  };

  return (
    <View style={styles.fill}>
      <StatusBar style="light" />
      {photos.length > 0 && (
        <FlatList
          data={photos}
          horizontal
          pagingEnabled
          initialScrollIndex={startIndex}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(p) => p.id}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <Image
              source={{ uri: photoUri(item.file) }}
              style={{ width, height }}
              contentFit="contain"
              transition={150}
              accessibilityLabel={`Photo from ${formatLongDate(dateOf(item.takenAt))}`}
            />
          )}
        />
      )}
      <View style={[styles.top, { paddingTop: insets.top + Spacing.two }]}>
        <IconButton
          icon="x"
          label="Close"
          onPress={() => router.back()}
          color={INK}
          background={DIM}
        />
        {shown && (
          <View style={styles.title}>
            <ThemedText type="label" style={{ color: INK }}>
              {formatLongDate(dateOf(shown.takenAt))}
            </ThemedText>
            <ThemedText type="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {current + 1} of {photos.length}
            </ThemedText>
          </View>
        )}
        <IconButton
          icon="trash"
          label="Delete photo"
          onPress={remove}
          color={INK}
          background={DIM}
        />
      </View>
      {shown && (
        <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.three }]}>
          <Pressable
            accessibilityRole="button"
            disabled={isCover}
            onPress={async () => {
              await updatePlant(db, id, { coverPhotoId: shown.id });
              successFeedback();
            }}
            style={({ pressed }) => [styles.pill, pressed && { opacity: 0.7 }]}>
            <Icon name={isCover ? 'check' : 'image'} size={18} color={INK} />
            <ThemedText type="label" style={{ color: INK }}>
              {isCover ? 'Cover photo' : 'Use as cover photo'}
            </ThemedText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000000' },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  title: { flex: 1, alignItems: 'center' },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: Spacing.three,
    borderRadius: 20,
    backgroundColor: DIM,
  },
});
