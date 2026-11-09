import React, { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { timings, type Gradient } from '../../theme';

export interface ProgressBarProps {
  /** Completion from 0 to 1. Values outside the range are clamped. */
  progress: number;
  height?: number;
  /** Gradient fill. Defaults to brand primary. */
  gradient?: Gradient;
  /** Solid fill, overriding the gradient. */
  color?: string;
  trackColor?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function ProgressBar({
  progress,
  height = 8,
  gradient,
  color,
  trackColor,
  style,
  accessibilityLabel,
}: ProgressBarProps) {
  const theme = useTheme();
  const clamped = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const animated = useSharedValue(0);

  useEffect(() => {
    animated.value = withTiming(clamped, timings.slow);
  }, [animated, clamped]);

  // Animating a percentage width avoids needing to measure the track first.
  const fillStyle = useAnimatedStyle(() => ({
    width: `${animated.value * 100}%`,
  }));

  return (
    <View
      style={[
        {
          height,
          borderRadius: height / 2,
          backgroundColor: trackColor ?? theme.colors.surfaceSunken,
          overflow: 'hidden',
        },
        style,
      ]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? `${Math.round(clamped * 100)} percent complete`}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Animated.View style={[styles.fill, fillStyle]}>
        {color ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: color }]} />
        ) : (
          <LinearGradient
            colors={gradient ?? theme.colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { height: '100%', borderRadius: 999, overflow: 'hidden' },
});
