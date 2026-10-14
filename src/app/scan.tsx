import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { getGroup } from '@/catalog';
import { CatalogImage } from '@/components/catalog-photo';
import { Icon } from '@/components/icons/icon';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Divider, EmptyState, IconBadge } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { successFeedback } from '@/lib/haptics';
import { pickImage, type PickedImage } from '@/lib/photos';
import {
  downloadScanner,
  scanPhoto,
  SCAN_MODEL_MB,
  scannerReady,
  scannerSupported,
  type ScanMatch,
} from '@/lib/scanner';
import { useTheme } from '@/theme/theme-provider';

type State =
  | { kind: 'idle' }
  | { kind: 'scanning'; photo: PickedImage }
  | { kind: 'done'; photo: PickedImage; matches: ScanMatch[] };

/** Identify a plant from a photo, on the phone, against the catalog. */
export default function ScanScreen() {
  const theme = useTheme();
  const [ready, setReady] = useState(() => scannerSupported && scannerReady());
  const [progress, setProgress] = useState<number | null>(null);
  const [state, setState] = useState<State>({ kind: 'idle' });
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  if (!scannerSupported) {
    return (
      <Screen belowHeader>
        <EmptyState
          icon="camera"
          title="Scanning needs the installed app"
          body="Plant scanning uses code that isn’t available in Expo Go. Install the Plantaloon app to use it."
        />
      </Screen>
    );
  }

  const download = async () => {
    abort.current = new AbortController();
    setProgress(0);
    try {
      await downloadScanner(setProgress, abort.current.signal);
      successFeedback();
      setReady(true);
    } catch (error) {
      if (!abort.current?.signal.aborted) {
        Alert.alert('Download didn’t finish', (error as Error).message);
      }
    } finally {
      setProgress(null);
      abort.current = null;
    }
  };

  const scan = async (source: 'camera' | 'library') => {
    try {
      const photo = await pickImage(source);
      if (!photo) return;
      setState({ kind: 'scanning', photo });
      const matches = await scanPhoto(photo.uri, photo.width, photo.height);
      successFeedback();
      setState({ kind: 'done', photo, matches });
    } catch (error) {
      setState({ kind: 'idle' });
      Alert.alert('Couldn’t scan that photo', (error as Error).message);
    }
  };

  if (!ready) {
    return (
      <Screen belowHeader>
        <View style={styles.hero}>
          <IconBadge
            icon="magnifying-glass-plus"
            color={theme.tint}
            background={theme.tintSoft}
            size={88}
          />
          <ThemedText type="heading" style={styles.center}>
            Identify plants from a photo
          </ThemedText>
          <ThemedText type="body" color="textSecondary" style={styles.center}>
            The scanner runs entirely on your phone: photos are never uploaded. It needs a one-time
            download of {SCAN_MODEL_MB} MB, so Wi-Fi is best.
          </ThemedText>
        </View>
        {progress == null ? (
          <Button
            title={`Download the scanner (${SCAN_MODEL_MB} MB)`}
            icon="download-simple"
            onPress={download}
          />
        ) : (
          <Card>
            <ThemedText type="label">Downloading… {Math.round(progress * 100)}%</ThemedText>
            <View style={[styles.track, { backgroundColor: theme.element }]}>
              <View
                style={[styles.bar, { width: `${progress * 100}%`, backgroundColor: theme.tint }]}
              />
            </View>
            <Button
              title="Cancel"
              variant="ghost"
              size="small"
              onPress={() => abort.current?.abort()}
            />
          </Card>
        )}
        <ThemedText type="caption" color="textSecondary">
          Recognition uses BioCLIP (MIT licence), an open model trained on photos of living things,
          tuned for houseplants with openly licensed photos from iNaturalist contributors. You can
          remove it in Settings.
        </ThemedText>
      </Screen>
    );
  }

  return (
    <Screen
      belowHeader
      footer={
        <View style={styles.buttons}>
          <Button
            title="Take photo"
            icon="camera"
            style={styles.flex}
            onPress={() => scan('camera')}
          />
          <Button
            title="Gallery"
            icon="image"
            variant="secondary"
            style={styles.flex}
            onPress={() => scan('library')}
          />
        </View>
      }>
      {state.kind === 'idle' && (
        <View style={styles.hero}>
          <IconBadge icon="camera" color={theme.tint} background={theme.tintSoft} size={88} />
          <ThemedText type="heading" style={styles.center}>
            Photograph a plant
          </ThemedText>
          <ThemedText type="body" color="textSecondary" style={styles.center}>
            Fill the frame with leaves, in good light. You’ll get the closest matches to choose
            from, with photos to compare.
          </ThemedText>
        </View>
      )}

      {state.kind !== 'idle' && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.photoWrap}>
          <Image source={{ uri: state.photo.uri }} style={styles.photo} contentFit="cover" />
          {state.kind === 'scanning' && (
            <ThemedText type="label" color="textSecondary">
              Looking closely…
            </ThemedText>
          )}
        </Animated.View>
      )}

      {state.kind === 'done' && (
        <Animated.View entering={FadeInDown.duration(220)} style={styles.section}>
          <ThemedText type="subheading">Is it one of these?</ThemedText>
          <Card>
            {state.matches.map((match, i) => (
              <View key={match.species.id} style={styles.gap}>
                {i > 0 && <Divider />}
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({ pathname: '/species/[id]', params: { id: match.species.id } })
                  }
                  style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
                  <CatalogImage
                    speciesId={match.species.id}
                    groupId={match.species.groupId}
                    size={i === 0 ? 72 : 56}
                    radius={Radius.medium}
                  />
                  <View style={styles.flex}>
                    {i === 0 && (
                      <ThemedText type="overline" style={{ color: theme.tint }}>
                        BEST MATCH
                      </ThemedText>
                    )}
                    <ThemedText type={i === 0 ? 'subheading' : 'default'} numberOfLines={1}>
                      {match.species.common[0] ?? match.species.scientific}
                    </ThemedText>
                    <ThemedText type="caption" color="textSecondary" numberOfLines={1}>
                      {match.species.scientific} · {getGroup(match.species.groupId).name}
                    </ThemedText>
                  </View>
                  <Icon name="caret-right" size={18} color={theme.textSecondary} duotone={false} />
                </Pressable>
              </View>
            ))}
          </Card>
          <Button
            title="None of these, search by name"
            icon="magnifying-glass"
            variant="ghost"
            onPress={() => router.back()}
          />
          <ThemedText type="caption" color="textSecondary">
            Varieties (like ‘Marble Queen’ pothos) look alike to the scanner. If yours is a named
            variety, search for it by name to get its own page.
          </ThemedText>
        </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  hero: { alignItems: 'center', gap: Spacing.three, paddingTop: Spacing.four },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  bar: { height: 8, borderRadius: 4 },
  buttons: { flexDirection: 'row', gap: Spacing.two },
  photoWrap: { alignItems: 'center', gap: Spacing.two },
  photo: { width: 200, height: 200, borderRadius: Radius.large },
  section: { gap: Spacing.three },
  gap: { gap: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
});
