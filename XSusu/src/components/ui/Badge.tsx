import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { useTheme } from '../../hooks/useTheme';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'error' | 'info' | 'accent';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  size?: 'sm' | 'md';
  icon?: keyof typeof Ionicons.glyphMap;
  /** Leading status dot, instead of an icon. */
  dot?: boolean;
  /** Solid fill rather than a tinted wash. Higher emphasis. */
  solid?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Non-interactive status label. For tappable pills use `Chip`. */
export function Badge({
  label,
  tone = 'neutral',
  size = 'md',
  icon,
  dot = false,
  solid = false,
  style,
}: BadgeProps) {
  const theme = useTheme();

  const tones: Record<BadgeTone, { fill: string; wash: string; content: string }> = {
    neutral: {
      fill: theme.colors.textSecondary,
      wash: theme.colors.surfaceSunken,
      content: theme.colors.textSecondary,
    },
    brand: { fill: theme.colors.primary, wash: theme.colors.primarySubtle, content: theme.colors.primary },
    success: { fill: theme.colors.success, wash: theme.colors.successSubtle, content: theme.colors.success },
    warning: { fill: theme.colors.warning, wash: theme.colors.warningSubtle, content: theme.colors.warning },
    error: { fill: theme.colors.error, wash: theme.colors.errorSubtle, content: theme.colors.error },
    info: { fill: theme.colors.info, wash: theme.colors.infoSubtle, content: theme.colors.info },
    accent: { fill: theme.colors.accent, wash: theme.colors.accentSubtle, content: theme.colors.accent },
  };

  const { fill, wash, content } = tones[tone];
  const contentColor = solid ? theme.colors.onPrimary : content;

  const sizing =
    size === 'sm'
      ? { paddingVertical: 3, paddingHorizontal: theme.spacing.sm, gap: 4 }
      : { paddingVertical: 5, paddingHorizontal: theme.spacing.md, gap: 5 };

  return (
    <View
      style={[
        styles.container,
        sizing,
        {
          backgroundColor: solid ? fill : wash,
          borderRadius: theme.radius.full,
        },
        style,
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      {dot ? (
        <View style={[styles.dot, { backgroundColor: contentColor }]} />
      ) : icon ? (
        <Ionicons name={icon} size={size === 'sm' ? 11 : 13} color={contentColor} />
      ) : null}

      <Text variant={size === 'sm' ? 'captionSmall' : 'caption'} color={contentColor} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
