import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icons/icon';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import {
  Card,
  Chip,
  Divider,
  Field,
  ListRow,
  SectionTitle,
  Segmented,
  SwitchRow,
} from '@/components/ui';
import { ACCENTS, makePalette, Spacing, type AccentName } from '@/constants/theme';
import { setSetting } from '@/db/settings';
import { useSettings } from '@/db/use-settings';
import { pickBackup, restoreBackup, shareBackup } from '@/lib/data-transfer';
import { formatRelativeDay, dateOf } from '@/lib/dates';
import { successFeedback, tapFeedback } from '@/lib/haptics';
import { remindersSupported, requestNotificationPermission } from '@/lib/notifications';
import { useTheme } from '@/theme/theme-provider';

const REMINDER_TIMES = [7 * 60, 8 * 60, 9 * 60, 12 * 60, 17 * 60, 19 * 60];

function formatMinute(minute: number): string {
  const d = new Date();
  d.setHours(Math.floor(minute / 60), minute % 60, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const settings = useSettings();
  const [busy, setBusy] = useState<'backup' | 'restore' | null>(null);
  const s = settings.data;
  if (!s) return <Screen title="Settings">{null}</Screen>;

  const backUp = async () => {
    setBusy('backup');
    try {
      await shareBackup(db);
      await setSetting(db, 'lastBackupAt', Date.now());
    } catch (error) {
      Alert.alert('Backup failed', (error as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const restore = async () => {
    setBusy('restore');
    try {
      const picked = await pickBackup();
      if (!picked) return;
      const { plants, entries, photos } = picked.summary;
      Alert.alert(
        'Restore this backup?',
        `It has ${plants} ${plants === 1 ? 'plant' : 'plants'}, ${entries} journal ${entries === 1 ? 'entry' : 'entries'} and ${photos} ${photos === 1 ? 'photo' : 'photos'}. Everything currently on this phone is replaced.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              setBusy('restore');
              try {
                await restoreBackup(db, picked);
                successFeedback();
                Alert.alert('Restored', 'Your plants are back.');
              } catch (error) {
                Alert.alert('Restore failed', (error as Error).message);
              } finally {
                setBusy(null);
              }
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert('Can’t restore that file', (error as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen title="Settings">
      <View style={styles.section}>
        <SectionTitle>Appearance</SectionTitle>
        <Card>
          <Field label="Theme">
            <Segmented
              options={[
                { value: 'system', label: 'Phone' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
              value={s.themeMode}
              onChange={(v) => setSetting(db, 'themeMode', v)}
            />
          </Field>
          <Field label="Color">
            <View style={styles.swatches}>
              {(Object.keys(ACCENTS) as AccentName[]).map((accent) => {
                const color = makePalette(theme.dark, accent).tint;
                const selected = s.accent === accent;
                return (
                  <Pressable
                    key={accent}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={ACCENTS[accent].label}
                    onPress={() => {
                      tapFeedback();
                      setSetting(db, 'accent', accent);
                    }}
                    style={styles.swatchCell}>
                    <View
                      style={[
                        styles.swatch,
                        {
                          backgroundColor: color,
                          borderColor: selected ? theme.text : 'transparent',
                        },
                      ]}>
                      {selected && (
                        <Icon name="check" size={20} color={theme.onTint} duotone={false} />
                      )}
                    </View>
                    <ThemedText type="caption" color={selected ? 'text' : 'textSecondary'}>
                      {ACCENTS[accent].label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </Field>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionTitle>Reminders</SectionTitle>
        <Card>
          <SwitchRow
            title="Daily reminder"
            subtitle={
              remindersSupported
                ? 'One notification on days when plants need care'
                : 'Works in the installed app, not in Expo Go'
            }
            value={s.reminders}
            onChange={async (on) => {
              await setSetting(db, 'reminders', on);
              if (on && !(await requestNotificationPermission()) && remindersSupported) {
                Alert.alert(
                  'Notifications are off',
                  'Allow notifications for Plantaloon in Android Settings › Apps › Plantaloon › Notifications.',
                );
              }
            }}
          />
          {s.reminders && (
            <Field label="Time">
              <View style={styles.chips}>
                {REMINDER_TIMES.map((minute) => (
                  <Chip
                    key={minute}
                    label={formatMinute(minute)}
                    selected={s.reminderMinute === minute}
                    onPress={() => setSetting(db, 'reminderMinute', minute)}
                  />
                ))}
              </View>
            </Field>
          )}
        </Card>
      </View>

      <View style={styles.section}>
        <SectionTitle>Preferences</SectionTitle>
        <Card>
          <Field label="Temperature">
            <Segmented
              options={[
                { value: 'C', label: '°C' },
                { value: 'F', label: '°F' },
              ]}
              value={s.temperatureUnit}
              onChange={(v) => setSetting(db, 'temperatureUnit', v)}
            />
          </Field>
          <Field label="Seasons">
            <Segmented
              options={[
                { value: 'north', label: 'Northern half' },
                { value: 'south', label: 'Southern half' },
              ]}
              value={s.hemisphere}
              onChange={(v) => setSetting(db, 'hemisphere', v)}
            />
          </Field>
          <SwitchRow
            title="Vibration"
            subtitle="A small tap when you tick something off"
            value={s.haptics}
            onChange={(v) => setSetting(db, 'haptics', v)}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionTitle>Your data</SectionTitle>
        <Card>
          <ListRow
            icon="upload-simple"
            title={busy === 'backup' ? 'Preparing backup…' : 'Back up'}
            subtitle={
              s.lastBackupAt
                ? `Last backup shared: ${formatRelativeDay(dateOf(s.lastBackupAt)).toLowerCase()}`
                : 'Save your plants, journal and photos to Drive or a file'
            }
            onPress={busy ? undefined : backUp}
          />
          <Divider />
          <ListRow
            icon="download-simple"
            title={busy === 'restore' ? 'Reading backup…' : 'Restore'}
            subtitle="Replace everything here with a backup"
            onPress={busy ? undefined : restore}
          />
          <Divider />
          <ListRow
            icon="house"
            title="Rooms"
            subtitle="Rename, reorder, add or remove"
            onPress={() => router.push('/rooms')}
          />
          <Divider />
          <ListRow
            icon="trash"
            title="Erase all data"
            danger
            onPress={() => router.push('/erase')}
          />
        </Card>
      </View>

      <Card>
        <ListRow
          icon="info"
          title="About Plantaloon"
          subtitle="Credits, sources and privacy"
          onPress={() => router.push('/about')}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.three },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  swatchCell: { alignItems: 'center', gap: 4, width: 64 },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
