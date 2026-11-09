import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text } from './Text';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { glow, pressScale, springs, timings, type Gradient } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Swaps the label for a spinner and blocks presses. */
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  /** Overrides the gradient on `variant="primary"`. */
  gradient?: Gradient;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  gradient,
  style,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const theme = useTheme();
  const haptics = useHaptics();
  const scale = useSharedValue(1);

  const isInactive = disabled || loading;

  // The label and spinner are cross-faded rather than swapped, so the button
  // never changes width mid-press.
  const contentOpacity = useSharedValue(loading ? 0 : 1);
  const spinnerOpacity = useSharedValue(loading ? 1 : 0);

  React.useEffect(() => {
    contentOpacity.value = withTiming(loading ? 0 : 1, timings.fast);
    spinnerOpacity.value = withTiming(loading ? 1 : 0, timings.fast);
  }, [loading, contentOpacity, spinnerOpacity]);

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));
  const spinnerStyle = useAnimatedStyle(() => ({
    opacity: spinnerOpacity.value,
    transform: [{ scale: spinnerOpacity.value }],
  }));

  const sizing = {
    sm: { height: 40, paddingHorizontal: theme.spacing.lg, radius: theme.radius.md, gap: 6 },
    // 52 keeps the primary action comfortably above the 44pt minimum target.
    md: { height: 52, paddingHorizontal: theme.spacing['2xl'], radius: theme.radius.lg, gap: 8 },
    lg: { height: 58, paddingHorizontal: theme.spacing['3xl'], radius: theme.radius.xl, gap: 10 },
  }[size];

  const textVariant = size === 'sm' ? 'buttonSmall' : 'button';
  const iconSize = size === 'sm' ? 16 : 18;

  const contentColor = {
    primary: theme.colors.onPrimary,
    secondary: theme.colors.primary,
    outline: theme.colors.text,
    ghost: theme.colors.primary,
    danger: theme.colors.onPrimary,
  }[variant];

  const surfaceStyle: ViewStyle = {
    primary: theme.isDark ? {} : glow(theme.colors.primary, 'sm'),
    secondary: { backgroundColor: theme.colors.primarySubtle },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: theme.colors.borderStrong,
    },
    ghost: { backgroundColor: 'transparent' },
    danger: theme.isDark ? {} : glow(theme.colors.error, 'sm'),
  }[variant];

  const gradientStops: Gradient | null =
    variant === 'primary'
      ? gradient ?? theme.colors.gradientPrimary
      : variant === 'danger'
        ? theme.colors.gradientError
        : null;

  const iconNode = icon ? <Ionicons name={icon} size={iconSize} color={contentColor} /> : null;

  return (
    <Pressable
      onPress={() => {
        haptics.light();
        onPress();
      }}
      disabled={isInactive}
      onPressIn={() => {
        scale.value = withSpring(pressScale, springs.snappy);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, springs.snappy);
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={fullWidth ? styles.fullWidth : undefined}
    >
      <Animated.View
        style={[
          styles.base,
          {
            height: sizing.height,
            paddingHorizontal: sizing.paddingHorizontal,
            borderRadius: sizing.radius,
          },
          surfaceStyle,
          wrapperStyle,
          isInactive ? styles.inactive : null,
          style,
        ]}
      >
        {gradientStops ? (
          <LinearGradient
            colors={gradientStops}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}

        <Animated.View style={[styles.content, { gap: sizing.gap }, contentStyle]}>
          {iconPosition === 'left' ? iconNode : null}
          <Text variant={textVariant} color={contentColor} numberOfLines={1}>
            {label}
          </Text>
          {iconPosition === 'right' ? iconNode : null}
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFill, styles.content, spinnerStyle]}>
          <ActivityIndicator size="small" color={contentColor} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  inactive: { opacity: 0.45 },
});
