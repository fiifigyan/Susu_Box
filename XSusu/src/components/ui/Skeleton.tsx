import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  type DimensionValue,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { radius as radiusScale, shimmerDuration, type RadiusKey } from '../../theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: RadiusKey;
  style?: StyleProp<ViewStyle>;
}

/**
 * Shimmering placeholder block.
 *
 * Replaces spinners and "Loading..." text: a skeleton communicates the shape of
 * the content that is about to arrive, so the layout does not jump.
 */
export function Skeleton({ width = '100%', height = 16, radius = 'sm', style }: SkeletonProps) {
  const theme = useTheme();
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: shimmerDuration,
        easing: Easing.inOut(Easing.ease),
        // Honours the OS "Reduce Motion" setting, leaving a static block.
        reduceMotion: ReduceMotion.System,
      }),
      -1,
      false
    );
  }, [progress]);

  const sweepStyle = useAnimatedStyle(() => ({
    // Travels from fully off the left edge to fully off the right.
    transform: [{ translateX: -measuredWidth + progress.value * measuredWidth * 2 }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    if (next !== measuredWidth) setMeasuredWidth(next);
  };

  return (
    <View
      onLayout={handleLayout}
      style={[
        {
          width,
          height,
          borderRadius: radiusScale[radius],
          backgroundColor: theme.colors.skeletonBase,
          overflow: 'hidden',
        },
        style,
      ]}
      // Placeholders carry no information worth announcing.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {measuredWidth > 0 ? (
        <Animated.View style={[StyleSheet.absoluteFill, sweepStyle]}>
          <LinearGradient
            colors={[
              theme.colors.skeletonBase,
              theme.colors.skeletonHighlight,
              theme.colors.skeletonBase,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

export interface SkeletonTextProps {
  lines?: number;
  /** Width of the final line, which is shortened to look like real prose. */
  lastLineWidth?: DimensionValue;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonText({ lines = 3, lastLineWidth = '60%', style }: SkeletonTextProps) {
  const theme = useTheme();

  return (
    <View style={[{ gap: theme.spacing.sm }, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={12}
          width={index === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </View>
  );
}

/** Card-shaped placeholder matching the layout of `GroupCard`. */
export function SkeletonCard({ style }: { style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          padding: theme.spacing.xl,
          borderRadius: theme.radius['2xl'],
          backgroundColor: theme.colors.surface,
          gap: theme.spacing.lg,
          borderWidth: theme.isDark ? StyleSheet.hairlineWidth : 0,
          borderColor: theme.colors.border,
        },
        theme.isDark ? null : theme.shadows.sm,
        style,
      ]}
    >
      <View style={[styles.row, { gap: theme.spacing.md }]}>
        <Skeleton width={44} height={44} radius="md" />
        <View style={{ flex: 1, gap: theme.spacing.sm }}>
          <Skeleton width="65%" height={16} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
      <Skeleton height={8} radius="full" />
      <View style={[styles.row, { gap: theme.spacing.md }]}>
        <Skeleton width={80} height={24} radius="full" />
        <Skeleton width={64} height={24} radius="full" />
      </View>
    </View>
  );
}

/** A stack of card placeholders, for list screens in their loading state. */
export function SkeletonList({ count = 3 }: { count?: number }) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.lg }}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
