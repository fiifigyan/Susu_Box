import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text } from './Text';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { springs, timings } from '../../theme';

export interface OTPInputProps {
  value: string;
  onChangeText: (value: string) => void;
  length?: number;
  /** Fires once the final digit is entered, for auto-submit. */
  onComplete?: (value: string) => void;
  /** Shakes the boxes and tints them red when true. */
  error?: boolean;
  autoFocus?: boolean;
  editable?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Segmented one-time-code field.
 *
 * A single offscreen `TextInput` backs all the boxes rather than one input per
 * digit: that keeps SMS autofill and paste working, and avoids the focus-juggling
 * bugs that per-box inputs are prone to.
 */
export function OTPInput({
  value,
  onChangeText,
  length = 6,
  onComplete,
  error = false,
  autoFocus = true,
  editable = true,
  style,
}: OTPInputProps) {
  const theme = useTheme();
  const haptics = useHaptics();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const shake = useSharedValue(0);

  useEffect(() => {
    if (!error) return;
    haptics.error();
    // Two decaying swings, then spring back to centre.
    shake.value = withSequence(
      withTiming(1, { duration: 55 }),
      withTiming(-1, { duration: 55 }),
      withTiming(0.5, { duration: 55 }),
      withSpring(0, springs.snappy)
    );
  }, [error, haptics, shake]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value * 10 }],
  }));

  const handleChange = (next: string) => {
    // Digits only, so pasted codes with spaces or dashes still work.
    const digits = next.replace(/\D/g, '').slice(0, length);
    if (digits.length > value.length) haptics.light();
    onChangeText(digits);
    if (digits.length === length) onComplete?.(digits);
  };

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      accessibilityRole="none"
      importantForAccessibility="no"
    >
      <Animated.View style={[styles.row, { gap: theme.spacing.sm }, shakeStyle, style]}>
        {Array.from({ length }).map((_, index) => {
          const char = value[index] ?? '';
          const isActive = focused && index === Math.min(value.length, length - 1);
          const isFilled = char !== '';

          return (
            <OTPBox
              key={index}
              char={char}
              active={isActive}
              filled={isFilled}
              error={error}
            />
          );
        })}
      </Animated.View>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        editable={editable}
        // Enables the OS one-time-code suggestion above the keyboard.
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        style={styles.hiddenInput}
        accessibilityLabel={`${length} digit verification code`}
        accessibilityHint={`Enter the ${length} digit code sent to you`}
      />
    </Pressable>
  );
}

function OTPBox({
  char,
  active,
  filled,
  error,
}: {
  char: string;
  active: boolean;
  filled: boolean;
  error: boolean;
}) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    // A small pop as each digit lands confirms the keypress.
    if (filled) scale.value = withSequence(withSpring(1.07, springs.snappy), withSpring(1, springs.snappy));
  }, [filled, scale]);

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, timings.fast);
  }, [active, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderWidth: 1.5 + progress.value,
  }));

  const borderColor = error
    ? theme.colors.error
    : active
      ? theme.colors.primary
      : filled
        ? theme.colors.borderStrong
        : theme.colors.border;

  return (
    <Animated.View
      style={[
        styles.box,
        {
          borderRadius: theme.radius.lg,
          borderColor,
          backgroundColor: error
            ? theme.colors.errorSubtle
            : filled
              ? theme.colors.primarySubtle
              : theme.colors.surface,
        },
        animatedStyle,
      ]}
    >
      <Text variant="h2" tone={error ? 'error' : 'primary'}>
        {char}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center' },
  box: {
    flex: 1,
    // Tall enough to remain a comfortable tap target for focusing the field.
    height: 60,
    maxWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenInput: {
    // Kept on-screen but fully transparent and zero-height: an input moved
    // offscreen loses autofill on iOS.
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    opacity: 0,
  },
});
