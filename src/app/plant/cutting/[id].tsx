import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { displayName } from '@/catalog';
import { detailsFor, getGuide } from '@/catalog/media';
import type { PropagationId } from '@/catalog/types';
import { CHANGE_WATER } from '@/components/plant/cuttings-card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button, Chip, Field, TextField } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { createPlant, newCustomTask } from '@/db/garden';
import { useGarden } from '@/hooks/use-garden';
import { successFeedback } from '@/lib/haptics';

const ALL_METHODS: PropagationId[] = [
  'stem-cuttings-water',
  'stem-cuttings-soil',
  'leaf-cuttings',
  'division',
  'offsets',
  'plantlets',
  'air-layering',
];

/** Starts tracking a cutting (or division, pup…) taken from one of your plants. */
export default function StartCutting() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const garden = useGarden();
  const parent = garden.data?.plants.find((p) => p.id === id);
  const suggested = parent ? (detailsFor(parent.groupId)?.propagation ?? []) : [];
  const methods = (suggested.length ? suggested : ALL_METHODS).filter((m) => m !== 'seed');
  const [method, setMethod] = useState<PropagationId | null>(null);
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!parent || !garden.data) return <Screen belowHeader>{null}</Screen>;
  const chosen = method ?? methods[0] ?? 'stem-cuttings-water';
  const room = roomId ?? parent.roomId;

  const start = async () => {
    setBusy(true);
    try {
      const inWater = chosen === 'stem-cuttings-water';
      const childId = await createPlant(db, {
        roomId: room,
        nickname: name.trim() || `Cutting of ${displayName(parent)}`,
        speciesId: parent.speciesId,
        groupId: parent.groupId,
        potSize: 's',
        potDrainage: !inWater,
        potMaterial: inWater ? 'glass' : 'plastic',
        // In water: refresh it weekly instead of watering. In soil: keep it lightly moist.
        water: { intervalDays: 3, enabled: !inWater },
        fertilize: { intervalDays: 30, enabled: false },
        extraTasks: inWater
          ? [{ task: newCustomTask(), label: CHANGE_WATER, intervalDays: 7 }]
          : [],
        lastWatered: null,
        cutting: { parentId: parent.id, method: chosen },
      });
      successFeedback();
      router.dismiss();
      router.push({ pathname: '/plant/[id]', params: { id: childId } });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      belowHeader
      footer={<Button title="Start tracking" icon="scissors" onPress={start} busy={busy} />}>
      <ThemedText type="body" color="textSecondary">
        Follow a new plant from {displayName(parent)} as it grows roots. When it’s potted up, it
        becomes a plant of its own with normal reminders.
      </ThemedText>
      <Field label="How are you growing it?">
        <View style={styles.chips}>
          {methods.map((m) => (
            <Chip
              key={m}
              label={getGuide(m)?.title ?? m}
              icon={getGuide(m)?.icon}
              selected={chosen === m}
              onPress={() => setMethod(m)}
            />
          ))}
        </View>
      </Field>
      <TextField
        label="Name (optional)"
        value={name}
        onChangeText={setName}
        placeholder={`Cutting of ${displayName(parent)}`}
        maxLength={40}
      />
      <Field label="Where is it?">
        <View style={styles.chips}>
          {garden.data.rooms.map((r) => (
            <Chip
              key={r.id}
              label={r.name}
              icon={r.icon}
              selected={room === r.id}
              onPress={() => setRoomId(r.id)}
            />
          ))}
        </View>
      </Field>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
