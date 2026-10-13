import type { SQLiteDatabase } from 'expo-sqlite';
import { Alert } from 'react-native';

import { addPhoto } from '@/db/garden';

import { pickImage, storePhoto, type StoredPhoto } from './photos';

/** Asks camera or gallery, then picks and stores a photo. Null if cancelled. */
export function choosePhoto(): Promise<StoredPhoto | null> {
  return new Promise((resolve) => {
    const go = async (source: 'camera' | 'library') => {
      try {
        const picked = await pickImage(source);
        resolve(picked ? await storePhoto(picked.uri, picked.width, picked.height) : null);
      } catch (error) {
        Alert.alert('Couldn’t add the photo', (error as Error).message);
        resolve(null);
      }
    };
    Alert.alert(
      'Add a photo',
      undefined,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
        { text: 'Gallery', onPress: () => go('library') },
        { text: 'Camera', onPress: () => go('camera') },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });
}

/** Adds a photo straight to a plant's journal. Returns true if one was added. */
export async function addPlantPhoto(db: SQLiteDatabase, plantId: string): Promise<boolean> {
  const photo = await choosePhoto();
  if (!photo) return false;
  await addPhoto(db, { plantId, ...photo, takenAt: Date.now() });
  return true;
}
