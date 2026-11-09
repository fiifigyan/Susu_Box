import React, { useEffect } from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { springs, timings } from '../../theme';

export interface AppLogoProps {
  size?: number;
  /** Plays the scale-and-fade entrance. Disable for static placements. */
  animated?: boolean;
}

/**
 * The XSusu mark: a rotating-savings circle with three coins.
 *
 * Drawn as SVG rather than a bitmap so it stays crisp at any size and picks up
 * theme colours in dark mode.
 */
export function AppLogo({ size = 80, animated = true }: AppLogoProps) {
  const theme = useTheme();
  const scale = useSharedValue(animated ? 0.7 : 1);
  const opacity = useSharedValue(animated ? 0 : 1);

  useEffect(() => {
    if (!animated) return;
    opacity.value = withTiming(1, timings.normal);
    // A short hold before the spring makes the entrance feel intentional.
    scale.value = withDelay(80, withSpring(1, springs.bouncy));
  }, [animated, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={animatedStyle}
      accessible
      accessibilityRole="image"
      accessibilityLabel="XSusu"
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="logo-ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={theme.colors.primaryDark} />
            <Stop offset="1" stopColor={theme.colors.primaryLight} />
          </LinearGradient>
        </Defs>

        <Circle cx="50" cy="50" r="46" fill={theme.colors.primarySubtle} />

        {/* Open rotation arc — the gap suggests the cycle is still turning */}
        <Path
          d="M50 14 A36 36 0 1 1 22.6 71.3"
          stroke="url(#logo-ring)"
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
        />

        {/* Three coins for the members in rotation */}
        <Circle cx="50" cy="36" r="7" fill={theme.colors.secondary} />
        <Circle cx="63" cy="57" r="7" fill={theme.colors.primary} />
        <Circle cx="37" cy="57" r="7" fill={theme.colors.accent} />
      </Svg>
    </Animated.View>
  );
}
