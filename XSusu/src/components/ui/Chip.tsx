import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text } from './Text';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { pressScale, springs } from '../../theme';

export interface ChipProps {
  label: string;
  onPress?: () => void;
  /** Drives the filled/selected appearance. */
  selected?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  tone?: 'brand' | 'neutral' | 'accent';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * Compact tappable pill: filter selectors, group pickers, copyable phone
 * numbers, quick actions.
 */
export function Chip({
  label,
  onPress,
  selected = false,
  icon,
  iconPosition = 'left',
  tone = 'brand',
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}: ChipProps) {
  const theme = useTheme();
  const haptics = useHaptics();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const accent = {
    brand: theme.colors.primary,
    neutral: theme.colors.textSecondary,
    accent: theme.colors.accent,
  }[tone];

  const wash = {
    brand: theme.colors.primarySubtle,
    neutral: theme.colors.surfaceSunken,
    accent: theme.colors.accentSubtle,
  }[tone];

  const contentColor = selected ? theme.colors.onPrimary : accent;

  const body = (
    <Animated.View
      style={[
        styles.container,
        {
          // 36 is below the 44pt guidance, so the hit area is extended with
          // hitSlop on the Pressable rather than by inflating the visual size.
          minHeight: 36,
          paddingHorizontal: theme.spacing.lg,
          borderRadius: theme.radius.full,
          backgroundColor: selected ? accent : wash,
          gap: theme.spacing.xs + 2,
        },
        animatedStyle,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      {icon && iconPosition === 'left' ? (
        <Ionicons name={icon} size={15} color={contentColor} />
      ) : null}
      <Text variant="caption" color={contentColor} numberOfLines={1}>
        {label}
      </Text>
      {icon && iconPosition === 'right' ? (
        <Ionicons name={icon} size={15} color={contentColor} />
      ) : null}
    </Animated.View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      disabled={disabled}
      hitSlop={8}
      onPressIn={() => {
        scale.value = withSpring(pressScale, springs.snappy);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, springs.snappy);
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected, disabled }}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  disabled: { opacity: 0.45 },
});
