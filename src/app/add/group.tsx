import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ALL_GROUPS } from '@/catalog';
import { Icon } from '@/components/icons/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { normalize } from '@/lib/search';
import { useTheme } from '@/theme/theme-provider';

/** For a plant that isn't in the catalog: choose the care group it's most like. */
export default function ChooseGroup() {
  const { name } = useLocalSearchParams<{ name?: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('');
  const q = normalize(filter);
  const groups = q
    ? ALL_GROUPS.filter(
        (g) =>
          normalize(g.name).includes(q) || g.genera.some((genus) => normalize(genus).startsWith(q)),
      )
    : ALL_GROUPS;

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      data={groups}
      keyExtractor={(g) => g.id}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.five }]}
      ListHeaderComponent={
        <View style={styles.header}>
          <ThemedText type="body" color="textSecondary">
            Pick the kind of plant it’s most like. Its care, reminders and tips will follow that
            group. You can change it later.
          </ThemedText>
          <View style={[styles.search, { backgroundColor: theme.element }]}>
            <Icon name="magnifying-glass" size={20} color={theme.textSecondary} duotone={false} />
            <TextInput
              value={filter}
              onChangeText={setFilter}
              placeholder="Filter, e.g. fern or Hoya"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text }]}
              autoCorrect={false}
            />
          </View>
        </View>
      }
      ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: '/add/details',
              params: { groupId: item.id, name: name ?? '' },
            })
          }
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: theme.card, borderColor: theme.border },
            pressed && { opacity: 0.7 },
          ]}>
          <View style={[styles.icon, { backgroundColor: theme.tintSoft }]}>
            <Icon name={item.icon} size={22} color={theme.tint} />
          </View>
          <View style={styles.text}>
            <ThemedText type="default">{item.name}</ThemedText>
            <ThemedText type="caption" color="textSecondary" numberOfLines={2}>
              {item.summary}
            </ThemedText>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.three + Spacing.one, paddingTop: 0 },
  header: { gap: Spacing.three, marginBottom: Spacing.three },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    minHeight: 50,
  },
  input: { flex: 1, fontSize: 17, paddingVertical: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
});
