import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { newId } from '@/db/ids';

/**
 * Plant photos live in the app's own storage (not the phone's gallery), resized to at most
 * 1,600 px on the long side so a few hundred photos stay small. Uninstalling the app removes
 * them, so backups include them.
 */
const MAX_SIDE = 1600;

function photoDir(): Directory {
  const dir = new Directory(Paths.document, 'photos');
  if (!dir.exists) dir.create({ idempotent: true, intermediates: true });
  return dir;
}

/**
 * A photo's file name, as stored: a plain name in the photos folder, never a path. Names come
 * from the database, which a restored backup fills, so anything else is refused.
 */
export function isSafePhotoName(name: string): boolean {
  return /^[\w-]+\.(jpg|jpeg|png|webp)$/i.test(name);
}

/** A name that never exists, for a stored name that isn't safe to use as a path. */
const MISSING = 'missing.jpg';

export function photoUri(file: string): string {
  return new File(photoDir(), isSafePhotoName(file) ? file : MISSING).uri;
}

export function photoFile(file: string): File {
  return new File(photoDir(), isSafePhotoName(file) ? file : MISSING);
}

export type StoredPhoto = { file: string; width: number; height: number };

/** Shrinks a picked image and stores it in the photos folder. */
export async function storePhoto(uri: string, width: number, height: number): Promise<StoredPhoto> {
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height, 1));
  let context = ImageManipulator.manipulate(uri);
  if (scale < 1) {
    context =
      width >= height
        ? context.resize({ width: Math.round(width * scale), height: null })
        : context.resize({ width: null, height: Math.round(height * scale) });
  }
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.82 });
  const name = `${newId()}.jpg`;
  const source = new File(result.uri);
  source.moveSync(new File(photoDir(), name));
  return { file: name, width: result.width, height: result.height };
}

export function deletePhotoFiles(files: readonly (string | null | undefined)[]) {
  for (const name of files) {
    if (!name || !isSafePhotoName(name)) continue;
    try {
      const file = new File(photoDir(), name);
      if (file.exists) file.delete();
    } catch {
      // Already gone; nothing to do.
    }
  }
}

export type PickedImage = { uri: string; width: number; height: number };

/** Opens the camera or the system photo picker. Returns null if cancelled. Throws on refusal. */
export async function pickImage(source: 'camera' | 'library'): Promise<PickedImage | null> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error(
        'Plantaloon needs the camera to take plant photos. You can allow it in Android Settings › Apps › Plantaloon › Permissions.',
      );
    }
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: 'images', quality: 1 };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, width: asset.width, height: asset.height };
}
