import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text } from './Text';
import { Button } from './Button';
import { ErrorIllustration } from '../illustrations';
import { useTheme } from '../../hooks/useTheme';

export interface ErrorStateProps {
  /** The message from the API. Shown verbatim so the cause is not hidden. */
  message: string;
  title?: string;
  onRetry?: () => void;
  retryLabel?: string;
  /** Hides the illustration, for errors shown inside a small card. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Failure state with a retry affordance.
 *
 * Always surfaces the backend's own message rather than a generic
 * "Something went wrong", so users and support can act on it.
 */
export function ErrorState({
  message,
  title = "That didn't work",
  onRetry,
  retryLabel = 'Try again',
  compact = false,
  style,
}: ErrorStateProps) {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(360)}
      style={[
        styles.container,
        { padding: compact ? theme.spacing.xl : theme.spacing['3xl'], gap: theme.spacing.lg },
        style,
      ]}
      accessibilityLiveRegion="polite"
    >
      {compact ? null : <ErrorIllustration size={152} />}

      <View style={[styles.copy, { gap: theme.spacing.sm }]}>
        <Text variant={compact ? 'h3' : 'h2'} align="center">
          {title}
        </Text>
        <Text variant="body" tone="secondary" align="center">
          {message}
        </Text>
      </View>

      {onRetry ? (
        <Button
          label={retryLabel}
          onPress={onRetry}
          variant={compact ? 'secondary' : 'primary'}
          icon="refresh"
          accessibilityHint="Retries the failed request"
        />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  copy: { alignItems: 'center', maxWidth: 320 },
});
