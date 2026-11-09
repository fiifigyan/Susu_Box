import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../../hooks/useTheme';

export interface DividerProps {
  /** Centred caption, e.g. "or continue with". */
  label?: string;
  /** Horizontal inset, for dividers between list rows. */
  inset?: number;
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

export function Divider({ label, inset = 0, spacing = 'none', style }: DividerProps) {
  const theme = useTheme();

  const marginVertical = {
    none: 0,
    sm: theme.spacing.md,
    md: theme.spacing.xl,
    lg: theme.spacing['3xl'],
  }[spacing];

  const line = (
    <View
      style={{
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.colors.border,
      }}
    />
  );

  return (
    <View
      style={[
        styles.container,
        { marginVertical, marginHorizontal: inset, gap: label ? theme.spacing.md : 0 },
        style,
      ]}
      // Purely decorative, so it is hidden from assistive technology.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {line}
      {label ? (
        <Text variant="caption" tone="tertiary">
          {label}
        </Text>
      ) : null}
      {label ? line : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
});
