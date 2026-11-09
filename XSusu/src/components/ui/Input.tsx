import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Text } from './Text';
import { IconButton } from './IconButton';
import { useTheme } from '../../hooks/useTheme';
import { springs, timings } from '../../theme';

export interface InputProps extends Omit<TextInputProps, 'style' | 'placeholder'> {
  /** Floating label. Doubles as the accessibility label. */
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  /** Validation message. Its presence puts the field in the error state. */
  error?: string;
  /** Guidance shown below the field while there is no error. */
  helper?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Renders a show/hide toggle and starts obscured. */
  secure?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

const FIELD_HEIGHT = 62;
/** Distance the label travels from its resting position to the top. */
const LABEL_TRAVEL = -12;
const LABEL_SCALE = 0.78;

/**
 * Text field with a floating label.
 *
 * The label animates up and shrinks once the field is focused or filled, so the
 * field never loses its name the way a placeholder does.
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    value,
    onChangeText,
    error,
    helper,
    icon,
    secure = false,
    containerStyle,
    onFocus,
    onBlur,
    editable = true,
    ...rest
  },
  ref
) {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const [obscured, setObscured] = useState(secure);

  useImperativeHandle(ref, () => inputRef.current as TextInput);

  const hasError = Boolean(error);
  // Drives the label position: 0 = resting, 1 = floated.
  const floated = useSharedValue(value.length > 0 ? 1 : 0);
  const focusProgress = useSharedValue(0);

  const setFloated = useCallback(
    (shouldFloat: boolean) => {
      floated.value = withSpring(shouldFloat ? 1 : 0, springs.snappy);
    },
    [floated]
  );

  const handleFocus = useCallback<NonNullable<TextInputProps['onFocus']>>(
    event => {
      setFocused(true);
      focusProgress.value = withTiming(1, timings.fast);
      setFloated(true);
      onFocus?.(event);
    },
    [focusProgress, onFocus, setFloated]
  );

  const handleBlur = useCallback<NonNullable<TextInputProps['onBlur']>>(
    event => {
      setFocused(false);
      focusProgress.value = withTiming(0, timings.fast);
      // Keep the label floated while there is content to label.
      setFloated(value.length > 0);
      onBlur?.(event);
    },
    [focusProgress, onBlur, setFloated, value.length]
  );

  const handleChangeText = useCallback(
    (next: string) => {
      onChangeText(next);
      if (!focused) setFloated(next.length > 0);
    },
    [focused, onChangeText, setFloated]
  );

  const labelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floated.value * LABEL_TRAVEL },
      { scale: 1 - floated.value * (1 - LABEL_SCALE) },
    ],
  }));

  // Errors win over focus, so a focused invalid field still reads as invalid.
  const idleBorder = hasError ? theme.colors.error : theme.colors.border;
  const activeBorder = hasError ? theme.colors.error : theme.colors.primary;

  const borderColor = useDerivedValue(() =>
    interpolateColor(focusProgress.value, [0, 1], [idleBorder, activeBorder])
  );

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
    borderWidth: 1 + focusProgress.value * 0.5,
  }));

  const labelColor = hasError
    ? theme.colors.error
    : focused
      ? theme.colors.primary
      : theme.colors.textSecondary;

  return (
    <View style={containerStyle}>
      <Pressable
        onPress={() => inputRef.current?.focus()}
        accessibilityRole="none"
        // The field itself is the accessible element; this is just a larger
        // tap target for focusing it.
        importantForAccessibility="no"
      >
        <Animated.View
          style={[
            styles.field,
            {
              height: FIELD_HEIGHT,
              borderRadius: theme.radius.lg,
              backgroundColor: editable ? theme.colors.surface : theme.colors.surfaceSunken,
              paddingHorizontal: theme.spacing.lg,
            },
            containerAnimatedStyle,
          ]}
        >
          {icon ? (
            <Ionicons
              name={icon}
              size={20}
              color={focused ? theme.colors.primary : theme.colors.textTertiary}
              style={{ marginRight: theme.spacing.md }}
            />
          ) : null}

          <View style={styles.fieldBody}>
            <Animated.Text
              style={[
                theme.textVariants.body,
                styles.label,
                { color: labelColor, transformOrigin: 'left center' },
                labelStyle,
              ]}
              // Announced as part of the input, not as separate text.
              importantForAccessibility="no"
              numberOfLines={1}
            >
              {label}
            </Animated.Text>

            <TextInput
              ref={inputRef}
              value={value}
              onChangeText={handleChangeText}
              onFocus={handleFocus}
              onBlur={handleBlur}
              secureTextEntry={obscured}
              editable={editable}
              style={[
                theme.textVariants.body,
                styles.input,
                { color: theme.colors.text },
              ]}
              selectionColor={theme.colors.primary}
              accessibilityLabel={label}
              accessibilityHint={error ?? helper}
              {...rest}
            />
          </View>

          {secure ? (
            <IconButton
              icon={obscured ? 'eye-outline' : 'eye-off-outline'}
              size="sm"
              onPress={() => setObscured(current => !current)}
              accessibilityLabel={obscured ? 'Show password' : 'Hide password'}
              color={theme.colors.textSecondary}
            />
          ) : null}
        </Animated.View>
      </Pressable>

      {error ? (
        <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)}>
          <Text variant="bodySmall" tone="error" style={{ marginTop: theme.spacing.xs }}>
            {error}
          </Text>
        </Animated.View>
      ) : helper ? (
        <Text variant="bodySmall" tone="tertiary" style={{ marginTop: theme.spacing.xs }}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldBody: {
    flex: 1,
    justifyContent: 'center',
    height: '100%',
  },
  label: {
    position: 'absolute',
    left: 0,
  },
  input: {
    // Leaves room for the floated label above the text.
    paddingTop: 20,
    paddingBottom: 2,
    padding: 0,
    height: '100%',
  },
});
