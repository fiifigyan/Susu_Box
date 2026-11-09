import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Screen, Text, Input, Button, Card, ScreenHeader } from '../../components/ui';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { emailSchema, validateField } from '../../utils/validators';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

type FormField = 'firstName' | 'lastName' | 'email' | 'phone' | 'password';

const FIELD_ORDER: FormField[] = ['firstName', 'lastName', 'email', 'phone', 'password'];

/**
 * Client-side rules mirror the backend's `registerSchema` exactly.
 *
 * Deliberately not using the stricter `passwordSchema` from `utils/validators`:
 * it demands an uppercase letter and a digit, which the API does not, so it
 * would reject passwords the server would happily accept.
 */
function validate(field: FormField, value: string): string | undefined {
  const trimmed = value.trim();

  switch (field) {
    case 'firstName':
      return trimmed ? undefined : 'First name is required';
    case 'lastName':
      return trimmed ? undefined : 'Last name is required';
    case 'email':
      return validateField(emailSchema, trimmed) ?? undefined;
    case 'phone':
      return /^0[245]\d{8}$/.test(trimmed)
        ? undefined
        : 'Enter a Ghana number, e.g. 0244123456';
    case 'password':
      return value.length >= 8 ? undefined : 'Password must be at least 8 characters';
  }
}

export function SignUpScreen({ navigation }: Props) {
  const { register } = useAuth();
  const theme = useTheme();
  const toast = useToast();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});
  const [loading, setLoading] = useState(false);

  const refs = useRef<Partial<Record<FormField, TextInput | null>>>({});

  const update = (field: FormField, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
    // Clear the error as soon as the user starts correcting it.
    if (errors[field]) setErrors(current => ({ ...current, [field]: undefined }));
  };

  const focusNext = (field: FormField) => {
    const next = FIELD_ORDER[FIELD_ORDER.indexOf(field) + 1];
    if (next) refs.current[next]?.focus();
  };

  const submit = async () => {
    const nextErrors: Partial<Record<FormField, string>> = {};
    for (const field of FIELD_ORDER) {
      const message = validate(field, form[field]);
      if (message) nextErrors[field] = message;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      refs.current[FIELD_ORDER.find(field => nextErrors[field]) ?? 'firstName']?.focus();
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await register(form);
      navigation.navigate('VerifyOTP', { email: form.email.trim() });
    } catch (error) {
      toast.fromError(error, 'Registration failed. Please try again.');
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
          <ScreenHeader
            title="Create your account"
            subtitle="Start saving with people you trust."
            showBack
          />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(140).duration(500)}
          style={{ marginTop: theme.spacing.xl }}
        >
          <Card variant="glass" padding="lg" radius="2xl">
            <View style={{ gap: theme.spacing.lg }}>
              <View style={[styles.nameRow, { gap: theme.spacing.md }]}>
                <Input
                  ref={element => {
                    refs.current.firstName = element;
                  }}
                  label="First name"
                  value={form.firstName}
                  onChangeText={value => update('firstName', value)}
                  error={errors.firstName}
                  autoComplete="given-name"
                  returnKeyType="next"
                  onSubmitEditing={() => focusNext('firstName')}
                  containerStyle={styles.nameField}
                />
                <Input
                  ref={element => {
                    refs.current.lastName = element;
                  }}
                  label="Last name"
                  value={form.lastName}
                  onChangeText={value => update('lastName', value)}
                  error={errors.lastName}
                  autoComplete="family-name"
                  returnKeyType="next"
                  onSubmitEditing={() => focusNext('lastName')}
                  containerStyle={styles.nameField}
                />
              </View>

              <Input
                ref={element => {
                  refs.current.email = element;
                }}
                label="Email"
                value={form.email}
                onChangeText={value => update('email', value)}
                error={errors.email}
                icon="mail-outline"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                returnKeyType="next"
                onSubmitEditing={() => focusNext('email')}
              />

              <Input
                ref={element => {
                  refs.current.phone = element;
                }}
                label="Phone number"
                value={form.phone}
                onChangeText={value => update('phone', value)}
                error={errors.phone}
                helper="Your mobile money number"
                icon="call-outline"
                keyboardType="phone-pad"
                autoComplete="tel"
                maxLength={10}
                returnKeyType="next"
                onSubmitEditing={() => focusNext('phone')}
              />

              <Input
                ref={element => {
                  refs.current.password = element;
                }}
                label="Password"
                value={form.password}
                onChangeText={value => update('password', value)}
                error={errors.password}
                helper="At least 8 characters"
                icon="lock-closed-outline"
                secure
                autoComplete="new-password"
                returnKeyType="go"
                onSubmitEditing={submit}
              />

              <Button
                label="Create account"
                onPress={submit}
                loading={loading}
                size="lg"
                fullWidth
                icon="arrow-forward"
                iconPosition="right"
                accessibilityHint="Creates your account and sends a verification code"
              />
            </View>
          </Card>
        </Animated.View>

        <View style={{ marginTop: theme.spacing['2xl'], alignItems: 'center' }}>
          <Pressable
            onPress={() => navigation.navigate('SignIn')}
            hitSlop={12}
            style={styles.link}
            accessibilityRole="link"
            accessibilityLabel="Sign in instead"
          >
            <Text variant="bodySmall" tone="secondary">
              Already have an account?{' '}
            </Text>
            <Text variant="bodyMedium" tone="brand">
              Sign in
            </Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center' },
  nameRow: { flexDirection: 'row' },
  nameField: { flex: 1 },
  link: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
});
