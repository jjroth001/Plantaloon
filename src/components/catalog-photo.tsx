import { Image } from 'expo-image';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { getGroup } from '@/catalog';
import { catalogPhoto } from '@/catalog/media';
import { Icon } from '@/components/icons/icon';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/theme/theme-provider';

/** A catalog plant's Wikimedia Commons photo, or its group icon when there's none. */
export function CatalogImage({
  speciesId,
  groupId,
  size,
  radius,
}: {
  speciesId: string | null | undefined;
  groupId: string;
  size: number;
  radius?: number;
}) {
  const theme = useTheme();
  const photo = catalogPhoto(speciesId);
  const borderRadius = radius ?? size / 2;
  if (photo) {
    return (
      <Image
        source={photo.image}
        style={{ width: size, height: size, borderRadius, backgroundColor: theme.element }}
        contentFit="cover"
        transition={150}
        accessible={false}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius,
        backgroundColor: theme.tintSoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Icon name={getGroup(groupId).icon} size={Math.round(size * 0.5)} color={theme.tint} />
    </View>
  );
}

/** "Photo: Jane Doe, CC BY-SA 4.0 · Wikimedia Commons" — tap to open the photo's page. */
export function PhotoCredit({ speciesId }: { speciesId: string | null | undefined }) {
  const photo = catalogPhoto(speciesId);
  if (!photo) return null;
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => Linking.openURL(photo.page)}
      style={({ pressed }) => [styles.credit, pressed && { opacity: 0.6 }]}>
      <ThemedText type="caption" color="textSecondary" numberOfLines={2} style={styles.center}>
        {photo.ofSpecies ? 'Photo of the species. ' : ''}Photo: {photo.author}, {photo.licence} ·
        Wikimedia Commons
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  credit: { paddingHorizontal: 8 },
  center: { textAlign: 'center' },
});
