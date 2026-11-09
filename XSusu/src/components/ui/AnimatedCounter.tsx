import React, { useEffect } from 'react';
import { StyleSheet, TextInput, View, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { tabularNumbers, timings, type TextVariant } from '../../theme';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export interface AnimatedCounterProps {
  value: number;
  /** Text prepended to the number, e.g. "GHS ". */
  prefix?: string;
  suffix?: string;
  decimals?: number;
  variant?: TextVariant;
  color?: string;
  /** Skips the animation and renders the value immediately. */
  animate?: boolean;
  style?: StyleProp<TextStyle>;
  /** Overrides the screen-reader announcement. */
  accessibilityLabel?: string;
}

/**
 * Formats a number with thousands separators.
 *
 * Runs as a worklet on the UI thread, which is why it is hand-rolled —
 * `toLocaleString` and `Intl` are not available there.
 */
function formatOnUI(value: number, decimals: number, prefix: string, suffix: string): string {
  'worklet';
  const isNegative = value < 0;
  const absolute = Math.abs(value);
  const fixed = absolute.toFixed(decimals);
  const [whole, fraction] = fixed.split('.');

  let grouped = '';
  for (let index = 0; index < whole.length; index += 1) {
    // Insert a separator every three digits, counting from the right.
    if (index > 0 && (whole.length - index) % 3 === 0) grouped += ',';
    grouped += whole[index];
  }

  const body = fraction ? `${grouped}.${fraction}` : grouped;
  return `${isNegative ? '-' : ''}${prefix}${body}${suffix}`;
}

/**
 * A number that counts up to its value.
 *
 * Built on an animated `TextInput` because Reanimated cannot drive `Text`
 * children — this keeps the whole animation on the UI thread instead of
 * re-rendering React 60 times a second.
 */
export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  variant = 'display',
  color,
  animate = true,
  style,
  accessibilityLabel,
}: AnimatedCounterProps) {
  const theme = useTheme();
  const progress = useSharedValue(animate ? 0 : value);

  useEffect(() => {
    if (animate) {
      progress.value = withTiming(value, timings.counter);
    } else {
      progress.value = value;
    }
  }, [animate, progress, value]);

  const animatedProps = useAnimatedProps(() => {
    return {
      text: formatOnUI(progress.value, decimals, prefix, suffix),
      // `text` is a valid native prop but is absent from the public TS types.
    } as Partial<React.ComponentProps<typeof TextInput>> & { text: string };
  });

  const resolved = formatOnUI(value, decimals, prefix, suffix);

  return (
    <View accessible accessibilityRole="text" accessibilityLabel={accessibilityLabel ?? resolved}>
      <AnimatedTextInput
        animatedProps={animatedProps}
        defaultValue={formatOnUI(animate ? 0 : value, decimals, prefix, suffix)}
        editable={false}
        // The value is announced by the wrapper, so the field itself is hidden
        // from assistive technology.
        importantForAccessibility="no"
        accessibilityElementsHidden
        underlineColorAndroid="transparent"
        style={[
          theme.textVariants[variant],
          tabularNumbers,
          styles.input,
          { color: color ?? theme.colors.text },
          style,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 0,
    margin: 0,
    // Android gives TextInput a minimum height that clips large display text.
    includeFontPadding: false,
  },
});
