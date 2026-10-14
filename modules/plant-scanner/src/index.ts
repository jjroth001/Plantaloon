import { requireOptionalNativeModule } from 'expo';

type PlantScannerModule = {
  /** Image → 512-number fingerprint, using the model file at `modelUri`. */
  embed(modelUri: string, imageUri: string): Promise<number[]>;
  /** SHA-256 of a file, hex (to check the downloaded model). */
  sha256(fileUri: string): Promise<string>;
  /** Frees the loaded model's memory. */
  release(): void;
};

/** On-phone plant recognition (Android, installed builds). null in Expo Go. */
export const PlantScanner = requireOptionalNativeModule<PlantScannerModule>('PlantScanner');
