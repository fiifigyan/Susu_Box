import React, { useEffect } from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { springs, timings } from '../../theme';
import type { IllustrationProps } from './SavingsIllustration';

/**
 * A disconnected plug, for failed-request error states.
 *
 * Settles with a short wobble — enough to draw the eye to the retry action
 * without the alarm of a red warning triangle.
 */
export function ErrorIllustration({ size = 160 }: IllustrationProps) {
  const theme = useTheme();
  const scale = useSharedValue(0.8);
  const tilt = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, springs.bouncy);
    tilt.value = withSequence(
      withTiming(1, timings.fast),
      withTiming(-1, timings.fast),
      withSpring(0, springs.gentle)
    );
  }, [scale, tilt]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${tilt.value * 4}deg` }],
  }));

  return (
    <Animated.View
      style={animatedStyle}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Defs>
          <LinearGradient id="error-body" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={theme.colors.error} />
            <Stop offset="1" stopColor={theme.colors.error} stopOpacity="0.7" />
          </LinearGradient>
        </Defs>

        <Circle cx="100" cy="100" r="76" fill={theme.colors.errorSubtle} />

        {/* Left half of the cable, plug facing right */}
        <Path
          d="M36 100 H72"
          stroke={theme.colors.textTertiary}
          strokeWidth="9"
          strokeLinecap="round"
        />
        <Path d="M72 84 H88 A10 10 0 0 1 88 116 H72 Z" fill="url(#error-body)" />

        {/* Right half, pulled away to leave a visible gap */}
        <Path
          d="M164 100 H128"
          stroke={theme.colors.textTertiary}
          strokeWidth="9"
          strokeLinecap="round"
        />
        <Path d="M128 84 H112 A10 10 0 0 0 112 116 H128 Z" fill="url(#error-body)" />

        {/* Disconnection sparks */}
        <Path
          d="M100 74 L100 62 M84 80 L76 70 M116 80 L124 70"
          stroke={theme.colors.warning}
          strokeWidth="6"
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
}
