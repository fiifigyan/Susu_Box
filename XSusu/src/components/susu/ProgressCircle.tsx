import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from '../ui/Text';
import { ProgressRing } from '../ui/ProgressRing';
import { AnimatedCounter } from '../ui/AnimatedCounter';

export interface ProgressCircleProps {
  /** Completion as a percentage from 0 to 100. */
  progress: number;
  size: number;
  strokeWidth: number;
  /** Ring colour. Omit and set `colorCoded` to derive it from completion. */
  color?: string;
  /** Grades the ring red → amber → green as completion rises. */
  colorCoded?: boolean;
  /** Caption below the percentage, e.g. "4/6 paid". */
  label?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * Percentage ring with an animated counter in the middle.
 *
 * Takes 0–100 rather than 0–1 to stay compatible with existing callers; the
 * underlying `ProgressRing` works in fractions.
 */
export function ProgressCircle({
  progress,
  size,
  strokeWidth,
  color,
  colorCoded = false,
  label,
  style,
  accessibilityLabel,
}: ProgressCircleProps) {
  const safe = Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 0;

  return (
    <ProgressRing
      progress={safe / 100}
      size={size}
      thickness={strokeWidth}
      color={color}
      colorCoded={colorCoded}
      style={style}
      accessibilityLabel={accessibilityLabel ?? `${Math.round(safe)} percent complete`}
    >
      <View style={styles.center}>
        <AnimatedCounter
          value={Math.round(safe)}
          suffix="%"
          // Scales the numeral with the ring so it never crowds the stroke.
          variant={size >= 140 ? 'displaySmall' : size >= 100 ? 'h1' : 'h3'}
          color={color}
        />
        {label ? (
          <Text variant="caption" tone="secondary" align="center">
            {label}
          </Text>
        ) : null}
      </View>
    </ProgressRing>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: 2 },
});
