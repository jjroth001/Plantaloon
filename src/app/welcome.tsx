import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import type { IconName } from '@/components/icons/icon';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button, Chip, IconBadge, Segmented } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { createRoom } from '@/db/garden';
import { setSetting, type Settings } from '@/db/settings';
import { useSettings } from '@/db/use-settings';
import { pickBackup, restoreBackup } from '@/lib/data-transfer';
import { successFeedback } from '@/lib/haptics';
import { useTheme } from '@/theme/theme-provider';

const ROOM_CHOICES: { name: string; icon: IconName }[] = [
  { name: 'Living room', icon: 'couch' },
  { name: 'Kitchen', icon: 'cooking-pot' },
  { name: 'Bedroom', icon: 'bed' },
  { name: 'Bathroom', icon: 'bathtub' },
  { name: 'Office', icon: 'desk' },
  { name: 'Hallway', icon: 'door' },
  { name: 'Dining room', icon: 'armchair' },
  { name: 'Balcony', icon: 'sun' },
];

/** First run: a short welcome and picking which rooms have plants. */
export default function WelcomeScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const settings = useSettings();
  const [picked, setPicked] = useState<Set<string>>(() => new Set(['Living room']));
  const [hemisphere, setHemisphere] = useState<Settings['hemisphere'] | null>(null);
  const [busy, setBusy] = useState(false);
  const chosenHemisphere = hemisphere ?? settings.data?.hemisphere ?? 'north';

  const toggle = (name: string) =>
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const start = async () => {
    setBusy(true);
    try {
      for (const room of ROOM_CHOICES) {
        if (picked.has(room.name)) await createRoom(db, room);
      }
      if (picked.size === 0) await createRoom(db, { name: 'Home', icon: 'house' });
      await setSetting(db, 'hemisphere', chosenHemisphere);
      successFeedback();
      // The app switches to the tabs once this is saved.
      await setSetting(db, 'onboarded', true);
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const picked = await pickBackup();
      if (!picked) return;
      await restoreBackup(db, picked);
      successFeedback();
      await setSetting(db, 'onboarded', true);
    } catch (error) {
      Alert.alert('Can’t restore that file', (error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      footer={
        <>
          <Button title="Get started" icon="plant" onPress={start} busy={busy} />
          <Button
            title="Restore a backup"
            variant="ghost"
            size="small"
            onPress={restore}
            disabled={busy}
          />
        </>
      }>
      <View style={styles.hero}>
        <IconBadge icon="potted-plant" color={theme.tint} background={theme.tintSoft} size={96} />
        <ThemedText type="title" style={styles.center}>
          Welcome to Plantaloon
        </ThemedText>
        <ThemedText type="body" color="textSecondary" style={styles.center}>
          Gentle reminders, a journal for each plant, and care tips for over two thousand
          houseplants. Everything stays on this phone.
        </ThemedText>
      </View>

      <View style={styles.group}>
        <ThemedText type="subheading">Where are your plants?</ThemedText>
        <ThemedText type="body" color="textSecondary">
          Pick the rooms you have plants in. You can rename, add or remove rooms later.
        </ThemedText>
        <View style={styles.chips}>
          {ROOM_CHOICES.map((room) => (
            <Chip
              key={room.name}
              label={room.name}
              icon={room.icon}
              selected={picked.has(room.name)}
              onPress={() => toggle(room.name)}
            />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <ThemedText type="subheading">Where in the world?</ThemedText>
        <ThemedText type="body" color="textSecondary">
          Plants slow down in winter, so watering stretches out and feeding pauses. This sets which
          months are winter.
        </ThemedText>
        <Segmented
          options={[
            { value: 'north', label: 'Northern half' },
            { value: 'south', label: 'Southern half' },
          ]}
          value={chosenHemisphere}
          onChange={setHemisphere}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: Spacing.three, paddingTop: Spacing.five },
  center: { textAlign: 'center' },
  group: { gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
});
