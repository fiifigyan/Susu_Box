import React from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { pressScale, springs, type Gradient, type RadiusKey } from '../../theme';

export type CardVariant =
  /** Standard white card with a soft shadow. */
  | 'elevated'
  /** Flat, border-only. For dense lists where shadows would stack badly. */
  | 'outlined'
  /** Tinted wash, no shadow. For secondary information. */
  | 'filled'
  /** Full-bleed gradient. For hero and balance cards. */
  | 'gradient'
  /** Frosted glass. Needs something visually busy behind it to read as glass. */
  | 'glass';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  /** Gradient stops for `variant="gradient"`. Defaults to brand primary. */
  gradient?: Gradient;
  radius?: RadiusKey;
  /** Inner padding. Pass `none` when the content manages its own padding. */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Makes the card pressable, with scale feedback and a haptic tick. */
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Card({
  children,
  variant = 'elevated',
  gradient,
  radius = '2xl',
  padding = 'lg',
  onPress,
  onLongPress,
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}: CardProps) {
  const theme = useTheme();
  const haptics = useHaptics();
  const scale = useSharedValue(1);

  const paddingValue = {
    none: 0,
    sm: theme.spacing.md,
    md: theme.spacing.lg,
    lg: theme.spacing.xl,
  }[padding];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const base: ViewStyle = {
    borderRadius: theme.radius[radius],
    padding: paddingValue,
    overflow: 'hidden',
  };

  const variantStyle: ViewStyle = {
    elevated: {
      backgroundColor: theme.colors.surface,
      // Shadows barely register on near-black, so dark mode gets a hairline
      // border for separation instead.
      ...(theme.isDark
        ? { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border }
        : theme.shadows.md),
    },
    outlined: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filled: {
      backgroundColor: theme.colors.surfaceSunken,
    },
    gradient: {},
    glass: {
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
    },
  }[variant];

  let content: React.ReactNode = children;

  if (variant === 'gradient') {
    content = (
      <LinearGradient
        colors={gradient ?? theme.colors.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: theme.radius[radius] }]}
      />
    );
    content = (
      <>
        {content}
        {children}
      </>
    );
  }

  if (variant === 'glass') {
    content = (
      <>
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={40}
            tint={theme.isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          // Android's blur implementation is expensive and visually weak, so a
          // translucent fill gives a more reliable result at 60fps.
          <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.glass }]} />
        )}
        {children}
      </>
    );
  }

  const composed = [base, variantStyle, style];

  if (!onPress && !onLongPress) {
    return <View style={composed}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(pressScale, springs.snappy);
        haptics.light();
      }}
      onPressOut={() => {
        scale.value = withSpring(1, springs.snappy);
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      <Animated.View style={[composed, animatedStyle, disabled ? styles.disabled : null]}>
        {content}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.5 },
});
