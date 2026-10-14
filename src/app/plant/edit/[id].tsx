import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert } from 'react-native';

import { careFor, displayName } from '@/catalog';
import {
  diameterCm,
  formatDiameter,
  namedExtras,
  PlantForm,
  type PlantFormValue,
} from '@/components/plant-form';
import { Screen } from '@/components/screen';
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
  const unit = useSettings().data?.temperatureUnit === 'F' ? 'in' : 'cm';
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
  const [busy, setBusy] = useState(false);

  const plant = loaded.data?.plant;
  if (!plant || !rooms.data || !plants.data) return <Screen belowHeader>{null}</Screen>;
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
    potMates: initialMates,
    water: schedule('water'),
    fertilize: schedule('fertilize'),
    extras: initialExtras,
  };

  // A new pot re-suggests the watering interval, unless it was set by hand.
  const update = (next: PlantFormValue) => {
    const suggest = (v: PlantFormValue) =>
      suggestedWaterDays(
        care.water.days,
        v.potSize,
        v.potMaterial,
        diameterCm(v.potDiameter, unit),
      );
    const before = suggest(value);
    const after = suggest(next);
    if (before !== after && value.water.intervalDays === before) {
      next = { ...next, water: { ...next.water, intervalDays: after } };
    }
    setForm(next);
  };

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
      });
      const matesChanged =
        value.potMates.length !== initialMates.length ||
        value.potMates.some((m) => !initialMates.includes(m));
      if (matesChanged) await setPotMates(db, plant.id, value.potMates);
      await setSchedule(db, plant.id, 'water', value.water);
      await setSchedule(db, plant.id, 'fertilize', value.fertilize);
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
      <PlantForm
        value={value}
        onChange={update}
        rooms={rooms.data}
        unit={unit}
        mateCandidates={plants.data.filter((p) => p.id !== plant.id && !p.propStage)}
        namePlaceholder={displayName({ ...plant, nickname: null })}
        pausedInWinter={!(care.fertilize?.winter ?? false)}
      />
      <Button title="Delete plant" icon="trash" variant="ghost" onPress={remove} />
    </Screen>
  );
}
