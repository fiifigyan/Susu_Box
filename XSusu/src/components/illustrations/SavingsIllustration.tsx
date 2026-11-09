import React, { useEffect } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  FadeIn,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { duration } from '../../theme';

export interface IllustrationProps {
  size?: number;
}

/**
 * A growing plant in a coin pot — the empty state for "no groups yet".
 *
 * Reads as growth and saving rather than absence, which is friendlier than a
 * crossed-out icon. The whole illustration drifts gently so the empty screen
 * does not feel dead.
 */
export function SavingsIllustration({ size = 180 }: IllustrationProps) {
  const theme = useTheme();
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          reduceMotion: ReduceMotion.System,
        }),
        withTiming(0, {
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          reduceMotion: ReduceMotion.System,
        })
      ),
      -1,
      false
    );
  }, [float]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value * -6 }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(duration.slow)}
      style={floatStyle}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Defs>
          <LinearGradient id="savings-pot" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.primaryLight} />
            <Stop offset="1" stopColor={theme.colors.primaryDark} />
          </LinearGradient>
          <LinearGradient id="savings-leaf" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={theme.colors.success} />
            <Stop offset="1" stopColor={theme.colors.primary} />
          </LinearGradient>
        </Defs>

        {/* Soft halo, so the illustration sits on the background rather than floating on it */}
        <Circle cx="100" cy="104" r="76" fill={theme.colors.primarySubtle} />

        {/* Stem */}
        <Path
          d="M100 118 C100 96 100 78 100 58"
          stroke={theme.colors.primary}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Leaves */}
        <G>
          <Ellipse
            cx="78"
            cy="70"
            rx="23"
            ry="13"
            fill="url(#savings-leaf)"
            transform="rotate(-28 78 70)"
          />
          <Ellipse
            cx="123"
            cy="82"
            rx="20"
            ry="11"
            fill="url(#savings-leaf)"
            opacity="0.85"
            transform="rotate(24 123 82)"
          />
          <Ellipse
            cx="100"
            cy="50"
            rx="14"
            ry="9"
            fill="url(#savings-leaf)"
            opacity="0.7"
            transform="rotate(-6 100 50)"
          />
        </G>

        {/* Pot */}
        <Path
          d="M62 120 H138 L129 164 A10 10 0 0 1 119 172 H81 A10 10 0 0 1 71 164 Z"
          fill="url(#savings-pot)"
        />
        <Rect x="56" y="110" width="88" height="16" rx="8" fill={theme.colors.primary} />

        {/* Coin slot */}
        <Rect
          x="88"
          y="115"
          width="24"
          height="5"
          rx="2.5"
          fill={theme.colors.primaryDark}
          opacity="0.5"
        />

        {/* Coins beside the pot */}
        <G opacity="0.95">
          <Ellipse cx="48" cy="168" rx="16" ry="6" fill={theme.colors.secondary} />
          <Ellipse cx="48" cy="161" rx="16" ry="6" fill={theme.colors.secondary} opacity="0.85" />
          <Ellipse cx="154" cy="168" rx="13" ry="5" fill={theme.colors.secondary} opacity="0.7" />
        </G>
      </Svg>
    </Animated.View>
  );
}
