import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import type { LightTier } from '@/catalog/types';
import { Icon, type IconName } from '@/components/icons/icon';
import { LightScale } from '@/components/light-scale';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import {
  Button,
  Card,
  Divider,
  Field,
  Segmented,
  SwitchRow,
  TextField,
} from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { createRoom, deleteRoom, updateRoom } from '@/db/garden';
import { ROOM_ICONS, type RoomHumidity, type RoomWarmth } from '@/db/types';
import { useSettings } from '@/db/use-settings';
import { useGarden } from '@/hooks/use-garden';
import { successFeedback, tapFeedback } from '@/lib/haptics';
import { formatLux, LIGHT_HINT, LIGHT_LABEL } from '@/lib/light';
import { useTheme } from '@/theme/theme-provider';

type Form = {
  name: string;
  icon: IconName;
  lightTier: LightTier | null;
  growLight: boolean;
  humidity: RoomHumidity | null;
  warmth: RoomWarmth | null;
  draught: boolean;
  outdoor: boolean;
};

/** Add a room (id "new") or edit one. */
export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const theme = useTheme();
  const garden = useGarden();
  const unit = useSettings().data?.temperatureUnit ?? 'C';
  const isNew = id === 'new';
  const room = garden.data?.rooms.find((r) => r.id === id);
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);

  if (!garden.data || (!isNew && !room)) return <Screen belowHeader>{null}</Screen>;
  const value: Form = form ?? {
    name: room?.name ?? '',
    icon: room?.icon ?? 'couch',
    lightTier: room?.lightTier ?? null,
    growLight: room?.growLight ?? false,
    humidity: room?.humidity ?? null,
    warmth: room?.warmth ?? null,
    draught: room?.draught ?? false,
    outdoor: room?.outdoor ?? false,
  };
  const set = (patch: Partial<Form>) => setForm({ ...value, ...patch });
  const others = garden.data.rooms.filter((r) => r.id !== id);
  const plantCount = garden.data.plants.filter((p) => p.roomId === id).length;

  const save = async () => {
    if (!value.name.trim()) return;
    setBusy(true);
    try {
      // Air, warmth and draughts are indoor settings; clear them for an outdoor spot.
      const input = value.outdoor
        ? { ...value, humidity: null, warmth: null, draught: false }
        : value;
      if (isNew) await createRoom(db, input);
      else await updateRoom(db, id, input);
      successFeedback();
      router.back();
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    if (!room) return;
    if (others.length === 0) {
      Alert.alert(
        'This is your only room',
        'Add another room first, so its plants have somewhere to go.',
      );
      return;
    }
    if (plantCount === 0) {
      Alert.alert(`Delete ${room.name}?`, undefined, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteRoom(db, room.id, null);
            router.back();
          },
        },
      ]);
      return;
    }
    // Android shows up to three buttons; offer the first two other rooms.
    Alert.alert(
      `Move ${plantCount === 1 ? 'its plant' : `its ${plantCount} plants`} where?`,
      `${room.name} will be deleted and its plants moved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...others.slice(0, 2).map((target) => ({
          text: target.name,
          onPress: async () => {
            await deleteRoom(db, room.id, target.id);
            router.back();
          },
        })),
      ],
    );
  };

  return (
    <Screen
      belowHeader
      footer={
        <Button
          title={isNew ? 'Add room' : 'Save'}
          icon="check"
          onPress={save}
          busy={busy}
          disabled={!value.name.trim()}
        />
      }>
      <TextField
        label="Name"
        value={value.name}
        onChangeText={(name) => set({ name })}
        placeholder="e.g. Sunroom"
        autoFocus={isNew}
        maxLength={30}
      />
      <Field label="Icon">
        <View style={styles.icons}>
          {ROOM_ICONS.map((icon) => {
            const selected = value.icon === icon;
            return (
              <Pressable
                key={icon}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={icon}
                onPress={() => {
                  tapFeedback();
                  set({ icon });
                }}
                style={[
                  styles.iconCell,
                  {
                    backgroundColor: selected ? theme.tintSoft : theme.element,
                    borderColor: selected ? theme.tint : 'transparent',
                  },
                ]}>
                <Icon name={icon} size={26} color={selected ? theme.tint : theme.textSecondary} />
              </Pressable>
            );
          })}
        </View>
      </Field>
      <Field label="Light">
        <LightScale value={value.lightTier} onChange={(lightTier) => set({ lightTier })} />
        <View style={styles.lightNote}>
          <ThemedText type="caption" color="textSecondary" style={styles.flex}>
            {value.lightTier
              ? `${LIGHT_LABEL[value.lightTier]}: ${LIGHT_HINT[value.lightTier].toLowerCase()}`
              : 'Not set yet. Tap the scale, or measure it with the Light tab.'}
            {room?.lightLux != null && value.lightTier === room.lightTier
              ? ` Last measured ${formatLux(room.lightLux)} lux.`
              : ''}
          </ThemedText>
          {value.lightTier != null && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear the light"
              hitSlop={8}
              onPress={() => set({ lightTier: null })}
              style={({ pressed }) => pressed && { opacity: 0.6 }}>
              <ThemedText type="caption" style={{ color: theme.tint }}>
                Clear
              </ThemedText>
            </Pressable>
          )}
        </View>
      </Field>
      <Card>
        <SwitchRow
          title="Grow light"
          subtitle="Counts as at least bright, indirect light"
          value={value.growLight}
          onChange={(growLight) => set({ growLight })}
        />
        <Divider />
        <SwitchRow
          title="Outdoors"
          subtitle="A balcony, patio or garden: plants here follow the weather"
          value={value.outdoor}
          onChange={(outdoor) => set({ outdoor })}
        />
        {!value.outdoor && (
          <>
            <Divider />
            <SwitchRow
              title="Draughty"
              subtitle="Near an outside door, a leaky window or air conditioning"
              value={value.draught}
              onChange={(draught) => set({ draught })}
            />
          </>
        )}
      </Card>
      <ThemedText type="caption" color="textSecondary">
        These are the room’s usual conditions. A plant that sits somewhere different, like a sunny
        sill or beside a radiator, can have its own spot on Edit plant.
      </ThemedText>
      {!value.outdoor && (
        <>
          <Field label="Air">
            <Segmented
              options={[
                { value: 'unset', label: 'Not set' },
                { value: 'dry', label: 'Dry' },
                { value: 'normal', label: 'Normal' },
                { value: 'humid', label: 'Humid' },
              ]}
              value={value.humidity ?? 'unset'}
              onChange={(v) => set({ humidity: v === 'unset' ? null : v })}
            />
            <ThemedText type="caption" color="textSecondary">
              Heated rooms in winter are often dry; bathrooms and kitchens are usually humid.
            </ThemedText>
          </Field>
          <Field label="Warmth">
            <Segmented
              options={[
                { value: 'unset', label: 'Not set' },
                { value: 'cool', label: 'Cool' },
                { value: 'normal', label: 'Average' },
                { value: 'warm', label: 'Warm' },
              ]}
              value={value.warmth ?? 'unset'}
              onChange={(v) => set({ warmth: v === 'unset' ? null : v })}
            />
            <ThemedText type="caption" color="textSecondary">
              Cool means under {unit === 'F' ? '59 °F' : '15 °C'}; warm means over{' '}
              {unit === 'F' ? '75 °F' : '24 °C'}.
            </ThemedText>
          </Field>
        </>
      )}
      {!isNew && <Button title="Delete room" icon="trash" variant="ghost" onPress={remove} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  lightNote: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  icons: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  iconCell: {
    width: 56,
    height: 56,
    borderRadius: Radius.medium,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
