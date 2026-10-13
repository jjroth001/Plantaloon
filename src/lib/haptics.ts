import * as Haptics from 'expo-haptics';

// Settings › Vibration; set app-wide by ThemeProvider.
let enabled = true;

export function setHapticsEnabled(on: boolean) {
  enabled = on;
}

/** Light tick for taps that change state. */
export function tapFeedback() {
  if (!enabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Confirmation that something was done. */
export function successFeedback() {
  if (!enabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
