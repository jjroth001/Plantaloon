import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { getGuide } from '@/catalog/media';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Card, IconBadge } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/theme/theme-provider';

/** A short "learn more" article: a pest, a warning sign, a way to propagate, or a how-to. */
export default function GuideScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const guide = getGuide(id);
  if (!guide) return <Screen belowHeader>{null}</Screen>;
  const warn = guide.kind === 'pest' || guide.kind === 'sign';
  const color = warn ? theme.danger : theme.tint;
  const background = warn ? theme.dangerSoft : theme.tintSoft;

  return (
    <Screen belowHeader>
      <Stack.Screen options={{ title: '' }} />
      <View style={styles.header}>
        <IconBadge icon={guide.icon} color={color} background={background} size={64} />
        <ThemedText type="title">{guide.title}</ThemedText>
        <ThemedText type="body" color="textSecondary">
          {guide.summary}
        </ThemedText>
      </View>
      {guide.sections.map((section) => (
        <Card key={section.heading}>
          <ThemedText type="subheading">{section.heading}</ThemedText>
          {section.points.map((point) => (
            <View key={point} style={styles.point}>
              <View style={[styles.bullet, { backgroundColor: color }]} />
              <ThemedText type="body" style={styles.flex}>
                {point}
              </ThemedText>
            </View>
          ))}
        </Card>
      ))}
      <ThemedText type="caption" color="textSecondary">
        General guidance written for Plantaloon. If you use a spray or treatment, follow its label
        and keep it away from pets and children.
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { gap: Spacing.two },
  point: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 9, marginLeft: 4 },
});
