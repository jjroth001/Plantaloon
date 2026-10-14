import { router } from 'expo-router';
import { useDeferredValue, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Species } from '@/catalog';
import { popularSpecies, searchSpecies } from '@/catalog/search-index';
import { Icon } from '@/components/icons/icon';
import { SpeciesRow } from '@/components/species-row';
import { ThemedText } from '@/components/themed-text';
import { IconButton, ListRow } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/theme/theme-provider';

/** Step 1 of adding a plant: find it in the catalog. */
export default function AddPlantSearch() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  // Typing stays smooth; results catch up a beat later.
  const deferred = useDeferredValue(query);
  const results: Species[] = deferred.trim() ? searchSpecies(deferred) : popularSpecies();

  const choose = (species: Species) =>
    router.push({ pathname: '/species/[id]', params: { id: species.id } });

  return (
    <View style={[styles.fill, { backgroundColor: theme.background }]}>
      <View style={styles.searchWrap}>
        <View style={[styles.search, { backgroundColor: theme.element }]}>
          <Icon name="magnifying-glass" size={20} color={theme.textSecondary} duotone={false} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, e.g. pothos"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text }]}
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search plants"
          />
        </View>
        <IconButton
          icon="camera"
          label="Scan a plant"
          onPress={() => router.push('/scan')}
          background={theme.tint}
          color={theme.onTint}
          size={52}
        />
      </View>
      <FlatList
        data={results}
        keyExtractor={(s) => s.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.five }]}
        ListHeaderComponent={
          <ThemedText type="overline" color="textSecondary" style={styles.heading}>
            {deferred.trim() ? (results.length ? 'MATCHES' : '') : 'POPULAR HOUSEPLANTS'}
          </ThemedText>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => <SpeciesRow species={item} onPress={() => choose(item)} />}
        ListEmptyComponent={
          <ThemedText type="body" color="textSecondary">
            No plants match “{deferred.trim()}”. Check the spelling, try another name, or add it as
            an unlisted plant below.
          </ThemedText>
        }
        ListFooterComponent={
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <ListRow
              icon="plus"
              title="Can’t find it?"
              subtitle="Add it as an unlisted plant and pick the closest match"
              onPress={() =>
                router.push({ pathname: '/add/group', params: { name: query.trim() } })
              }
            />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three + Spacing.one,
    paddingBottom: Spacing.two,
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    minHeight: 52,
  },
  input: { flex: 1, fontSize: 17, paddingVertical: Spacing.two },
  list: { paddingHorizontal: Spacing.three + Spacing.one, gap: Spacing.one },
  heading: { marginTop: Spacing.two, marginBottom: Spacing.two },
  separator: { height: Spacing.one },
  footer: {
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
  },
});
