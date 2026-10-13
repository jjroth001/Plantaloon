import { FlatList, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CATALOG_PHOTOS } from '@/catalog/photos';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/theme/theme-provider';

const ROWS = Object.entries(CATALOG_PHOTOS).map(([id, [, author, licence, page]]) => ({
  id,
  name: id.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase()),
  author,
  licence,
  page,
}));

/** Every catalog photo's author and licence, each linking to its Wikimedia Commons page. */
export default function CreditsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      data={ROWS}
      keyExtractor={(r) => r.id}
      contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.five }]}
      ListHeaderComponent={
        <ThemedText type="body" color="textSecondary" style={styles.header}>
          Plant photos come from Wikimedia Commons, shared by their photographers under free
          licences. They were shrunk and cropped to fit. Tap one to see the original.
        </ThemedText>
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="link"
          onPress={() => Linking.openURL(item.page)}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
          <View style={styles.flex}>
            <ThemedText type="label" style={styles.italic}>
              {item.name}
            </ThemedText>
            <ThemedText type="caption" color="textSecondary" numberOfLines={2}>
              {item.author} · {item.licence}
            </ThemedText>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: Spacing.three + Spacing.one },
  header: { marginBottom: Spacing.three },
  row: { paddingVertical: Spacing.two },
  flex: { flex: 1 },
  italic: { fontStyle: 'italic' },
});
