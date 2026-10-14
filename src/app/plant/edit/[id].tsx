import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert } from 'react-native';

import { careFor, displayName } from '@/catalog';
import {
  diameterCm,
  isInGround,
  formatDiameter,
  namedExtras,
  PlantForm,
  sectionSummary,
  type FormSection,
  type LengthUnit,
  type PlantFormValue,
} from '@/components/plant-form';
import { Fold } from '@/components/fold';
import { SpotFields, spotSummary, type SpotValue } from '@/components/plant/spot-fields';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import {
  deletePlant,
  getPlant,
  getSchedules,
  listPlants,
  listRooms,
  removeSchedule,
  setPotMates,
  setSchedule,
  syncPotDetails,
  updatePlant,
} from '@/db/garden';
import { useDbQuery } from '@/db/use-db-query';
import { useSettings } from '@/db/use-settings';
import { suggestedWaterDays } from '@/lib/schedule';
import { successFeedback } from '@/lib/haptics';
import { deletePhotoFiles } from '@/lib/photos';

export default function EditPlant() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const rooms = useDbQuery(['room'], listRooms);
  const plants = useDbQuery(['plant'], listPlants);
  const settings = useSettings();
  const unit: LengthUnit = settings.data?.temperatureUnit === 'F' ? 'in' : 'cm';
  const loaded = useDbQuery(
    [],
    async (d) => {
      const plant = await getPlant(d, id);
      const schedules = await getSchedules(d, id);
      return { plant, schedules };
    },
    [id],
  );
  const [form, setForm] = useState<PlantFormValue | null>(null);
  const [spotForm, setSpot] = useState<SpotValue | null>(null);
  const [openFolds, setOpenFolds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const plant = loaded.data?.plant;
  // Wait for settings too, so a typed diameter is read in the right unit.
  if (!plant || !rooms.data || !plants.data || !settings.data) {
    return <Screen belowHeader>{null}</Screen>;
  }
  const initialMates = plant.sharedPot
    ? plants.data
        .filter((p) => p.sharedPot === plant.sharedPot && p.id !== plant.id)
        .map((p) => p.id)
    : [];
  const care = careFor(plant.groupId, plant.speciesId);
  const initialExtras = loaded
    .data!.schedules.filter((x) => x.task !== 'water' && x.task !== 'fertilize' && x.enabled)
    .map((x) => ({ task: x.task, label: x.label, intervalDays: x.intervalDays }));
  const schedule = (task: 'water' | 'fertilize') => {
    const s = loaded.data!.schedules.find((x) => x.task === task);
    return { enabled: s?.enabled ?? false, intervalDays: s?.intervalDays ?? 7 };
  };
  const value: PlantFormValue = form ?? {
    nickname: plant.nickname ?? '',
    roomId: plant.roomId,
    potSize: plant.potSize,
    potDrainage: plant.potDrainage,
    potMaterial: plant.potMaterial,
    potDiameter: formatDiameter(plant.potDiameterCm, unit),
    inGround: plant.inGround,
    potMates: initialMates,
    water: schedule('water'),
    fertilize: schedule('fertilize'),
    extras: initialExtras,
  };

  const spot: SpotValue = spotForm ?? {
    light: plant.spotLight,
    lux: plant.spotLux,
    growLight: plant.spotGrowLight,
    draught: plant.spotDraught,
    nearHeater: plant.nearHeater,
  };
  const room = rooms.data.find((r) => r.id === (value.roomId ?? plant.roomId));

  // A new pot re-suggests the watering interval, unless it was set by hand.
  const update = (next: PlantFormValue) => {
    const suggest = (v: PlantFormValue) =>
      suggestedWaterDays(
        care.water.days,
        v.potSize,
        v.potMaterial,
        diameterCm(v.potDiameter, unit),
        isInGround(v, rooms.data!),
      );
    const before = suggest(value);
    const after = suggest(next);
    if (before !== after && value.water.intervalDays === before) {
      next = { ...next, water: { ...next.water, intervalDays: after } };
    }
    setForm(next);
  };

  const ground = isInGround(value, rooms.data);

  // A cutting is still rooting on its own, so it can't share a pot yet.
  const mateCandidates = plant.propStage
    ? []
    : plants.data.filter((p) => p.id !== plant.id && !p.propStage);
  const formProps = {
    value,
    onChange: update,
    rooms: rooms.data,
    unit,
    mateCandidates,
    namePlaceholder: displayName({ ...plant, nickname: null }),
    pausedInWinter: !(care.fertilize?.winter ?? false),
    inFold: true,
  };
  const summary = (section: FormSection) =>
    sectionSummary(section, value, {
      rooms: rooms.data!,
      unit,
      plants: mateCandidates,
      name: displayName({ ...plant, nickname: null }),
    });
  // Every section starts closed; tap to open (several can be open).
  const fold = (key: string, title: string, text: string) => ({
    title,
    summary: text,
    open: openFolds.includes(key),
    onToggle: () =>
      setOpenFolds((o) => (o.includes(key) ? o.filter((k) => k !== key) : [...o, key])),
  });

  const save = async () => {
    setBusy(true);
    try {
      await updatePlant(db, plant.id, {
        nickname: value.nickname,
        roomId: value.roomId ?? plant.roomId,
        potSize: value.potSize,
        potDrainage: value.potDrainage,
        potMaterial: value.potMaterial,
        potDiameterCm: diameterCm(value.potDiameter, unit),
        inGround: ground,
        spotLight: spot.light,
        // A measured reading only stands while its light is kept.
        spotLux: spot.light != null ? spot.lux : null,
        spotGrowLight: spot.growLight,
        // Draughts and heaters are indoor things.
        spotDraught: room?.outdoor ? null : spot.draught,
        nearHeater: room?.outdoor ? false : spot.nearHeater,
      });
      // A plant in the ground isn't in anyone's pot.
      const mates = ground ? [] : value.potMates;
      const matesChanged =
        mates.length !== initialMates.length || mates.some((m) => !initialMates.includes(m));
      await setSchedule(db, plant.id, 'water', value.water);
      await setSchedule(db, plant.id, 'fertilize', value.fertilize);
      // After the schedules, so lining up the pot takes this edit into account.
      if (matesChanged) await setPotMates(db, plant.id, mates);
      // One pot: the same room, spot, size and material for every plant in it.
      await syncPotDetails(db, plant.id);
      for (const extra of namedExtras(value.extras)) {
        await setSchedule(db, plant.id, extra.task, {
          intervalDays: extra.intervalDays,
          enabled: true,
          label: extra.label,
        });
      }
      const kept = new Set(namedExtras(value.extras).map((e) => e.task));
      for (const old of initialExtras) {
        if (!kept.has(old.task)) await removeSchedule(db, plant.id, old.task);
      }
      successFeedback();
      router.back();
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    const name = displayName(plant);
    Alert.alert(
      `Delete ${name}?`,
      'Its journal and photos are deleted too. This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const files = await deletePlant(db, plant.id);
            deletePhotoFiles(files);
            router.dismissAll();
          },
        },
      ],
    );
  };

  return (
    <Screen belowHeader footer={<Button title="Save" icon="check" onPress={save} busy={busy} />}>
      <Fold {...fold('name', 'Name and room', summary('name'))}>
        <PlantForm {...formProps} section="name" />
        <PlantForm {...formProps} section="room" />
      </Fold>
      {!ground && (
        <Fold {...fold('pot', 'Pot', summary('pot'))}>
          <PlantForm {...formProps} section="pot" />
        </Fold>
      )}
      {room && (
        <Fold {...fold('spot', 'Its spot', spotSummary(spot, room))}>
          <SpotFields value={spot} onChange={setSpot} room={room} inFold />
        </Fold>
      )}
      <Fold {...fold('care', 'Watering and feeding', summary('care'))}>
        <PlantForm {...formProps} section="care" />
      </Fold>
      <Fold {...fold('extras', 'Other reminders', summary('extras'))}>
        <PlantForm {...formProps} section="extras" />
      </Fold>
      <Button
        title="Move to archive"
        icon="archive"
        variant="secondary"
        onPress={() => router.push({ pathname: '/plant/archive/[id]', params: { id: plant.id } })}
      />
      <ThemedText type="caption" color="textSecondary">
        For a plant that died or that you gave away: it stops getting reminders, and its journal and
        photos are kept.
      </ThemedText>
      <Button title="Delete plant" icon="trash" variant="ghost" onPress={remove} />
    </Screen>
  );
}
