import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { palette } from '../../theme';

interface PieceConfig {
  key: number;
  /** Horizontal start, as a fraction of screen width. */
  startX: number;
  /** Horizontal drift in points, positive or negative. */
  drift: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  /** Rectangles and circles mixed together read as real confetti. */
  round: boolean;
  spin: number;
}

function ConfettiPiece({ config, fallHeight }: { config: PieceConfig; fallHeight: number }) {
  const progress = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      config.delay,
      withTiming(1, {
        duration: config.duration,
        // Linear vertical travel approximates terminal velocity, which looks
        // more natural than an eased fall.
        easing: Easing.linear,
        reduceMotion: ReduceMotion.System,
      })
    );
    rotation.value = withRepeat(
      withTiming(1, {
        duration: 900 + config.spin * 600,
        easing: Easing.linear,
        reduceMotion: ReduceMotion.System,
      }),
      -1,
      false
    );
  }, [config, progress, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: progress.value * fallHeight },
      // Sinusoidal sway, so pieces flutter instead of dropping straight down.
      { translateX: Math.sin(progress.value * Math.PI * 2) * config.drift },
      { rotate: `${rotation.value * 360}deg` },
    ],
    // Holds full opacity for most of the fall, then fades out in the last 25%.
    opacity: progress.value > 0.75 ? (1 - progress.value) * 4 : 1,
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: `${config.startX * 100}%`,
          width: config.size,
          height: config.round ? config.size : config.size * 0.5,
          borderRadius: config.round ? config.size / 2 : 2,
          backgroundColor: config.color,
        },
        animatedStyle,
      ]}
    />
  );
}

export interface ConfettiProps {
  /** Starts the burst when it flips to true. */
  active: boolean;
  /** Number of pieces. Kept modest to stay at 60fps on mid-range Android. */
  count?: number;
}

/**
 * Celebration burst for payouts, successful joins and completed payments.
 *
 * Purely decorative and non-interactive, so it never blocks the UI underneath
 * and is hidden from assistive technology.
 */
export function Confetti({ active, count = 36 }: ConfettiProps) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();

  const pieces = useMemo<PieceConfig[]>(() => {
    const colors = [
      theme.colors.secondary,
      theme.colors.primary,
      theme.colors.accent,
      theme.colors.success,
      palette.kente.saffron,
      palette.kente.clay,
      palette.kente.indigo,
    ];

    return Array.from({ length: count }, (_, index) => ({
      key: index,
      startX: Math.random(),
      drift: (Math.random() - 0.5) * (width * 0.25),
      delay: Math.random() * 450,
      duration: 1900 + Math.random() * 1100,
      size: 7 + Math.random() * 9,
      color: colors[index % colors.length],
      round: Math.random() > 0.65,
      spin: Math.random(),
    }));
    // Re-randomised per burst: `active` in the deps gives each celebration a
    // different pattern rather than replaying an identical animation.
  }, [active, count, theme, width]);

  if (!active) return null;

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {pieces.map(piece => (
        <ConfettiPiece key={`${piece.key}`} config={piece} fallHeight={height + 80} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: -40 },
});
