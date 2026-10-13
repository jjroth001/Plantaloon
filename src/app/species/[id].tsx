import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { StyleSheet, View } from 'react-native';

import { careFor, getGroup, getSpecies } from '@/catalog';
import { descriptionFor, detailsFor } from '@/catalog/media';
import {
  AboutSection,
  CareSection,
  GrowingSection,
  ProblemsSection,
  QuickFacts,
  Section,
  SectionTabs,
  useSections,
  type SectionName,
} from '@/components/care/care-sections';
import { CatalogImage, PhotoCredit } from '@/components/catalog-photo';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button, IconButton } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { listWishes, setWished } from '@/db/wishlist';
import { useDbQuery } from '@/db/use-db-query';
import { useSettings } from '@/db/use-settings';
import { useClimateLows } from '@/hooks/use-climate';
import { successFeedback, tapFeedback } from '@/lib/haptics';
import { useTheme } from '@/theme/theme-provider';

const SECTIONS: SectionName[] = ['care', 'about', 'growing', 'problems'];

/** A catalog plant's full care sheet, before (or without) adding it. */
export default function SpeciesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const theme = useTheme();
  const settings = useSettings();
  const wishes = useDbQuery(['wish'], listWishes);
  const lows = useClimateLows();
  const { scrollRef, register, scrollTo, onScroll, onScrollBeginDrag, onTabsLayout, active } =
    useSections(SECTIONS);
  const species = getSpecies(id);
  if (!species) return <Screen belowHeader>{null}</Screen>;

  const care = careFor(species.groupId, species.id);
  const details = detailsFor(species.groupId);
  const description = descriptionFor(species.id) ?? getGroup(species.groupId).summary;
  const wished = wishes.data?.includes(species.id) ?? false;
  const unit = settings.data?.temperatureUnit ?? 'C';
  const winterWaterDays = Math.max(
    care.water.days,
    Math.round(care.water.days * care.water.winterFactor),
  );

  const toggleWish = async () => {
    if (wished) tapFeedback();
    else successFeedback();
    await setWished(db, species.id, !wished);
  };

  const children = [
    <View key="hero" style={styles.hero}>
      <CatalogImage
        speciesId={species.id}
        groupId={species.groupId}
        size={200}
        radius={Radius.large + 8}
      />
      <PhotoCredit speciesId={species.id} />
      <ThemedText type="title" style={styles.center}>
        {species.common[0] ?? species.scientific}
      </ThemedText>
      <ThemedText type="body" color="textSecondary" style={[styles.center, styles.italic]}>
        {species.scientific}
      </ThemedText>
      {species.common.length > 1 && (
        <ThemedText type="caption" color="textSecondary" style={styles.center}>
          Also called {species.common.slice(1).join(', ')}
        </ThemedText>
      )}
    </View>,
    <ThemedText key="description" type="body">
      {description}
    </ThemedText>,
    <QuickFacts key="facts" care={care} waterDays={care.water.days} />,
    <SectionTabs
      key="tabs"
      sections={SECTIONS}
      active={active}
      onPress={scrollTo}
      onLayout={onTabsLayout}
    />,
    <Section key="care" onLayout={register('care')}>
      <CareSection
        care={care}
        details={details}
        context={{ waterDays: care.water.days, winterWaterDays }}
      />
    </Section>,
    <Section key="about" title="About" onLayout={register('about')}>
      <AboutSection care={care} details={details} />
    </Section>,
    <Section key="growing" title="Growing" onLayout={register('growing')}>
      <GrowingSection care={care} details={details} unit={unit} lows={lows} />
    </Section>,
    <Section key="problems" title="Problems" onLayout={register('problems')}>
      <ProblemsSection details={details} />
    </Section>,
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <IconButton
              icon="heart"
              label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
              onPress={toggleWish}
              color={wished ? theme.onTint : theme.text}
              background={wished ? theme.danger : theme.element}
            />
          ),
        }}
      />
      <Screen
        belowHeader
        ref={scrollRef}
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        stickyHeaderIndices={[3]}
        footer={
          <Button
            title="Add to my plants"
            icon="plus"
            onPress={() =>
              router.push({ pathname: '/add/details', params: { speciesId: species.id } })
            }
          />
        }>
        {children}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: Spacing.two },
  center: { textAlign: 'center' },
  italic: { fontStyle: 'italic' },
});
