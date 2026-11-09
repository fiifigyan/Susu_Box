import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { RootStackParamList } from '../../types/navigation';
import { depositService } from '../../services/depositService';
import { paymentService } from '../../services/paymentService';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { useHaptics } from '../../hooks/useHaptics';
import {
  Screen,
  Text,
  Card,
  Button,
  Badge,
  Divider,
  Skeleton,
  ErrorState,
  ProgressBar,
  AnimatedCounter,
  ScreenHeader,
  Confetti,
} from '../../components/ui';
import { SuccessCheck, AppLogo } from '../../components/illustrations';
import { formatCurrency } from '../../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'SecurityDeposit'>;

interface DepositState {
  required: number;
  complete: boolean;
  paidCount: number;
  totalMembers: number;
}

export function SecurityDepositScreen({ route, navigation }: Props) {
  const { groupId } = route.params;
  const theme = useTheme();
  const toast = useToast();
  const haptics = useHaptics();

  const [status, setStatus] = useState<DepositState | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const deposit = await depositService.status(groupId);
        setStatus(deposit);
        if (deposit.required > 0 && !deposit.complete) {
          const payment = await paymentService.initialize(
            groupId,
            deposit.required,
            'mtn_mobile_money',
            `DEPOSIT-${groupId}-${Date.now()}`
          );
          setUrl(payment.paymentUrl || null);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Deposit checkout is unavailable. Please try again.'
        );
      }
    })();
  }, [groupId, navigation]);

  const handleNavigationStateChange = async (state: { url: string }) => {
    const matched = state.url.match(/[?&]reference=([^&]+)/)?.[1];
    if (!matched || !status || verifying) return;

    setVerifying(true);
    try {
      const decoded = decodeURIComponent(matched);
      const verification = await paymentService.verify(decoded);

      if (verification.verified) {
        await depositService.collect(groupId, status.required, decoded);
        setPaid(true);
        haptics.celebrate();
      } else {
        setVerifying(false);
        toast.error('Deposit could not be verified', {
          description: 'If you were charged, contact support with your reference.',
        });
      }
    } catch (err) {
      setVerifying(false);
      toast.fromError(err, 'Could not confirm your deposit.');
    }
  };

  // Error
  if (error) {
    return (
      <Screen padded edges={['top']}>
        <ScreenHeader title="Security deposit" showBack />
        <ErrorState message={error} onRetry={() => navigation.goBack()} retryLabel="Go back" />
      </Screen>
    );
  }

  // Just paid
  if (paid) {
    return (
      <Screen background="gradient" edges={['top', 'bottom']} padded>
        <Confetti active />
        <View style={[styles.celebration, { gap: theme.spacing.xl }]}>
          <SuccessCheck size={132} />
          <View style={{ gap: theme.spacing.sm, alignItems: 'center' }}>
            <Text variant="h1" align="center">
              Deposit paid
            </Text>
            <Text variant="body" tone="secondary" align="center">
              Your security deposit is recorded. It protects the group against missed
              contributions and is refunded when the cycle completes.
            </Text>
          </View>
          <View style={{ alignSelf: 'stretch' }}>
            <Button label="Done" onPress={() => navigation.goBack()} size="lg" fullWidth />
          </View>
        </View>
      </Screen>
    );
  }

  // Loading
  if (!status) {
    return (
      <Screen padded edges={['top']}>
        <ScreenHeader title="Security deposit" showBack />
        <View style={{ gap: theme.spacing.lg }}>
          <Skeleton height={148} radius="2xl" />
          <Skeleton height={96} radius="xl" />
        </View>
      </Screen>
    );
  }

  // Already complete
  if (status.complete || status.required === 0) {
    return (
      <Screen padded edges={['top']}>
        <ScreenHeader title="Security deposit" showBack />
        <View style={[styles.celebration, { gap: theme.spacing.xl }]}>
          <SuccessCheck size={120} />
          <View style={{ gap: theme.spacing.sm, alignItems: 'center' }}>
            <Text variant="h2" align="center">
              {status.required === 0 ? 'No deposit required' : 'Deposit complete'}
            </Text>
            <Text variant="body" tone="secondary" align="center">
              {status.required === 0
                ? 'This group does not require a security deposit.'
                : 'All required deposits have been recorded for this group.'}
            </Text>
          </View>

          <Card variant="outlined" style={{ alignSelf: 'stretch' }}>
            <View style={{ gap: theme.spacing.md }}>
              <View style={styles.rowBetween}>
                <Text variant="bodySmall" tone="secondary">
                  Members paid
                </Text>
                <Badge
                  label={`${status.paidCount}/${status.totalMembers}`}
                  tone="success"
                  size="sm"
                />
              </View>
              <ProgressBar
                progress={status.totalMembers > 0 ? status.paidCount / status.totalMembers : 1}
                accessibilityLabel={`${status.paidCount} of ${status.totalMembers} members have paid`}
              />
            </View>
          </Card>
        </View>
      </Screen>
    );
  }

  // Still preparing the checkout URL
  if (!url) {
    return (
      <Screen padded edges={['top']}>
        <ScreenHeader title="Security deposit" showBack />
        <View style={[styles.celebration, { gap: theme.spacing.lg }]}>
          <AppLogo size={80} />
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodySmall" tone="secondary" align="center">
            Preparing secure deposit checkout…
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <View style={{ paddingHorizontal: theme.screenPadding, gap: theme.spacing.md }}>
        <ScreenHeader title="Security deposit" showBack />

        <Card variant="gradient" gradient={theme.colors.gradientBalance} padding="md">
          <View style={{ gap: theme.spacing.xs, alignItems: 'center' }}>
            <Text variant="overline" color={`${theme.colors.textInverse}B3`}>
              Deposit required
            </Text>
            <AnimatedCounter
              value={status.required}
              prefix="GHS "
              decimals={2}
              variant="displaySmall"
              color={theme.colors.textInverse}
              accessibilityLabel={`Deposit required ${formatCurrency(status.required)}`}
            />
          </View>
        </Card>

        <Divider spacing="sm" />
      </View>

      <WebView
        source={{ uri: url }}
        onNavigationStateChange={state => void handleNavigationStateChange(state)}
        startInLoadingState
      />

      {verifying ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[styles.verifying, { backgroundColor: theme.colors.backdrop }]}
        >
          <Card variant="elevated">
            <View style={{ alignItems: 'center', gap: theme.spacing.md }}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text variant="h4">Confirming your deposit…</Text>
              <Text variant="bodySmall" tone="secondary" align="center">
                Don't close this screen.
              </Text>
            </View>
          </Card>
        </Animated.View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  celebration: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  verifying: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
});
