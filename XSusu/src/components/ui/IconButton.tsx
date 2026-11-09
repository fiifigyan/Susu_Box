import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { pressScale, springs } from '../../theme';

export interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  /** Required: an icon alone gives screen readers nothing to announce. */
  accessibilityLabel: string;
  accessibilityHint?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'plain' | 'filled' | 'tinted' | 'surface';
  /** Overrides the icon colour. Use on gradient headers. */
  color?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  size = 'md',
  variant = 'plain',
  color,
  disabled = false,
  style,
}: IconButtonProps) {
  const theme = useTheme();
  const haptics = useHaptics();
  const scale = useSharedValue(1);

  // Hit areas never drop below the 44pt minimum, even at `sm`.
  const dimensions = {
    sm: { box: theme.minTouchTarget, icon: 18 },
    md: { box: 48, icon: 22 },
    lg: { box: 56, icon: 26 },
  }[size];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const variantStyle: ViewStyle = {
    plain: {},
    filled: { backgroundColor: theme.colors.primary },
    tinted: { backgroundColor: theme.colors.primarySubtle },
    surface: {
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
  }[variant];

  const iconColor =
    color ??
    {
      plain: theme.colors.text,
      filled: theme.colors.onPrimary,
      tinted: theme.colors.primary,
      surface: theme.colors.text,
    }[variant];

  return (
    <Pressable
      onPress={() => {
        haptics.light();
        onPress();
      }}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(pressScale, springs.snappy);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, springs.snappy);
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      <Animated.View
        style={[
          styles.base,
          { width: dimensions.box, height: dimensions.box, borderRadius: theme.radius.full },
          variantStyle,
          animatedStyle,
          disabled ? styles.disabled : null,
          style,
        ]}
      >
        <Ionicons name={icon} size={dimensions.icon} color={iconColor} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.4 },
});
