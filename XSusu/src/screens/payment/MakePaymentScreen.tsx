import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import type { RootStackParamList } from '../../types/navigation';
import { paymentService } from '../../services/paymentService';
import { contributionService } from '../../services/contributionService';
import { useAuth } from '../../contexts/AuthContext';
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
  AnimatedCounter,
  ErrorState,
  ScreenHeader,
  Confetti,
} from '../../components/ui';
import { PaymentMethodCard, MOMO_CHANNELS, type MoMoChannel } from '../../components/susu';
import { SuccessCheck, AppLogo } from '../../components/illustrations';
import { formatCurrency } from '../../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'MakePayment'>;

type Stage = 'select' | 'preparing' | 'checkout' | 'success';

const CHANNELS = Object.keys(MOMO_CHANNELS) as MoMoChannel[];

export function MakePaymentScreen({ route, navigation }: Props) {
  const { groupId, amount, day } = route.params;
  const { user } = useAuth();
  const theme = useTheme();
  const toast = useToast();
  const haptics = useHaptics();

  const [stage, setStage] = useState<Stage>('select');
  const [channel, setChannel] = useState<MoMoChannel>('mtn_mobile_money');
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  /** Guards against the WebView firing the callback URL more than once. */
  const [verifying, setVerifying] = useState(false);

  const startCheckout = async () => {
    setStage('preparing');
    setError(null);

    try {
      const payment = await paymentService.initialize(
        groupId,
        amount,
        channel,
        `XSUSU-${groupId}-${day}-${Date.now()}`
      );
      if (!payment.paymentUrl) throw new Error('Paystack did not return a payment URL');
      setUrl(payment.paymentUrl);
      setStage('checkout');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Payment is unavailable right now. Try again later.'
      );
      setStage('select');
    }
  };

  const handleNavigationStateChange = async (state: { url: string }) => {
    const matched = state.url.match(/[?&]reference=([^&]+)/)?.[1];
    if (!matched || verifying) return;

    setVerifying(true);
    try {
      const decoded = decodeURIComponent(matched);
      const verification = await paymentService.verify(decoded);

      if (verification.verified) {
        if (verification.authorizationCode && user?.email) {
          await contributionService.saveAuthorization(verification.authorizationCode, user.email);
        }
        await contributionService.verify(groupId, day, amount, decoded);

        setReference(decoded);
        setStage('success');
        haptics.celebrate();
      } else {
        setVerifying(false);
        toast.error('Payment could not be verified', {
          description: 'If you were charged, contact support with your reference.',
        });
      }
    } catch (err) {
      setVerifying(false);
      toast.fromError(err, 'Could not confirm your payment.');
    }
  };

  // Success
  if (stage === 'success') {
    return (
      <Screen background="gradient" edges={['top', 'bottom']} padded>
        <Confetti active />
        <View style={[styles.celebration, { gap: theme.spacing.xl }]}>
          <SuccessCheck size={132} />

          <View style={{ gap: theme.spacing.sm, alignItems: 'center' }}>
            <Text variant="h1" align="center">
              Payment sent
            </Text>
            <AnimatedCounter
              value={amount}
              prefix="GHS "
              decimals={2}
              variant="display"
              color={theme.colors.primary}
            />
            <Text variant="body" tone="secondary" align="center">
              Your day {day} contribution has been recorded.
            </Text>
          </View>

          <Card variant="outlined" style={{ alignSelf: 'stretch' }}>
            <View style={{ gap: theme.spacing.sm }}>
              <View style={styles.rowBetween}>
                <Text variant="bodySmall" tone="secondary">
                  Method
                </Text>
                <Badge label={MOMO_CHANNELS[channel].label} tone="brand" size="sm" />
              </View>
              <Divider />
              <View style={styles.rowBetween}>
                <Text variant="bodySmall" tone="secondary">
                  Reference
                </Text>
                <Text variant="mono" numberOfLines={1} style={{ flexShrink: 1 }}>
                  {reference}
                </Text>
              </View>
            </View>
          </Card>

          <View style={{ alignSelf: 'stretch', gap: theme.spacing.md }}>
            <Button
              label="Copy reference"
              onPress={async () => {
                if (!reference) return;
                await Clipboard.setStringAsync(reference);
                toast.success('Reference copied', { silent: true });
              }}
              variant="secondary"
              icon="copy"
              fullWidth
            />
            <Button
              label="Done"
              onPress={() => navigation.goBack()}
              size="lg"
              fullWidth
            />
          </View>
        </View>
      </Screen>
    );
  }

  // Paystack checkout
  if (stage === 'checkout' && url) {
    return (
      <Screen edges={['top']}>
        <View style={{ paddingHorizontal: theme.screenPadding }}>
          <ScreenHeader
            title="Secure checkout"
            subtitle={`${formatCurrency(amount)} · ${MOMO_CHANNELS[channel].label}`}
            showBack
            onBack={() => navigation.goBack()}
          />
        </View>

        <WebView
          source={{ uri: url }}
          onNavigationStateChange={state => void handleNavigationStateChange(state)}
          startInLoadingState
          renderLoading={() => (
            <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
              <AppLogo size={72} />
              <Text variant="bodySmall" tone="secondary">
                Loading secure checkout…
              </Text>
            </View>
          )}
        />

        {verifying ? (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={[styles.verifying, { backgroundColor: theme.colors.backdrop }]}
          >
            <Card variant="elevated">
              <View style={{ alignItems: 'center', gap: theme.spacing.md }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text variant="h4">Confirming your payment…</Text>
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

  // Method selection
  return (
    <Screen edges={['top']} padded>
      <ScreenHeader title="Pay contribution" showBack />

      <View style={{ gap: theme.spacing.xl, paddingTop: theme.spacing.md }}>
        {/* Amount */}
        <Animated.View entering={FadeInDown.duration(420)}>
          <Card variant="gradient" gradient={theme.colors.gradientBalance}>
            <View style={{ gap: theme.spacing.sm, alignItems: 'center' }}>
              <Text variant="overline" color={`${theme.colors.textInverse}B3`}>
                Amount due · Day {day}
              </Text>
              <AnimatedCounter
                value={amount}
                prefix="GHS "
                decimals={2}
                variant="display"
                color={theme.colors.textInverse}
                accessibilityLabel={`Amount due ${formatCurrency(amount)}`}
              />
            </View>
          </Card>
        </Animated.View>

        {error ? (
          <ErrorState
            message={error}
            onRetry={() => void startCheckout()}
            compact
          />
        ) : null}

        {/* Methods */}
        <View
          style={{ gap: theme.spacing.md }}
          accessibilityRole="radiogroup"
          accessibilityLabel="Payment method"
        >
          <Text variant="h3">Pay with</Text>
          {CHANNELS.map(option => (
            <PaymentMethodCard
              key={option}
              channel={option}
              selected={channel === option}
              onSelect={setChannel}
              disabled={stage === 'preparing'}
            />
          ))}
        </View>

        <Button
          label={`Pay ${formatCurrency(amount)}`}
          onPress={() => void startCheckout()}
          loading={stage === 'preparing'}
          size="lg"
          fullWidth
          icon="lock-closed"
          accessibilityHint="Opens the secure Paystack checkout"
        />

        <Text variant="captionSmall" tone="tertiary" align="center">
          Payments are processed securely by Paystack.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  celebration: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
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
