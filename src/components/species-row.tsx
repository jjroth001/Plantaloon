import { Pressable, StyleSheet, View } from 'react-native';

import { getGroup, type Species } from '@/catalog';
import { Icon } from '@/components/icons/icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/theme/theme-provider';

export function SpeciesRow({ species, onPress }: { species: Species; onPress: () => void }) {
  const theme = useTheme();
  const group = getGroup(species.groupId);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <View style={[styles.icon, { backgroundColor: theme.tintSoft }]}>
        <Icon name={group.icon} size={22} color={theme.tint} />
      </View>
      <View style={styles.text}>
        <ThemedText type="default" numberOfLines={1}>
          {species.common[0] ?? species.scientific}
        </ThemedText>
        <ThemedText type="caption" color="textSecondary" numberOfLines={1}>
          <ThemedText type="caption" color="textSecondary" style={styles.italic}>
            {species.scientific}
          </ThemedText>
          {` · ${group.name}`}
        </ThemedText>
      </View>
      <Icon name="caret-right" size={18} color={theme.textSecondary} duotone={false} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: 56 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 1 },
  italic: { fontStyle: 'italic' },
});
