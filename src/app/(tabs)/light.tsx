import { router, useFocusEffect } from 'expo-router';
import { LightSensor } from 'expo-sensors';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { careFor, displayName } from '@/catalog';
import { Icon } from '@/components/icons/icon';
import { LightDial } from '@/components/light-dial';
import { PlantAvatar } from '@/components/plant-avatar';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Chip, Divider, EmptyState, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { setPlantLight, setRoomLight } from '@/db/garden';
import { useGarden } from '@/hooks/use-garden';
import { successFeedback, tapFeedback } from '@/lib/haptics';
import {
  formatLux,
  LIGHT_HINT,
  LIGHT_LABEL,
  lightFit,
  smoothLux,
  tierForLux,
  type LightFit,
} from '@/lib/light';
import { useTheme } from '@/theme/theme-provider';

type SensorState = 'checking' | 'ready' | 'missing';

const FIT_TEXT: Record<LightFit, string> = {
  ideal: 'Just right',
  ok: 'Fine',
  too_dark: 'Too dark',
  too_bright: 'Too bright',
};

export default function LightScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const garden = useGarden();
  const { width } = useWindowDimensions();
  const [sensor, setSensor] = useState<SensorState>('checking');
  const [lux, setLux] = useState<number | null>(null);
  const [held, setHeld] = useState(false);
  const [savedTo, setSavedTo] = useState<string | null>(null);
  const [savedPlant, setSavedPlant] = useState<string | null>(null);
  const heldRef = useRef(false);
  useEffect(() => {
    heldRef.current = held;
  }, [held]);

  // Listen to the sensor only while this tab is on screen.
  useFocusEffect(
    useCallback(() => {
      let subscription: { remove: () => void } | null = null;
      let active = true;
      (async () => {
        const available = Platform.OS === 'android' && (await LightSensor.isAvailableAsync());
        if (!active) return;
        if (!available) {
          setSensor('missing');
          return;
        }
        setSensor('ready');
        LightSensor.setUpdateInterval(400);
        subscription = LightSensor.addListener(({ illuminance }) => {
          if (heldRef.current) return;
          setLux((previous) => smoothLux(previous, illuminance));
        });
      })().catch(() => setSensor('missing'));
      return () => {
        active = false;
        subscription?.remove();
      };
    }, []),
  );

  if (sensor === 'missing') {
    return (
      <Screen title="Light meter">
        <EmptyState
          icon="sun-dim"
          title="No light sensor found"
          body="This phone doesn’t report its light sensor. You can still set each room’s light by hand: Low, Medium, Bright indirect or Direct sun."
          action={
            <Button title="Set room light" icon="house" onPress={() => router.push('/rooms')} />
          }
        />
      </Screen>
    );
  }

  const tier = lux == null ? null : tierForLux(lux);
  const rooms = garden.data?.rooms ?? [];
  const plants = garden.data?.plants ?? [];
  const dial = Math.min(width - Spacing.five * 2, 340);

  return (
    <Screen title="Light meter">
      <Card style={styles.meter}>
        <LightDial lux={lux} size={dial} />
        <View style={styles.reading} accessibilityLiveRegion="polite">
          <ThemedText type="title">{lux == null ? '—' : `${formatLux(lux)} lux`}</ThemedText>
          <ThemedText type="subheading" style={{ color: theme.tint }}>
            {tier == null
              ? 'Reading…'
              : tier === 'too_dark'
                ? 'Too dark for most plants'
                : LIGHT_LABEL[tier]}
          </ThemedText>
          <ThemedText type="body" color="textSecondary" style={styles.center}>
            {tier == null || tier === 'too_dark'
              ? 'Even low-light plants want a little more than this.'
              : LIGHT_HINT[tier]}
          </ThemedText>
        </View>
        <Button
          title={held ? 'Resume' : 'Hold reading'}
          icon={held ? 'arrows-clockwise' : 'check'}
          size="small"
          variant="secondary"
          onPress={() => {
            tapFeedback();
            setHeld((h) => !h);
          }}
        />
      </Card>

      <Card>
        <View style={styles.tip}>
          <Icon name="info" size={22} color={theme.tint} />
          <ThemedText type="body" style={styles.flex}>
            Hold the phone where the plant sits, screen facing the window, with nothing shading the
            top edge. Readings around midday on a normal day are most useful.
          </ThemedText>
        </View>
      </Card>

      {tier && tier !== 'too_dark' && rooms.length > 0 && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.section}>
          <SectionTitle>Save as a room’s light</SectionTitle>
          <View style={styles.chips}>
            {rooms.map((room) => (
              <Chip
                key={room.id}
                label={room.name}
                icon={savedTo === room.id ? 'check' : room.icon}
                selected={room.lightTier === tier}
                onPress={async () => {
                  await setRoomLight(db, room.id, tier, lux!);
                  successFeedback();
                  setSavedTo(room.id);
                }}
              />
            ))}
          </View>
        </Animated.View>
      )}

      {tier && plants.length > 0 && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.section}>
          <SectionTitle>How your plants would like it here</SectionTitle>
          {tier !== 'too_dark' && (
            <ThemedText type="caption" color="textSecondary">
              Measuring right where one plant sits? Tap its pin to save this as its own light.
            </ThemedText>
          )}
          <Card>
            {plants.map((plant, i) => {
              const fit = lightFit(tier, careFor(plant.groupId, plant.speciesId).light);
              const bad = fit === 'too_dark' || fit === 'too_bright';
              return (
                <View key={plant.id} style={styles.gap}>
                  {i > 0 && <Divider />}
                  <View style={styles.row}>
                    <PlantAvatar
                      photo={garden.data?.covers.get(plant.id)}
                      groupId={plant.groupId}
                      speciesId={plant.speciesId}
                      size={36}
                    />
                    <ThemedText style={styles.flex} numberOfLines={1}>
                      {displayName(plant)}
                    </ThemedText>
                    <View
                      style={[
                        styles.fit,
                        { backgroundColor: bad ? theme.dangerSoft : theme.tintSoft },
                      ]}>
                      {/* One line, simple breaking: Android can otherwise drop "dark". */}
                      <ThemedText
                        type="label"
                        numberOfLines={1}
                        textBreakStrategy="simple"
                        style={{ color: bad ? theme.danger : theme.tint }}>
                        {FIT_TEXT[fit]}
                      </ThemedText>
                    </View>
                    {tier !== 'too_dark' && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Save as ${displayName(plant)}’s own light`}
                        hitSlop={8}
                        onPress={async () => {
                          await setPlantLight(db, plant.id, tier, lux!);
                          successFeedback();
                          setSavedPlant(plant.id);
                        }}
                        style={({ pressed }) => [styles.pin, pressed && { opacity: 0.6 }]}>
                        <Icon
                          name={savedPlant === plant.id ? 'check' : 'map-pin'}
                          size={20}
                          color={theme.textSecondary}
                        />
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </Card>
        </Animated.View>
      )}
      <ThemedText type="caption" color="textSecondary">
        Light levels follow GrowSpot’s open houseplant light data (CC BY 4.0). Phone sensors vary,
        so treat readings as a guide.
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  gap: { gap: Spacing.three },
  meter: { alignItems: 'center', paddingTop: Spacing.four },
  reading: { alignItems: 'center', gap: Spacing.one },
  tip: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  section: { gap: Spacing.three },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  pin: { padding: Spacing.one },
  fit: {
    flexShrink: 0,
    borderRadius: 999,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 3,
  },
});
