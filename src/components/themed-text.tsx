import { StyleSheet, Text, type TextProps } from 'react-native';

import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/theme/theme-provider';

/**
 * The display face (Fredoka, SIL Open Font License) for titles, section headings and plant
 * names; everything else uses the phone's own font. Each weight is its own family, so these
 * styles never set fontWeight (Android would fake a bolder face on top).
 */
export const DISPLAY = {
  medium: 'Fredoka_500Medium',
  semibold: 'Fredoka_600SemiBold',
} as const;

export type ThemedTextProps = TextProps & {
  type?:
    | 'title'
    | 'heading'
    | 'section'
    | 'name'
    | 'subheading'
    | 'default'
    | 'body'
    | 'label'
    | 'caption'
    | 'overline';
  color?: ThemeColor;
};

/**
 * How far each style may grow with the phone's text size. Big titles are already large, so
 * they stop sooner and don't push buttons off the screen; reading text grows freely.
 */
const MAX_SCALE: Partial<Record<NonNullable<ThemedTextProps['type']>, number>> = {
  title: 1.3,
  heading: 1.4,
  section: 1.5,
  name: 1.6,
};

export function ThemedText({ style, type = 'default', color = 'text', ...rest }: ThemedTextProps) {
  const theme = useTheme();
  return (
    <Text
      maxFontSizeMultiplier={MAX_SCALE[type]}
      style={[{ color: theme[color] }, styles[type], style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: DISPLAY.semibold, fontSize: 32, lineHeight: 40 },
  heading: { fontFamily: DISPLAY.semibold, fontSize: 22, lineHeight: 28 },
  /** A heading over a group of cards ("Coming up this week"). */
  section: { fontFamily: DISPLAY.semibold, fontSize: 19, lineHeight: 25 },
  /** A plant's name in lists and grids. */
  name: { fontFamily: DISPLAY.medium, fontSize: 17, lineHeight: 23 },
  subheading: { fontSize: 17, lineHeight: 23, fontWeight: 600 },
  default: { fontSize: 16, lineHeight: 23, fontWeight: 500 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: 400 },
  label: { fontSize: 14, lineHeight: 19, fontWeight: 600 },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: 500 },
  /** A small bold label in sentence case (never all caps). */
  overline: { fontSize: 13, lineHeight: 18, fontWeight: 700 },
});
