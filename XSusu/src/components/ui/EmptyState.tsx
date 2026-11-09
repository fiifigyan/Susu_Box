import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text } from './Text';
import { Button } from './Button';
import { SavingsIllustration } from '../illustrations';
import { useTheme } from '../../hooks/useTheme';

export interface EmptyStateProps {
  title: string;
  message: string;
  /**
   * Animated SVG illustration. `savings` suits group and contribution lists.
   * Pass `none` with an `icon` for compact empty states inside cards.
   */
  illustration?: 'savings' | 'none';
  /** Shown instead of an illustration when `illustration="none"`. */
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
  /** Lower-emphasis alternative, e.g. "Join with a code". */
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Empty state with an illustration, friendly copy and a clear next step.
 *
 * An empty list should always tell the user what to do next — never just
 * "No items".
 */
export function EmptyState({
  title,
  message,
  illustration = 'savings',
  icon,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      style={[
        styles.container,
        { padding: theme.spacing['3xl'], gap: theme.spacing.lg },
        style,
      ]}
    >
      {illustration === 'savings' ? (
        <SavingsIllustration size={168} />
      ) : icon ? (
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: theme.colors.primarySubtle, borderRadius: theme.radius.full },
          ]}
        >
          <Ionicons name={icon} size={36} color={theme.colors.primary} />
        </View>
      ) : null}

      <View style={[styles.copy, { gap: theme.spacing.sm }]}>
        <Text variant="h2" align="center">
          {title}
        </Text>
        <Text variant="body" tone="secondary" align="center">
          {message}
        </Text>
      </View>

      {actionLabel && onAction ? (
        <View style={[styles.actions, { gap: theme.spacing.md }]}>
          <Button label={actionLabel} onPress={onAction} icon="add" fullWidth />
          {secondaryActionLabel && onSecondaryAction ? (
            <Button
              label={secondaryActionLabel}
              onPress={onSecondaryAction}
              variant="ghost"
              fullWidth
            />
          ) : null}
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  iconCircle: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center' },
  copy: { alignItems: 'center', maxWidth: 320 },
  actions: { alignSelf: 'stretch', maxWidth: 320, width: '100%' },
});
