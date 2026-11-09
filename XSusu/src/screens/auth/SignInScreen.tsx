import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Screen, Text, Input, Button, Card } from '../../components/ui';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { AppLogo } from '../../components/illustrations/AppLogo';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

export function SignInScreen({ navigation }: Props) {
  const { login } = useAuth();
  const theme = useTheme();
  const toast = useToast();
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const submit = async () => {
    if (!email.trim() || !password) {
      // Inline field errors replace the old blocking alert.
      setErrors({
        email: email.trim() ? undefined : 'Enter your email',
        password: password ? undefined : 'Enter your password',
      });
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (error) {
      toast.fromError(error, 'Sign in failed. Please try again.');
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
        <Animated.View
          entering={FadeInDown.duration(600)}
          style={[styles.header, { gap: theme.spacing.lg, marginBottom: theme.spacing['3xl'] }]}
        >
          <AppLogo size={76} />
          <View style={{ gap: theme.spacing.xs, alignItems: 'center' }}>
            <Text variant="h1" align="center" accessibilityRole="header">
              Welcome back
            </Text>
            <Text variant="body" tone="secondary" align="center">
              Sign in to manage your Susu groups.
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(160).duration(500)}>
          <Card variant="glass" padding="lg" radius="2xl">
            <View style={{ gap: theme.spacing.lg }}>
              <Input
                label="Email"
                value={email}
                onChangeText={value => {
                  setEmail(value);
                  if (errors.email) setErrors(current => ({ ...current, email: undefined }));
                }}
                error={errors.email}
                icon="mail-outline"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              <Input
                ref={passwordRef}
                label="Password"
                value={password}
                onChangeText={value => {
                  setPassword(value);
                  if (errors.password) setErrors(current => ({ ...current, password: undefined }));
                }}
                error={errors.password}
                icon="lock-closed-outline"
                secure
                autoComplete="current-password"
                returnKeyType="go"
                onSubmitEditing={submit}
              />

              <Button
                label="Sign in"
                onPress={submit}
                loading={loading}
                size="lg"
                fullWidth
                icon="arrow-forward"
                iconPosition="right"
                accessibilityHint="Signs you in to your account"
              />

              <Pressable
                onPress={() => navigation.navigate('ForgotPassword')}
                hitSlop={12}
                style={styles.forgotLink}
                accessibilityRole="link"
                accessibilityLabel="Forgot password"
              >
                <Text variant="bodySmall" tone="brand">Forgot password?</Text>
              </Pressable>
            </View>
          </Card>
        </Animated.View>

        <Animated.View
          entering={FadeIn.delay(320).duration(400)}
          style={{ marginTop: theme.spacing['2xl'], alignItems: 'center' }}
        >
          <Pressable
            onPress={() => navigation.navigate('SignUp')}
            hitSlop={12}
            style={styles.link}
            accessibilityRole="link"
            accessibilityLabel="Create an account"
          >
            <Text variant="bodySmall" tone="secondary">
              New to XSusu?{' '}
            </Text>
            <Text variant="bodyMedium" tone="brand">
              Create an account
            </Text>
          </Pressable>
        </Animated.View>
      </KeyboardAwareScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center' },
  link: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  forgotLink: { alignItems: 'center', minHeight: 36 },
});
