import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types/navigation';
import { authService } from '../../services/authService';
import { Screen, Text, Input, Button, Card, ScreenHeader } from '../../components/ui';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';

 type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const theme = useTheme();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [codeRequested, setCodeRequested] = useState(false);
  const [loading, setLoading] = useState(false);

  const requestCode = async () => {
    if (!email.trim()) {
      toast.warning('Enter your account email.');
      return;
    }
    setLoading(true);
    try {
      await authService.requestPasswordReset(email.trim().toLowerCase());
      setCodeRequested(true);
      toast.success('If the account exists, a reset code was created.');
    } catch (error) {
      toast.fromError(error, 'Could not request a reset code.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!/^\d{6}$/.test(otp) || password.length < 8) {
      toast.warning('Enter the 6-digit code and a password with at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(email.trim().toLowerCase(), otp, password);
      toast.success('Password reset. You can now sign in.');
      navigation.goBack();
    } catch (error) {
      toast.fromError(error, 'Could not reset your password.');
    } finally {
      setLoading(false);
    }
  };

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
          <ScreenHeader title="Reset password" showBack />
          <Text variant="body" tone="secondary">
            Request a reset code using the email on your account.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(140).duration(500)} style={{ marginTop: theme.spacing['3xl'] }}>
          <Card variant="glass" padding="lg" radius="2xl">
            <View style={{ gap: theme.spacing.lg }}>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                icon="mail-outline"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                editable={!loading}
              />

              {!codeRequested ? (
                <Button
                  label="Request reset code"
                  onPress={() => void requestCode()}
                  loading={loading}
                  disabled={loading}
                  size="lg"
                  fullWidth
                />
              ) : (
                <>
                  <Text variant="bodySmall" tone="secondary">
                    Enter the six-digit code from the backend log while email delivery is not configured.
                  </Text>
                  <Input
                    label="Reset code"
                    value={otp}
                    onChangeText={value => setOtp(value.replace(/\D/g, '').slice(0, 6))}
                    icon="key-outline"
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!loading}
                  />
                  <Input
                    label="New password"
                    value={password}
                    onChangeText={setPassword}
                    icon="lock-closed-outline"
                    secure
                    editable={!loading}
                  />
                  <Button
                    label="Reset password"
                    onPress={() => void resetPassword()}
                    loading={loading}
                    disabled={loading}
                    size="lg"
                    fullWidth
                  />
                </>
              )}
            </View>
          </Card>
        </Animated.View>
      </KeyboardAwareScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center' },
});
