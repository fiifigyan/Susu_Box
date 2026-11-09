import React, { useEffect } from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { springs, timings } from '../../theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Approximate length of the tick path below, used to drive the stroke draw. */
const CHECK_PATH_LENGTH = 72;

export interface SuccessCheckProps {
  size?: number;
  /** Ring and tick colour. Defaults to the success green. */
  color?: string;
}

/**
 * Circle that springs in, then draws a tick.
 *
 * The tick is animated via `strokeDashoffset` so the stroke appears to be drawn
 * rather than simply faded in — that reads as confirmation, not decoration.
 */
export function SuccessCheck({ size = 120, color }: SuccessCheckProps) {
  const theme = useTheme();
  const tint = color ?? theme.colors.success;

  const circleScale = useSharedValue(0);
  const draw = useSharedValue(0);

  useEffect(() => {
    circleScale.value = withSpring(1, springs.bouncy);
    // Held back until the circle has mostly settled, so the two motions read as
    // a sequence rather than a blur.
    draw.value = withDelay(220, withTiming(1, timings.slow));
  }, [circleScale, draw]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));

  const pathProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_PATH_LENGTH * (1 - draw.value),
  }));

  return (
    <Animated.View
      style={containerStyle}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Success"
    >
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Defs>
          <LinearGradient id="success-ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={tint} stopOpacity="0.22" />
            <Stop offset="1" stopColor={tint} stopOpacity="0.08" />
          </LinearGradient>
        </Defs>

        <Circle cx="60" cy="60" r="56" fill="url(#success-ring)" />
        <Circle cx="60" cy="60" r="42" fill={tint} />

        <AnimatedPath
          d="M40 61 L54 75 L81 47"
          stroke={theme.colors.onPrimary}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={CHECK_PATH_LENGTH}
          animatedProps={pathProps}
        />
      </Svg>
    </Animated.View>
  );
}
