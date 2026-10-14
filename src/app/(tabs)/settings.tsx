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
import { requestClimatePlace } from '@/lib/location';
import { removeScanner, SCAN_MODEL_MB, scannerReady, scannerSupported } from '@/lib/scanner';
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
  const [scannerOnPhone, setScannerOnPhone] = useState(() => scannerSupported && scannerReady());
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
                { value: 'north', label: 'Northern hemisphere' },
                { value: 'south', label: 'Southern hemisphere' },
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
        <SectionTitle>Your area</SectionTitle>
        <Card>
          {s.climatePlace ? (
            <ListRow
              icon="map-pin"
              title="Rough area saved"
              subtitle={`Near ${s.climatePlace.lat.toFixed(1)}°, ${s.climatePlace.lon.toFixed(1)}° · used for outdoor months`}
              right={
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => setSetting(db, 'climatePlace', null)}>
                  <ThemedText type="label" color="danger">
                    Forget
                  </ThemedText>
                </Pressable>
              }
            />
          ) : (
            <ListRow
              icon="map-pin"
              title="Use my rough area"
              subtitle="Shows which months each plant can go outside where you live"
              onPress={async () => {
                try {
                  const place = await requestClimatePlace();
                  if (place) {
                    await setSetting(db, 'climatePlace', place);
                    successFeedback();
                  } else {
                    Alert.alert(
                      'Location not shared',
                      'Without it, plant pages show a general rule for summering plants outside.',
                    );
                  }
                } catch (error) {
                  Alert.alert('Couldn’t read your area', (error as Error).message);
                }
              }}
            />
          )}
          <ThemedText type="caption" color="textSecondary">
            Uses approximate location once, rounded to about 50 km. It stays on this phone, isn’t
            included in backups, and nothing is sent anywhere: the climate data is built in.
          </ThemedText>
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
          {scannerOnPhone && (
            <>
              <Divider />
              <ListRow
                icon="magnifying-glass-plus"
                title="Plant scanner"
                subtitle={`On this phone (${SCAN_MODEL_MB} MB). Remove to free space; you can download it again.`}
                right={
                  <Pressable
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() =>
                      Alert.alert('Remove the plant scanner?', `Frees ${SCAN_MODEL_MB} MB.`, [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Remove',
                          style: 'destructive',
                          onPress: () => {
                            removeScanner();
                            setScannerOnPhone(false);
                          },
                        },
                      ])
                    }>
                    <ThemedText type="label" color="danger">
                      Remove
                    </ThemedText>
                  </Pressable>
                }
              />
            </>
          )}
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
