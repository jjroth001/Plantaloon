import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as NavigationThemeProvider,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { Suspense, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ReminderSync } from '@/components/reminder-sync';
import { migrateDbIfNeeded } from '@/db/migrations';
import { useSettings } from '@/db/use-settings';
import { ThemeProvider, useTheme } from '@/theme/theme-provider';

// Keep the splash up until the database is open and settings are loaded, then fade it out.
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 250, fade: true });

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Suspense fallback={null}>
        <SQLiteProvider
          databaseName="plantaloon.db"
          options={{ enableChangeListener: true }}
          onInit={migrateDbIfNeeded}
          useSuspense>
          <ThemeProvider>
            <RootNavigator />
          </ThemeProvider>
        </SQLiteProvider>
      </Suspense>
    </GestureHandlerRootView>
  );
}

/** Forms rise from the bottom; detail pages slide in from the side. */
const sheet = {
  presentation: 'modal',
  animation: 'slide_from_bottom',
  headerShown: true,
} as const;

function RootNavigator() {
  const theme = useTheme();
  const settings = useSettings();
  const ready = settings.status !== 'loading';

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // The window shows at the edges during transitions; match the background.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.background).catch(() => {});
  }, [theme.background]);

  if (!ready) return null;
  const onboarded = settings.data?.onboarded ?? false;

  const base = theme.dark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: theme.background,
      card: theme.background,
      border: theme.border,
      text: theme.text,
      primary: theme.tint,
    },
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      {onboarded && <ReminderSync />}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          headerStyle: { backgroundColor: theme.background },
          headerShadowVisible: false,
          headerTintColor: theme.text,
          headerTitleStyle: { fontWeight: '600' },
          animation: 'slide_from_right',
        }}>
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="plant/[id]" options={{ headerShown: true, title: '' }} />
          <Stack.Screen name="plant/edit/[id]" options={{ ...sheet, title: 'Edit plant' }} />
          <Stack.Screen
            name="plant/cutting/[id]"
            options={{ ...sheet, title: 'Start a cutting' }}
          />
          <Stack.Screen
            name="plant/archive/[id]"
            options={{ ...sheet, title: 'Move to archive' }}
          />
          <Stack.Screen name="archive" options={{ headerShown: true, title: 'Archive' }} />
          <Stack.Screen name="plant/log/[id]" options={{ ...sheet, title: 'Add to journal' }} />
          <Stack.Screen
            name="plant/photos/[id]"
            options={{ animation: 'fade', headerShown: false }}
          />
          <Stack.Screen name="entry/[id]" options={{ ...sheet, title: 'Edit entry' }} />
          <Stack.Screen name="add/index" options={{ ...sheet, title: 'Add a plant' }} />
          <Stack.Screen name="add/group" options={{ headerShown: true, title: 'Closest match' }} />
          <Stack.Screen name="add/details" options={{ headerShown: true, title: 'Add a plant' }} />
          <Stack.Screen name="scan" options={{ headerShown: true, title: 'Scan a plant' }} />
          <Stack.Screen name="species/[id]" options={{ headerShown: true, title: '' }} />
          <Stack.Screen name="guide/[id]" options={{ headerShown: true, title: '' }} />
          <Stack.Screen name="credits" options={{ headerShown: true, title: 'Photo credits' }} />
          <Stack.Screen name="wishlist" options={{ headerShown: true, title: 'Wishlist' }} />
          <Stack.Screen name="rooms" options={{ headerShown: true, title: 'Rooms' }} />
          <Stack.Screen name="room/[id]" options={{ ...sheet, title: 'Room' }} />
          <Stack.Screen name="about" options={{ headerShown: true, title: 'About Plantaloon' }} />
          <Stack.Screen name="erase" options={{ ...sheet, title: 'Erase all data' }} />
        </Stack.Protected>
        <Stack.Protected guard={!onboarded}>
          <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        </Stack.Protected>
      </Stack>
    </NavigationThemeProvider>
  );
}
