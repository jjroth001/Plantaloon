import { StyleSheet, Text, type TextProps } from 'react-native';

import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/theme/theme-provider';

export type ThemedTextProps = TextProps & {
  type?: 'title' | 'heading' | 'subheading' | 'default' | 'body' | 'label' | 'caption' | 'overline';
  color?: ThemeColor;
};

export function ThemedText({ style, type = 'default', color = 'text', ...rest }: ThemedTextProps) {
  const theme = useTheme();
  return <Text style={[{ color: theme[color] }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  title: { fontSize: 30, lineHeight: 36, fontWeight: 700, letterSpacing: -0.3 },
  heading: { fontSize: 21, lineHeight: 27, fontWeight: 700 },
  subheading: { fontSize: 17, lineHeight: 23, fontWeight: 600 },
  default: { fontSize: 16, lineHeight: 23, fontWeight: 500 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: 400 },
  label: { fontSize: 14, lineHeight: 19, fontWeight: 600 },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: 500 },
  overline: { fontSize: 12, lineHeight: 16, fontWeight: 700, letterSpacing: 0.6 },
});
