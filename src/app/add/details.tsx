import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInLeft, FadeInRight, LinearTransition } from 'react-native-reanimated';

import { careFor, getGroup, getSpecies } from '@/catalog';
import { Icon } from '@/components/icons/icon';
import {
  diameterCm,
  isInGround,
  namedExtras,
  PlantForm,
  type FormSection,
  type PlantFormValue,
} from '@/components/plant-form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Field, RadioList } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { addPhoto, adoptSpot, createPlant, setPotMates, syncPotDetails } from '@/db/garden';
import { useSettings } from '@/db/use-settings';
import { useGarden } from '@/hooks/use-garden';
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

const STEP_TEXT: Record<FormSection, { title: string; body: string }> = {
  name: { title: 'Name and photo', body: 'Both optional. A photo helps tell plants apart.' },
  room: {
    title: 'Where does it live?',
    body: 'Pick its room. You can fine-tune its exact spot later, from Edit plant.',
  },
  pot: { title: 'Its pot', body: 'Size and material change how quickly the soil dries out.' },
  care: {
    title: 'Watering and feeding',
    body: 'Suggested for this plant and its pot. You can change them any time.',
  },
  extras: {
    title: 'Other reminders',
    body: 'Optional: misting, turning, cleaning, pruning, repotting or your own.',
  },
};

/** Step 2 of adding a plant: a short guide, one section per screen. */
export default function AddPlantDetails() {
  const params = useLocalSearchParams<{ speciesId?: string; groupId?: string; name?: string }>();
  const db = useSQLiteContext();
  const theme = useTheme();
  // Shared and usually loaded already, so each step opens with its choices in place.
  const garden = useGarden();
  const rooms = { data: garden.data?.rooms };
  const plants = { data: garden.data?.plants };
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
    inGround: false,
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
  const [stepIndex, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const scrollRef = useRef<ScrollView>(null);

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
        isInGround({ ...v, roomId: v.roomId ?? roomId }, roomList),
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

  const ground = isInGround({ ...form, roomId }, roomList);

  // One section per screen; the pot step is skipped for a plant in the ground.
  const steps: FormSection[] = [
    'name',
    'room',
    ...(ground ? [] : ['pot' as const]),
    'care',
    'extras',
  ];
  const index = Math.min(stepIndex, steps.length - 1);
  const step = steps[index];
  const go = (delta: 1 | -1) => {
    setDirection(delta);
    setStep(Math.max(0, Math.min(steps.length - 1, index + delta)));
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };
  // The phone's back gesture steps back through the guide before leaving it.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (index === 0) return false;
      setDirection(-1);
      setStep(index - 1);
      return true;
    });
    return () => sub.remove();
  }, [index]);

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
        inGround: ground,
        extraTasks: namedExtras(form.extras),
        water: form.water,
        fertilize: form.fertilize,
        lastWatered: watered,
      });
      if (form.potMates.length && !ground) {
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

  const last = index === steps.length - 1;

  return (
    <Screen
      belowHeader
      ref={scrollRef}
      footer={
        <View style={styles.footer}>
          {index > 0 && (
            <Button title="Back" variant="secondary" onPress={() => go(-1)} style={styles.back} />
          )}
          <Button
            title={last ? 'Add plant' : 'Next'}
            icon={last ? 'check' : undefined}
            onPress={last ? save : () => go(1)}
            busy={busy}
            disabled={!roomId}
            style={styles.flex}
          />
        </View>
      }>
      <View
        style={styles.progress}
        accessible
        accessibilityLabel={`Step ${index + 1} of ${steps.length}`}>
        {steps.map((s, i) => (
          <Animated.View
            key={s}
            layout={LinearTransition.duration(240)}
            style={[
              styles.dot,
              i === index && styles.dotNow,
              { backgroundColor: i <= index ? theme.tint : theme.element },
            ]}
          />
        ))}
      </View>

      <Animated.View
        key={step}
        entering={(direction > 0 ? FadeInRight : FadeInLeft).duration(240)}
        style={styles.step}>
        <View style={styles.stepTitle}>
          <ThemedText type="title">{STEP_TEXT[step].title}</ThemedText>
          <ThemedText type="body" color="textSecondary">
            {STEP_TEXT[step].body}
          </ThemedText>
        </View>

        {step === 'name' && (
          <>
            <View style={styles.header}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={photo ? 'Change photo' : 'Add a photo'}
                onPress={pickPhoto}
                style={[styles.photo, { backgroundColor: theme.tintSoft }]}>
                {photo ? (
                  <Image
                    cachePolicy="memory-disk"
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
          </>
        )}

        {settings.data && (
          <PlantForm
            value={{ ...form, roomId }}
            onChange={update}
            rooms={roomList}
            unit={unit}
            mateCandidates={(plants.data ?? []).filter((p) => !p.propStage)}
            namePlaceholder={species?.common[0] ?? 'e.g. Fern by the window'}
            pausedInWinter={!(care.fertilize?.winter ?? false)}
            section={step}
          />
        )}

        {step === 'care' && (
          <Field label="When was it last watered?">
            <RadioList options={LAST_WATERED} value={lastWatered} onChange={setLastWatered} />
            <ThemedText type="caption" color="textSecondary">
              {lastWatered === 'unknown'
                ? 'It’ll show up today, so you can check the soil.'
                : 'Reminders count on from then.'}
            </ThemedText>
          </Field>
        )}
      </Animated.View>
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
  footer: { flexDirection: 'row', gap: Spacing.three },
  back: { paddingHorizontal: Spacing.five },
  progress: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  dot: { width: 14, height: 6, borderRadius: 3 },
  dotNow: { width: 30 },
  step: { gap: Spacing.four },
  stepTitle: { gap: Spacing.one },
});
