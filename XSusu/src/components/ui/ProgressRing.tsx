import React, { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { timings } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  /** Completion from 0 to 1. Values outside the range are clamped. */
  progress: number;
  size?: number;
  thickness?: number;
  /**
   * Colour-codes the ring by completion: red below a third, amber below
   * two-thirds, green above. Use for contribution progress.
   */
  colorCoded?: boolean;
  /** Explicit ring colour, overriding `colorCoded`. */
  color?: string;
  trackColor?: string;
  /** Content rendered in the middle, e.g. a percentage. */
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * Circular progress indicator.
 *
 * The arc is animated by driving `strokeDashoffset` from a shared value, so the
 * whole sweep runs on the UI thread with no React re-renders.
 */
export function ProgressRing({
  progress,
  size = 120,
  thickness = 10,
  colorCoded = false,
  color,
  trackColor,
  children,
  style,
  accessibilityLabel,
}: ProgressRingProps) {
  const theme = useTheme();
  const clamped = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  const animated = useSharedValue(0);

  useEffect(() => {
    animated.value = withTiming(clamped, timings.slow);
  }, [animated, clamped]);

  const animatedProps = useAnimatedProps(() => ({
    // Offsetting the full circumference hides the arc; zero shows all of it.
    strokeDashoffset: circumference * (1 - animated.value),
  }));

  const codedColor =
    clamped < 1 / 3 ? theme.colors.error : clamped < 2 / 3 ? theme.colors.warning : theme.colors.success;

  const strokeColor = color ?? (colorCoded ? codedColor : theme.colors.primary);
  const gradientId = `ring-${size}-${thickness}`;

  return (
    <View
      style={[{ width: size, height: size }, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? `${Math.round(clamped * 100)} percent complete`}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={strokeColor} stopOpacity="1" />
            <Stop offset="1" stopColor={strokeColor} stopOpacity="0.65" />
          </LinearGradient>
        </Defs>

        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor ?? theme.colors.surfaceSunken}
          strokeWidth={thickness}
          fill="none"
        />

        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeLinecap="round"
          fill="none"
          animatedProps={animatedProps}
          // Rotates the start of the arc to 12 o'clock.
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {children ? <View style={styles.center}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
