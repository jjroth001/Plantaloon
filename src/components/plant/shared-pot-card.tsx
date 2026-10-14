import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { displayName } from '@/catalog';
import { Icon } from '@/components/icons/icon';
import { PlantAvatar } from '@/components/plant-avatar';
import { ThemedText } from '@/components/themed-text';
import { Card, Divider } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import type { Garden } from '@/db/garden';
import type { Plant } from '@/db/types';
import { potMismatch } from '@/lib/pot-mismatch';
import { useTheme } from '@/theme/theme-provider';

/** For a plant sharing a pot: who else is in it, and a warning if their needs clash. */
export function SharedPotCard({ plant, garden }: { plant: Plant; garden: Garden }) {
  const theme = useTheme();
  if (!plant.sharedPot) return null;
  const members = garden.plants.filter((p) => p.sharedPot === plant.sharedPot);
  const others = members.filter((p) => p.id !== plant.id);
  if (others.length === 0) return null;
  const warning = potMismatch(members);

  return (
    <Card>
      <View style={styles.row}>
        <Icon name="potted-plant" size={24} color={theme.tint} />
        <View style={styles.flex}>
          <ThemedText type="subheading">Shares a pot</ThemedText>
          <ThemedText type="caption" color="textSecondary">
            Watering and feeding happen together for everything in this pot.
          </ThemedText>
        </View>
      </View>
      {others.map((other, i) => (
        <View key={other.id} style={styles.gap}>
          {i > 0 && <Divider />}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/plant/[id]', params: { id: other.id } })}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
            <PlantAvatar
              photo={garden.covers.get(other.id)}
              groupId={other.groupId}
              speciesId={other.speciesId}
              size={36}
            />
            <ThemedText style={styles.flex} numberOfLines={1}>
              {displayName(other)}
            </ThemedText>
            <Icon name="caret-right" size={18} color={theme.textSecondary} duotone={false} />
          </Pressable>
        </View>
      ))}
      {warning && (
        <View style={[styles.warning, { backgroundColor: theme.dangerSoft }]}>
          <Icon name="warning" size={20} color={theme.danger} />
          <ThemedText type="caption" style={[styles.flex, { color: theme.danger }]}>
            {warning}
          </ThemedText>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  warning: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
    borderRadius: 10,
    padding: Spacing.two + 2,
  },
});
