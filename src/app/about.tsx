import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Linking, StyleSheet, View } from 'react-native';

import { ALL_GROUPS, ALL_SPECIES } from '@/catalog';
import { ASPCA, ASPCA_RETRIEVED } from '@/catalog/aspca';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Card, Divider, ListRow } from '@/components/ui';
import { Spacing } from '@/constants/theme';

const SOURCES = [
  {
    title: 'GrowSpot light datasets',
    detail:
      'Species names and light levels, and the lux bands the light meter uses. CC BY 4.0 — attribution: GrowSpot, growspotapp.com.',
    url: 'https://growspotapp.com/data/',
  },
  {
    title: 'NASA POWER climate data',
    detail:
      'Monthly night temperatures for outdoor months, from NASA’s POWER project (power.larc.nasa.gov), built into the app.',
    url: 'https://power.larc.nasa.gov',
  },
  {
    title: 'ASPCA toxic and non-toxic plant lists',
    detail: `Pet safety for the ${Object.keys(ASPCA).length} plants these lists cover (checked ${ASPCA_RETRIEVED}). Other plants are judged by related plants and say so.`,
    url: 'https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants',
  },
  {
    title: 'Phosphor Icons',
    detail: 'Icons. MIT licence.',
    url: 'https://phosphoricons.com',
  },
] as const;

export default function AboutScreen() {
  return (
    <Screen belowHeader>
      <View style={styles.group}>
        <ThemedText type="heading">Plantaloon {Constants.expoConfig?.version}</ThemedText>
        <ThemedText type="body">
          A free, open-source houseplant care app. No accounts, no ads, no tracking: your plants,
          journal and photos stay on this phone unless you save a backup.
        </ThemedText>
        <ThemedText type="body" color="textSecondary">
          The catalog has {ALL_SPECIES.length.toLocaleString()} plants in {ALL_GROUPS.length} care
          groups. Care guides are general guidance written for Plantaloon, not professional advice.
          If a pet or person may have eaten a plant, contact a vet, doctor or poison control
          service.
        </ThemedText>
      </View>
      <Card>
        {SOURCES.map((source, i) => (
          <View key={source.title} style={styles.gap}>
            {i > 0 && <Divider />}
            <ListRow
              icon="book-open-text"
              title={source.title}
              subtitle={source.detail}
              onPress={() => Linking.openURL(source.url)}
            />
          </View>
        ))}
      </Card>
      <Card>
        <ListRow
          icon="image"
          title="Plant photos"
          subtitle="From Wikimedia Commons, by many photographers under free licences. See every credit."
          onPress={() => router.push('/credits')}
        />
      </Card>
      <ThemedText type="caption" color="textSecondary">
        Plantaloon is free software under the GNU General Public License, version 3 or later.
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.two },
  gap: { gap: Spacing.three },
});
