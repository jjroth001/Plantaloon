import { PlantScanner } from '@modules/plant-scanner';
import { Directory, DownloadTask, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { ALL_SPECIES, getSpecies, speciesId, type Species } from '@/catalog';
import { baseSpecies } from '@/catalog/media';
import type * as ScanDataModule from '@/catalog/scan-data';

import { decodeBase64 } from './climate';

/**
 * The plant scanner: BioCLIP's image encoder runs on the phone (native module) and turns a
 * photo into a fingerprint; this file matches it against every catalog species. The model
 * (87 MB) is downloaded once on request; photos never leave the phone.
 */

// The fingerprints are 1.3 MB of code: loaded the first time they're needed, not at startup.
let scanData: typeof ScanDataModule | null = null;
function data(): typeof ScanDataModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  scanData ??= require('@/catalog/scan-data') as typeof ScanDataModule;
  return scanData;
}

/** Where the model is published. Must be a public HTTPS link. */
export const SCAN_MODEL_URL =
  'https://github.com/jjroth001/plantaloon-scanner/releases/download/v1/bioclip_image_int8.onnx';

/** Native code is only in installed builds, not Expo Go. */
export const scannerSupported = PlantScanner != null;

function modelFile(): File {
  return new File(new Directory(Paths.document, 'scanner'), 'bioclip_image_int8.onnx');
}

export function scannerReady(): boolean {
  const file = modelFile();
  return file.exists && file.size === data().SCAN_MODEL.bytes;
}

/** The model's download size in MB. */
export function scanModelMb(): number {
  return Math.round(data().SCAN_MODEL.bytes / 1e6);
}

/** Downloads the model once, checks it's intact, and keeps it in the app's storage. */
export async function downloadScanner(
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!PlantScanner) throw new Error('Scanning works in the installed app, not in Expo Go.');
  const dir = new Directory(Paths.document, 'scanner');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  const partial = new File(dir, 'download.part');
  if (partial.exists) partial.delete();
  const task = new DownloadTask(SCAN_MODEL_URL, partial, {
    signal,
    onProgress: ({ bytesWritten, totalBytes }) =>
      onProgress(
        Math.min(1, bytesWritten / (totalBytes > 0 ? totalBytes : data().SCAN_MODEL.bytes)),
      ),
  });
  try {
    const file = await task.downloadAsync();
    if (!file) throw new Error('The download was interrupted. Try again.');
    if (
      file.size !== data().SCAN_MODEL.bytes ||
      (await PlantScanner.sha256(file.uri)) !== data().SCAN_MODEL.sha256
    ) {
      file.delete();
      throw new Error('The downloaded file was damaged. Please try again.');
    }
    const target = modelFile();
    if (target.exists) target.delete();
    file.moveSync(target);
  } finally {
    task.release();
    if (partial.exists) partial.delete();
  }
}

export function removeScanner() {
  PlantScanner?.release();
  const dir = new Directory(Paths.document, 'scanner');
  if (dir.exists) dir.delete();
}

// --- Matching -----------------------------------------------------------------------------

let fingerprints: { vectors: Int8Array; scales: Float32Array } | null = null;

function loadFingerprints() {
  if (!fingerprints) {
    const v = decodeBase64(data().SCAN_VECTORS);
    const s = decodeBase64(data().SCAN_SCALES);
    fingerprints = {
      vectors: new Int8Array(v.buffer, v.byteOffset, v.byteLength),
      scales: new Float32Array(s.slice().buffer),
    };
  }
  return fingerprints;
}

/** Catalog entry for a scanner species id (a cultivar if the bare species isn't listed). */
function catalogSpecies(id: string): Species | undefined {
  return getSpecies(id) ?? ALL_SPECIES.find((s) => speciesId(baseSpecies(s.scientific)) === id);
}

export type ScanMatch = { species: Species; score: number };

/** The closest catalog species to a photo's fingerprint, best first. */
export function rankMatches(embedding: ArrayLike<number>, count = 5): ScanMatch[] {
  const { vectors, scales } = loadFingerprints();
  const { SCAN_DIM, SCAN_SPECIES } = data();
  const scores = new Float32Array(SCAN_SPECIES.length);
  for (let i = 0; i < SCAN_SPECIES.length; i++) {
    let dot = 0;
    const offset = i * SCAN_DIM;
    for (let d = 0; d < SCAN_DIM; d++) dot += vectors[offset + d] * embedding[d];
    scores[i] = dot * scales[i];
  }
  const order = Array.from(scores.keys()).sort((a, b) => scores[b] - scores[a]);
  const matches: ScanMatch[] = [];
  for (const i of order) {
    const species = catalogSpecies(SCAN_SPECIES[i]);
    if (species && !matches.some((m) => m.species.id === species.id)) {
      matches.push({ species, score: scores[i] });
    }
    if (matches.length >= count) break;
  }
  return matches;
}

/** Photo → best matches. The photo is shrunk first and never leaves the phone. */
export async function scanPhoto(uri: string, width: number, height: number): Promise<ScanMatch[]> {
  if (!PlantScanner) throw new Error('Scanning works in the installed app, not in Expo Go.');
  // Shrink so the short side is 256 px (upright, as the picker returned it); the native side
  // makes the exact 224 × 224 crop.
  const scale = 256 / Math.min(width, height);
  let context = ImageManipulator.manipulate(uri);
  if (scale < 1) {
    context =
      width <= height
        ? context.resize({ width: 256, height: null })
        : context.resize({ width: null, height: 256 });
  }
  const image = await context.renderAsync();
  const small = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.92 });
  try {
    const embedding = await PlantScanner.embed(modelFile().uri, small.uri);
    return rankMatches(embedding);
  } finally {
    try {
      new File(small.uri).delete();
    } catch {
      // A temporary file; the system clears the cache anyway.
    }
  }
}
