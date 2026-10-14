import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { careFor, getGroup, getSpecies } from '@/catalog';
import { Icon } from '@/components/icons/icon';
import { diameterCm, namedExtras, PlantForm, type PlantFormValue } from '@/components/plant-form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Chip, Field } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import {
  addPhoto,
  adoptSpot,
  createPlant,
  listPlants,
  listRooms,
  setPotMates,
  syncPotDetails,
} from '@/db/garden';
import { useSettings } from '@/db/use-settings';
import { useDbQuery } from '@/db/use-db-query';
import { choosePhoto } from '@/lib/add-photo';
import { LIGHT_LABEL } from '@/lib/light';
import { addDays, todayString } from '@/lib/dates';
import { successFeedback } from '@/lib/haptics';
import { deletePhotoFiles, photoUri, type StoredPhoto } from '@/lib/photos';
import { suggestedWaterDays } from '@/lib/schedule';
import { petText } from '@/lib/care-text';
import { useTheme } from '@/theme/theme-provider';

type LastWatered = 'today' | 'recent' | 'week' | 'unknown';

const LAST_WATERED: { value: LastWatered; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'recent', label: 'A few days ago' },
  { value: 'week', label: 'Over a week ago' },
  { value: 'unknown', label: 'Not sure' },
];

/** Step 2 of adding a plant: name, room, pot and reminders. */
export default function AddPlantDetails() {
  const params = useLocalSearchParams<{ speciesId?: string; groupId?: string; name?: string }>();
  const db = useSQLiteContext();
  const theme = useTheme();
  const rooms = useDbQuery(['room'], listRooms);
  const plants = useDbQuery(['plant'], listPlants);
  const settings = useSettings();
  const unit = settings.data?.temperatureUnit === 'F' ? 'in' : 'cm';
  const species = getSpecies(params.speciesId);
  const groupId = species?.groupId ?? params.groupId ?? '';
  const group = getGroup(groupId);
  const care = careFor(groupId, species?.id);

  const [form, setForm] = useState<PlantFormValue>(() => ({
    nickname: species ? '' : (params.name ?? ''),
    roomId: null,
    potSize: 'm',
    potDrainage: true,
    potMaterial: 'plastic',
    potDiameter: '',
    potMates: [],
    extras: [],
    water: { enabled: true, intervalDays: care.water.days },
    fertilize: { enabled: care.fertilize != null, intervalDays: care.fertilize?.days ?? 30 },
  }));
  const [lastWatered, setLastWatered] = useState<LastWatered>('unknown');
  const [photo, setPhoto] = useState<StoredPhoto | null>(null);
  // A photo picked for a plant that's never added is removed again.
  const saved = useRef(false);
  const pending = useRef<StoredPhoto | null>(null);
  useEffect(() => {
    pending.current = photo;
  }, [photo]);
  useEffect(
    () => () => {
      if (!saved.current && pending.current) deletePhotoFiles([pending.current.file]);
    },
    [],
  );
  const [busy, setBusy] = useState(false);

  const roomList = rooms.data ?? [];
  const roomId = form.roomId ?? roomList[0]?.id ?? null;

  const update = (next: PlantFormValue) => {
    // A new pot size or material re-suggests the watering interval, unless it was set by hand.
    const suggest = (v: PlantFormValue) =>
      suggestedWaterDays(
        care.water.days,
        v.potSize,
        v.potMaterial,
        diameterCm(v.potDiameter, unit),
      );
    const before = suggest(form);
    const after = suggest(next);
    if (before !== after && form.water.intervalDays === before) {
      next = { ...next, water: { ...next.water, intervalDays: after } };
    }
    setForm(next);
  };

  const pickPhoto = async () => {
    const picked = await choosePhoto();
    if (picked) {
      if (photo) deletePhotoFiles([photo.file]);
      setPhoto(picked);
    }
  };

  const save = async () => {
    if (!roomId) return;
    setBusy(true);
    try {
      const today = todayString();
      const watered =
        lastWatered === 'today'
          ? today
          : lastWatered === 'recent'
            ? addDays(today, -3)
            : lastWatered === 'week'
              ? addDays(today, -8)
              : null;
      const id = await createPlant(db, {
        roomId,
        nickname: form.nickname,
        speciesId: species?.id ?? null,
        groupId: group.id,
        potSize: form.potSize,
        potDrainage: form.potDrainage,
        potMaterial: form.potMaterial,
        potDiameterCm: diameterCm(form.potDiameter, unit),
        extraTasks: namedExtras(form.extras),
        water: form.water,
        fertilize: form.fertilize,
        lastWatered: watered,
      });
      if (form.potMates.length) {
        await setPotMates(db, id, form.potMates);
        // The pot already has a spot; the new plant's pot details are shared from here.
        await adoptSpot(db, id, form.potMates[0]);
        await syncPotDetails(db, id);
      }
      if (photo) await addPhoto(db, { plantId: id, ...photo, takenAt: Date.now() });
      saved.current = true;
      successFeedback();
      router.dismissAll();
      router.push({ pathname: '/plant/[id]', params: { id } });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      belowHeader
      footer={
        <Button title="Add plant" icon="check" onPress={save} busy={busy} disabled={!roomId} />
      }>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={photo ? 'Change photo' : 'Add a photo'}
          onPress={pickPhoto}
          style={[styles.photo, { backgroundColor: theme.tintSoft }]}>
          {photo ? (
            <Image
              source={{ uri: photoUri(photo.file) }}
              style={styles.photoImage}
              contentFit="cover"
            />
          ) : (
            <>
              <Icon name="camera" size={28} color={theme.tint} />
              <ThemedText type="caption" color="tint">
                Photo
              </ThemedText>
            </>
          )}
        </Pressable>
        <View style={styles.flex}>
          <ThemedText type="heading">
            {species?.common[0] ?? (form.nickname || 'Unlisted plant')}
          </ThemedText>
          {species && (
            <ThemedText type="body" color="textSecondary" style={styles.italic}>
              {species.scientific}
            </ThemedText>
          )}
          <ThemedText type="caption" color="textSecondary">
            {group.name}
          </ThemedText>
        </View>
      </View>

      <Card style={{ backgroundColor: theme.tintSoft, borderColor: 'transparent' }}>
        <ThemedText type="body">{care.summary}</ThemedText>
        <View style={styles.facts}>
          <Fact icon="sun" text={LIGHT_LABEL[care.light.best]} />
          <Fact icon="paw-print" text={petText(care.pets)} />
        </View>
      </Card>

      {settings.data && (
        <PlantForm
          value={{ ...form, roomId }}
          onChange={update}
          rooms={roomList}
          unit={unit}
          mateCandidates={(plants.data ?? []).filter((p) => !p.propStage)}
          namePlaceholder={species?.common[0] ?? 'e.g. Fern by the window'}
          pausedInWinter={!(care.fertilize?.winter ?? false)}
        />
      )}

      <Field label="When was it last watered?">
        <View style={styles.chips}>
          {LAST_WATERED.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={lastWatered === option.value}
              onPress={() => setLastWatered(option.value)}
            />
          ))}
        </View>
        <ThemedText type="caption" color="textSecondary">
          {lastWatered === 'unknown'
            ? 'It’ll show up today, so you can check the soil.'
            : 'Reminders count on from then.'}
        </ThemedText>
      </Field>
    </Screen>
  );
}

function Fact({ icon, text }: { icon: 'sun' | 'paw-print'; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.fact}>
      <Icon name={icon} size={18} color={theme.tint} />
      <ThemedText type="caption" style={styles.flex}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  italic: { fontStyle: 'italic' },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  photo: {
    width: 88,
    height: 88,
    borderRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 2,
  },
  photoImage: { width: 88, height: 88 },
  facts: { gap: Spacing.two },
  fact: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
