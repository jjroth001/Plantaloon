import { Alert } from 'react-native';

/**
 * Says a save didn't go through, rather than leaving the screen as if nothing was tapped.
 * Rare: the phone's storage is full or the database couldn't be written.
 */
export function alertSaveFailed() {
  Alert.alert('Couldn’t save', 'Something went wrong while saving. Please try again.');
}
