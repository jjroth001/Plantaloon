import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { Icon } from '@/components/icons/icon';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Divider, IconButton } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { moveRoom } from '@/db/garden';
import { useGarden } from '@/hooks/use-garden';
import { tapFeedback } from '@/lib/haptics';
import { LIGHT_LABEL } from '@/lib/light';
import { useTheme } from '@/theme/theme-provider';

/** All rooms: rename, reorder, set light, add or remove. */
export default function RoomsScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const garden = useGarden();
  const rooms = garden.data?.rooms ?? [];
  const plants = garden.data?.plants ?? [];

  return (
    <Screen
      belowHeader
      footer={
        <Button
          title="Add a room"
          icon="plus"
          onPress={() => router.push({ pathname: '/room/[id]', params: { id: 'new' } })}
        />
      }>
      <Card>
        {rooms.map((room, i) => {
          const count = plants.filter((p) => p.roomId === room.id).length;
          return (
            <Animated.View key={room.id} layout={LinearTransition.duration(200)} style={styles.gap}>
              {i > 0 && <Divider />}
              <View style={styles.row}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: '/room/[id]', params: { id: room.id } })}
                  style={({ pressed }) => [styles.main, pressed && { opacity: 0.7 }]}>
                  <View style={[styles.icon, { backgroundColor: theme.tintSoft }]}>
                    <Icon name={room.icon} size={22} color={theme.tint} />
                  </View>
                  <View style={styles.flex}>
                    <ThemedText>{room.name}</ThemedText>
                    <ThemedText type="caption" color="textSecondary">
                      {count === 1 ? '1 plant' : `${count} plants`}
                      {room.lightTier ? ` · ${LIGHT_LABEL[room.lightTier]}` : ' · Light not set'}
                    </ThemedText>
                  </View>
                </Pressable>
                {rooms.length > 1 && (
                  <>
                    <IconButton
                      icon="caret-down"
                      label={`Move ${room.name} down`}
                      size={36}
                      onPress={() => {
                        tapFeedback();
                        moveRoom(db, room.id, 1);
                      }}
                    />
                    <View style={styles.up}>
                      <IconButton
                        icon="caret-down"
                        label={`Move ${room.name} up`}
                        size={36}
                        onPress={() => {
                          tapFeedback();
                          moveRoom(db, room.id, -1);
                        }}
                      />
                    </View>
                  </>
                )}
              </View>
            </Animated.View>
          );
        })}
      </Card>
      <ThemedText type="caption" color="textSecondary">
        Tip: measure a room’s light with the Light tab and save it to the room.
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  up: { transform: [{ rotate: '180deg' }] },
});
