// App entry: Expo Router, plus background work for reminder buttons and the home-screen widget.
import 'expo-router/entry';

import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

// Both need Plantaloon's own native code, so they're loaded only in installed builds
// (loading them in Expo Go would crash). Android may start the app just to run them.
if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
  // "Watered" / "Remind me later" on the daily reminder, even with the app closed.
  const { registerNotificationTask } = require('./src/lib/notification-task');
  registerNotificationTask().catch(() => {});

  if (Platform.OS === 'android') {
    const { registerWidgetTaskHandler } = require('react-native-android-widget');
    const { widgetTaskHandler } = require('./src/widget/task-handler');
    registerWidgetTaskHandler(widgetTaskHandler);
  }
}
