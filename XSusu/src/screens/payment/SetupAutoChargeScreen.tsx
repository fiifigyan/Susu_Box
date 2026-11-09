import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../../contexts/AuthContext';
import { contributionService } from '../../services/contributionService';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { useHaptics } from '../../hooks/useHaptics';
import { Screen, Text, Card, Input, Button, Divider, ScreenHeader } from '../../components/ui';

export function SetupAutoChargeScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const toast = useToast();
  const haptics = useHaptics();

  const [authorizationCode, setAuthorizationCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const save = async () => {
    if (!authorizationCode.trim() || !user?.email) {
      setError('Complete a Paystack payment first, then enter the returned authorization code.');
      return;
    }

    setError(undefined);
    setSaving(true);
    try {
      await contributionService.saveAuthorization(authorizationCode.trim(), user.email);
      haptics.success();
      toast.success('Auto-charge enabled', {
        description: 'Your saved authorization can now be charged for contributions.',
        silent: true,
      });
      setAuthorizationCode('');
    } catch (err) {
      toast.fromError(err, 'Could not enable auto-charge.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen edges={['top']}>
      <KeyboardAwareScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.screenPadding,
          paddingBottom: theme.spacing['3xl'],
          gap: theme.spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={24}
      >
        <ScreenHeader
          title="Auto-charge"
          subtitle="Never miss a contribution after your payout"
          showBack
        />

        <Animated.View entering={FadeInDown.duration(420)}>
          <Card variant="gradient" gradient={theme.colors.gradientAccent}>
            <View style={{ gap: theme.spacing.md }}>
              <Ionicons name="flash" size={28} color={theme.colors.textInverse} />
              <Text variant="h3" color={theme.colors.textInverse}>
                Why enable auto-charge?
              </Text>
              <Text variant="bodySmall" color={`${theme.colors.textInverse}CC`}>
                Members most often default right after receiving their payout. Auto-charge
                collects your daily contribution automatically, so your position — and your
                security deposit — stay protected.
              </Text>
            </View>
          </Card>
        </Animated.View>

        <Card variant="outlined">
          <View style={{ gap: theme.spacing.lg }}>
            <Text variant="h3">How it works</Text>

            <Step
              index={1}
              title="Make one payment"
              description="Pay a contribution with mobile money through Paystack."
            />
            <Divider />
            <Step
              index={2}
              title="Copy the authorization code"
              description="Paystack returns a code that represents your saved payment method."
            />
            <Divider />
            <Step
              index={3}
              title="Paste it below"
              description="The code is stored securely on the server, never on your device."
            />
          </View>
        </Card>

        <Card variant="outlined">
          <View style={{ gap: theme.spacing.lg }}>
            <Input
              label="Paystack authorization code"
              value={authorizationCode}
              onChangeText={value => {
                setAuthorizationCode(value);
                if (error) setError(undefined);
              }}
              error={error}
              icon="key-outline"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={() => void save()}
            />

            <Button
              label="Enable auto-charge"
              onPress={() => void save()}
              loading={saving}
              disabled={saving || !authorizationCode.trim()}
              icon="flash"
              size="lg"
              fullWidth
              accessibilityHint="Saves your Paystack authorization for automatic contributions"
            />
          </View>
        </Card>

        <View style={[styles.note, { gap: theme.spacing.sm }]}>
          <Ionicons name="lock-closed" size={14} color={theme.colors.textTertiary} />
          <Text variant="captionSmall" tone="tertiary" style={{ flex: 1 }}>
            XSusu never sees or stores your mobile money PIN. Authorizations are held by Paystack
            and can be revoked at any time.
          </Text>
        </View>
      </KeyboardAwareScrollView>
    </Screen>
  );
}

function Step({
  index,
  title,
  description,
}: {
  index: number;
  title: string;
  description: string;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.step, { gap: theme.spacing.md }]}>
      <View
        style={[
          styles.stepIndex,
          { backgroundColor: theme.colors.primarySubtle, borderRadius: theme.radius.full },
        ]}
      >
        <Text variant="caption" tone="brand">
          {index}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="h4">{title}</Text>
        <Text variant="bodySmall" tone="secondary">
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: 'row', alignItems: 'flex-start' },
  stepIndex: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  note: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 4 },
});
