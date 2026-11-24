import { router, useFocusEffect } from 'expo-router';
import { LightSensor } from 'expo-sensors';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { careFor, displayName } from '@/catalog';
import { Icon } from '@/components/icons/icon';
import { LightDial } from '@/components/light-dial';
import { sensitivityLabel } from '@/components/sensitivity-field';
import { PlantAvatar } from '@/components/plant-avatar';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Divider, EmptyState, pressedStyle, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { setPlantLight, setRoomLight } from '@/db/garden';
import { useSettings } from '@/db/use-settings';
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
  const settings = useSettings();
  const { width } = useWindowDimensions();
  const [sensor, setSensor] = useState<SensorState>('checking');
  const [rawLux, setLux] = useState<number | null>(null);
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

  const calibration = settings.data?.lightCalibration ?? 1;
  const lux = rawLux == null ? null : rawLux * calibration;

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

      {/* The sensitivity setting lives in Settings; this is the way there. */}
      <Pressable
        accessibilityRole="button"
        onPress={() => router.navigate('/settings')}
        style={({ pressed }) => [styles.adjust, pressed && pressedStyle]}>
        <ThemedText type="body" color="textSecondary" style={styles.flex}>
          Readings look off? Sensor sensitivity:{' '}
          <ThemedText type="label" color="tint">
            {sensitivityLabel(calibration)}
          </ThemedText>
        </ThemedText>
        <Icon name="caret-right" size={18} color={theme.textSecondary} duotone={false} />
      </Pressable>

      {tier && tier !== 'too_dark' && rooms.length > 0 && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.section}>
          <SectionTitle>Save as a room’s light</SectionTitle>
          <Card>
            {rooms.map((room, i) => (
              <View key={room.id} style={styles.gap}>
                {i > 0 && <Divider />}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Save as ${room.name}’s light`}
                  onPress={async () => {
                    await setRoomLight(db, room.id, tier, lux!);
                    successFeedback();
                    setSavedTo(room.id);
                  }}
                  style={({ pressed }) => [styles.row, pressed && pressedStyle]}>
                  <Icon name={room.icon} size={22} color={theme.textSecondary} />
                  <View style={styles.flex}>
                    <ThemedText numberOfLines={1}>{room.name}</ThemedText>
                    <ThemedText type="caption" color="textSecondary">
                      {room.lightTier ? `Now: ${LIGHT_LABEL[room.lightTier]}` : 'Light not set'}
                    </ThemedText>
                  </View>
                  {savedTo === room.id ? (
                    <Icon name="check-circle" size={24} color={theme.tint} />
                  ) : (
                    <ThemedText type="label" style={{ color: theme.tint }}>
                      Save
                    </ThemedText>
                  )}
                </Pressable>
              </View>
            ))}
          </Card>
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
                    <FitPill fit={fit} />
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
                        style={({ pressed }) => [styles.pin, pressed && pressedStyle]}>
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

/** Just right: filled with a check. Fine: outlined. Too dark or bright: a warning. */
function FitPill({ fit }: { fit: LightFit }) {
  const theme = useTheme();
  const look =
    fit === 'ideal'
      ? { bg: theme.tint, fg: theme.onTint, border: theme.tint, icon: 'check' as const }
      : fit === 'ok'
        ? { bg: 'transparent', fg: theme.tint, border: theme.tint, icon: null }
        : {
            bg: theme.warningSoft,
            fg: theme.warning,
            border: 'transparent',
            icon: 'warning' as const,
          };
  return (
    <View style={[styles.fit, { backgroundColor: look.bg, borderColor: look.border }]}>
      {look.icon && <Icon name={look.icon} size={14} color={look.fg} duotone={false} />}
      {/* One line, simple breaking: Android can otherwise drop "dark". */}
      <ThemedText
        type="label"
        numberOfLines={1}
        textBreakStrategy="simple"
        style={{ color: look.fg }}>
        {FIT_TEXT[fit]}
      </ThemedText>
    </View>
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
  adjust: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 48,
    marginTop: -Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  pin: { padding: Spacing.two },
  fit: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 2,
  },
});
