import Constants from 'expo-constants';
import { Linking, StyleSheet, View } from 'react-native';

import { ALL_GROUPS, ALL_SPECIES } from '@/catalog';
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
    title: 'ASPCA toxic and non-toxic plant lists',
    detail: 'Pet safety notes follow these lists. Plantaloon’s wording is its own.',
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
