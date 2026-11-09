import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle, type StyleProp } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { tabularNumbers, type TextVariant } from '../../theme';

/** Semantic colour roles, resolved against the active theme. */
export type TextTone =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'inverse'
  | 'brand'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  /** Explicit colour, overriding `tone`. For text on gradients. */
  color?: string;
  align?: TextStyle['textAlign'];
  /** Fixed-width digits, so animated numbers don't shift layout. */
  tabular?: boolean;
  style?: StyleProp<TextStyle>;
}

/**
 * The only text primitive in the app.
 *
 * Every size/weight comes from the typography scale, which is what keeps
 * hierarchy consistent — avoid raw `<Text>` from react-native.
 */
export function Text({
  variant = 'body',
  tone = 'primary',
  color,
  align,
  tabular = false,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();

  const toneColors: Record<TextTone, string> = {
    primary: theme.colors.text,
    secondary: theme.colors.textSecondary,
    tertiary: theme.colors.textTertiary,
    inverse: theme.colors.textInverse,
    brand: theme.colors.primary,
    accent: theme.colors.accent,
    success: theme.colors.success,
    warning: theme.colors.warning,
    error: theme.colors.error,
    info: theme.colors.info,
  };

  return (
    <RNText
      style={[
        theme.textVariants[variant],
        { color: color ?? toneColors[tone] },
        align ? { textAlign: align } : null,
        tabular ? tabularNumbers : null,
        style,
      ]}
      {...rest}
    />
  );
}
