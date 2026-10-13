import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { getSpecies } from '@/catalog';
import { Screen } from '@/components/screen';
import { SpeciesRow } from '@/components/species-row';
import { Button, Card, Divider, EmptyState } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { listWishes } from '@/db/wishlist';
import { useDbQuery } from '@/db/use-db-query';

/** Plants saved for later with the heart on a catalog page. */
export default function WishlistScreen() {
  const wishes = useDbQuery(['wish'], listWishes);
  const species = (wishes.data ?? []).map((id) => getSpecies(id)).filter((s) => s != null);

  return (
    <Screen belowHeader>
      {wishes.data && species.length === 0 ? (
        <EmptyState
          icon="heart"
          title="Nothing saved yet"
          body="Tap the heart on any plant in the catalog to keep it here for your next trip to the garden centre."
          action={
            <Button
              title="Browse plants"
              icon="magnifying-glass"
              onPress={() => router.push('/add')}
            />
          }
        />
      ) : (
        <Card>
          {species.map((s, i) => (
            <View key={s.id} style={styles.gap}>
              {i > 0 && <Divider />}
              <SpeciesRow
                species={s}
                onPress={() => router.push({ pathname: '/species/[id]', params: { id: s.id } })}
              />
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: Spacing.three },
});
