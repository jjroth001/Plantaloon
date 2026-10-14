/**
 * Small shared building blocks: cards, buttons, chips, rows, fields. Plain solid surfaces
 * in the theme's colors.
 */
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { Icon, type IconName } from '@/components/icons/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { tapFeedback } from '@/lib/haptics';
import { useTheme } from '@/theme/theme-provider';

// --- Card -------------------------------------------------------------------

export function Card({ style, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        !theme.dark && styles.cardShadow,
        style,
      ]}
      {...rest}
    />
  );
}

// --- Buttons ----------------------------------------------------------------

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'large' | 'small';
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  icon,
  variant = 'primary',
  size = 'large',
  busy = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const background = {
    primary: theme.tint,
    secondary: theme.element,
    danger: theme.danger,
    ghost: 'transparent',
  }[variant];
  const foreground =
    variant === 'primary'
      ? theme.onTint
      : variant === 'danger'
        ? theme.card
        : variant === 'ghost'
          ? theme.tint
          : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy }}
      disabled={disabled || busy}
      style={({ pressed }) => [
        size === 'large' ? styles.button : styles.buttonSmall,
        { backgroundColor: background },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...rest}>
      {busy ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {icon && <Icon name={icon} size={size === 'large' ? 22 : 18} color={foreground} />}
          <ThemedText
            style={[
              size === 'large' ? styles.buttonLabel : styles.buttonLabelSmall,
              { color: foreground },
            ]}>
            {title}
          </ThemedText>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  color,
  background,
  size = 44,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  background?: string;
  size?: number;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: background ?? theme.element,
          alignItems: 'center',
          justifyContent: 'center',
        },
        pressed && styles.pressed,
      ]}>
      <Icon name={icon} size={Math.round(size * 0.5)} color={color ?? theme.text} />
    </Pressable>
  );
}

// --- Chips and segmented choices ---------------------------------------------

export function Chip({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon?: IconName;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.tintSoft : theme.element,
          borderColor: selected ? theme.tint : 'transparent',
        },
        pressed && styles.pressed,
      ]}>
      {icon && <Icon name={icon} size={18} color={selected ? theme.tint : theme.textSecondary} />}
      <ThemedText type="label" style={{ color: selected ? theme.tint : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: theme.element }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) tapFeedback();
              onChange(option.value);
            }}
            style={[
              styles.segment,
              selected && { backgroundColor: theme.card },
              selected && !theme.dark && styles.segmentShadow,
            ]}>
            <ThemedText type="label" style={{ color: selected ? theme.text : theme.textSecondary }}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

// --- Rows -------------------------------------------------------------------

export function IconBadge({
  icon,
  color,
  background,
  size = 40,
}: {
  icon: IconName;
  color: string;
  background: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: background,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Icon name={icon} size={Math.round(size * 0.55)} color={color} />
    </View>
  );
}

export function ListRow({
  icon,
  iconColor,
  title,
  subtitle,
  right,
  onPress,
  danger,
}: {
  icon?: IconName;
  iconColor?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  const theme = useTheme();
  const color = danger ? theme.danger : (iconColor ?? theme.tint);
  const content = (
    <>
      {icon && (
        <IconBadge
          icon={icon}
          color={color}
          background={danger ? theme.dangerSoft : theme.tintSoft}
          size={36}
        />
      )}
      <View style={styles.rowText}>
        <ThemedText type="default" style={danger && { color: theme.danger }}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="caption" color="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {right ??
        (onPress ? (
          <Icon name="caret-right" size={18} color={theme.textSecondary} duotone={false} />
        ) : null)}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

export function SwitchRow({
  title,
  subtitle,
  value,
  onChange,
  disabled,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.row, disabled && styles.disabled]}>
      <View style={styles.rowText}>
        <ThemedText>{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="caption" color="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={(v) => {
          tapFeedback();
          onChange(v);
        }}
        trackColor={{ true: theme.tint, false: theme.element }}
        thumbColor={theme.card}
      />
    </View>
  );
}

export function Divider() {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.border }]} />;
}

export function SectionTitle({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <ThemedText type="overline" color="textSecondary">
        {children.toUpperCase()}
      </ThemedText>
      {right}
    </View>
  );
}

// --- Fields -----------------------------------------------------------------

export function TextField({ label, style, ...rest }: TextInputProps & { label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="label" color="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { backgroundColor: theme.element, color: theme.text }, style]}
        {...rest}
      />
    </View>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <ThemedText type="label" color="textSecondary">
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.empty}>
      <IconBadge icon={icon} color={theme.tint} background={theme.tintSoft} size={84} />
      <ThemedText type="heading" style={styles.center}>
        {title}
      </ThemedText>
      <ThemedText type="body" color="textSecondary" style={styles.center}>
        {body}
      </ThemedText>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth * 2,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  cardShadow: { boxShadow: '0px 1px 8px rgba(30,36,28,0.05)' },
  button: {
    minHeight: 54,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSmall: {
    minHeight: 40,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    gap: Spacing.one + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: { fontSize: 17, fontWeight: 600 },
  buttonLabelSmall: { fontSize: 14, fontWeight: 600 },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.4 },
  chip: {
    minHeight: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: Radius.medium,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: Radius.medium - 3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  segmentShadow: { boxShadow: '0px 1px 3px rgba(30,36,28,0.12)' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 52,
  },
  rowText: { flex: 1, gap: 1 },
  divider: { height: StyleSheet.hairlineWidth * 2, marginVertical: -Spacing.one },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.one,
    marginBottom: -Spacing.two,
  },
  field: { gap: Spacing.two },
  input: {
    minHeight: 52,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 17,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.three,
  },
  center: { textAlign: 'center' },
});
