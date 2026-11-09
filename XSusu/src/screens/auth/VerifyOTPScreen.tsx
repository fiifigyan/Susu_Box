import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Screen, Text, Button, Card, OTPInput, ScreenHeader, Confetti } from '../../components/ui';
import { SuccessCheck } from '../../components/illustrations';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { useHaptics } from '../../hooks/useHaptics';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyOTP'>;

const OTP_LENGTH = 6;

export function VerifyOTPScreen({ route }: Props) {
  const { verifyOTP, resendOTP } = useAuth();
  const theme = useTheme();
  const toast = useToast();
  const haptics = useHaptics();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [invalid, setInvalid] = useState(false);
  const [verified, setVerified] = useState(false);

  const submit = async (code: string = otp) => {
    if (!/^\d{6}$/.test(code)) {
      // Drives the shake animation and error haptic in OTPInput.
      setInvalid(true);
      return;
    }

    setInvalid(false);
    setLoading(true);
    try {
      await verifyOTP(route.params.email, code);
      // The navigator swaps to the main stack once auth state updates; showing
      // success first makes that transition feel earned rather than abrupt.
      setVerified(true);
      haptics.celebrate();
    } catch (error) {
      setInvalid(true);
      setOtp('');
      toast.fromError(error, 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = setInterval(() => setResendSeconds(seconds => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const resend = async () => {
    setResending(true);
    try {
      await resendOTP(route.params.email);
      setOtp('');
      setInvalid(false);
      setResendSeconds(60);
      toast.success('A new verification code was requested.');
    } catch (error) {
      toast.fromError(error, 'Could not resend the verification code.');
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <Screen background="gradient" edges={['top', 'bottom']}>
        <Confetti active />
        <View style={[styles.celebration, { gap: theme.spacing.xl }]}>
          <SuccessCheck size={132} />
          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="h1" align="center">
              You're verified
            </Text>
            <Text variant="body" tone="secondary" align="center">
              Setting up your account…
            </Text>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen background="gradient" edges={['top', 'bottom']}>
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: theme.screenPadding, paddingBottom: theme.spacing['3xl'] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={24}
      >
        <Animated.View entering={FadeInDown.duration(500)}>
          <ScreenHeader title="Verify your account" showBack />
          <Text variant="body" tone="secondary">
            We sent a {OTP_LENGTH}-digit code to
          </Text>
          <Text variant="bodyMedium" tone="brand">
            {route.params.email}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(140).duration(500)}
          style={{ marginTop: theme.spacing['3xl'] }}
        >
          <Card variant="glass" padding="lg" radius="2xl">
            <View style={{ gap: theme.spacing.xl }}>
              <OTPInput
                value={otp}
                onChangeText={value => {
                  setOtp(value);
                  if (invalid) setInvalid(false);
                }}
                length={OTP_LENGTH}
                error={invalid}
                editable={!loading}
                // Auto-submits on the final digit, so most users never tap the
                // button at all.
                onComplete={code => void submit(code)}
              />

              <Button
                label="Verify"
                onPress={() => void submit()}
                loading={loading}
                disabled={otp.length < OTP_LENGTH}
                size="lg"
                fullWidth
                accessibilityHint="Confirms the verification code"
              />
            </View>
          </Card>
        </Animated.View>

        <Text
          variant="bodySmall"
          tone="tertiary"
          align="center"
          style={{ marginTop: theme.spacing.xl }}
        >
          Check your spam folder if the code hasn't arrived.
        </Text>
        <Button
          label={resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend code'}
          onPress={() => void resend()}
          loading={resending}
          disabled={loading || resending || resendSeconds > 0}
          variant="ghost"
          size="sm"
          fullWidth
          accessibilityHint="Requests a new verification code"
        />
      </KeyboardAwareScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center' },
  celebration: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
});
