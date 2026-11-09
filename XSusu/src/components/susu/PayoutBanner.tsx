import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text } from '../ui/Text';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import { Avatar } from '../ui/Avatar';
import { AnimatedCounter } from '../ui/AnimatedCounter';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { useToast } from '../../hooks/useToast';
import { springs } from '../../theme';
import { formatPhone } from '../../utils/formatters';

export interface PayoutBannerProps {
  /** Name of the member receiving today's payout. */
  recipientName: string;
  recipientPhone?: string | null;
  /** Amount the recipient receives today. */
  payoutAmount: number;
  /** Amount each member owes today. */
  contributionAmount: number;
  /** Switches to the gold celebration treatment. */
  isCurrentUser: boolean;
  position?: number;
}

/**
 * Highlights who is being paid today.
 *
 * Turns gold when it is the signed-in user's turn — that moment is the whole
 * point of a susu, so it gets its own visual language.
 */
export function PayoutBanner({
  recipientName,
  recipientPhone,
  payoutAmount,
  contributionAmount,
  isCurrentUser,
  position,
}: PayoutBannerProps) {
  const theme = useTheme();
  const haptics = useHaptics();
  const toast = useToast();
  const scale = useSharedValue(0.94);

  useEffect(() => {
    scale.value = withSpring(1, springs.gentle);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const gradient = isCurrentUser ? theme.colors.gradientGold : theme.colors.gradientBalance;
  // Gold is a light surface, so its content must flip to dark ink to stay legible.
  const contentColor = isCurrentUser ? theme.colors.onSecondary : theme.colors.textInverse;
  const mutedColor = `${contentColor}B3`;

  const copyPhone = async () => {
    if (!recipientPhone) return;
    await Clipboard.setStringAsync(recipientPhone);
    haptics.success();
    toast.success('Number copied', { description: formatPhone(recipientPhone), silent: true });
  };

  return (
    <Animated.View style={animatedStyle} entering={FadeIn.duration(320)}>
      <Card variant="gradient" gradient={gradient} padding="lg">
        <View style={{ gap: theme.spacing.lg }}>
          <View style={styles.header}>
            <Text variant="overline" color={mutedColor}>
              {isCurrentUser ? "It's your day" : "Today's payout"}
            </Text>
            {position ? (
              <Text variant="captionSmall" color={mutedColor}>
                Position #{position}
              </Text>
            ) : null}
          </View>

          <View style={[styles.identity, { gap: theme.spacing.lg }]}>
            <Avatar
              name={recipientName}
              size="xl"
              // A neutral ring keeps the avatar readable on both gradients.
              ringColor={`${contentColor}40`}
            />
            <View style={styles.identityBody}>
              <Text variant="h2" color={contentColor} numberOfLines={2}>
                {isCurrentUser ? 'You' : recipientName}
              </Text>
              <AnimatedCounter
                value={payoutAmount}
                prefix="GHS "
                decimals={2}
                variant="displaySmall"
                color={contentColor}
                accessibilityLabel={`Payout of ${payoutAmount} Ghana cedis`}
              />
            </View>
          </View>

          <View
            style={[
              styles.instruction,
              {
                backgroundColor: `${contentColor}1A`,
                borderRadius: theme.radius.lg,
                padding: theme.spacing.md,
                gap: theme.spacing.sm,
              },
            ]}
          >
            <Text variant="bodySmall" color={mutedColor}>
              {isCurrentUser
                ? 'Members are sending their contributions to you.'
                : `Send GHS ${contributionAmount.toFixed(2)} to`}
            </Text>

            {recipientPhone && !isCurrentUser ? (
              <Chip
                label={formatPhone(recipientPhone)}
                icon="copy-outline"
                iconPosition="right"
                onPress={copyPhone}
                selected
                accessibilityLabel={`Copy ${formatPhone(recipientPhone)}`}
                accessibilityHint="Copies the number to your clipboard"
              />
            ) : null}
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  identity: { flexDirection: 'row', alignItems: 'center' },
  identityBody: { flex: 1, gap: 2 },
  instruction: { alignItems: 'flex-start' },
});
