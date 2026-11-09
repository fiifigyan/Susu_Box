import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import type { RootStackParamList } from '../../types/navigation';
import { inviteService } from '../../services/inviteService';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { useHaptics } from '../../hooks/useHaptics';
import { Screen, Text, Card, Input, Button, Badge, Confetti } from '../../components/ui';
import { AppLogo, SuccessCheck } from '../../components/illustrations';

type Props = NativeStackScreenProps<RootStackParamList, 'JoinGroup'>;

interface JoinResult {
  groupName: string;
  position: number;
}

/** Join an existing group with an invite code. */
export function JoinGroupScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const toast = useToast();
  const haptics = useHaptics();

  // Prefilled when opened from a share link or deep link.
  const [inviteCode, setInviteCode] = useState(route.params?.code?.toUpperCase() ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [joined, setJoined] = useState<JoinResult | null>(null);

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setError(undefined);
    setLoading(true);
    try {
      const result = await inviteService.joinByCode(inviteCode.trim().toUpperCase());
      setJoined({ groupName: result.group.name, position: result.position });
      haptics.celebrate();
    } catch (err) {
      setError('Invalid or expired code');
      toast.fromError(err, 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  if (joined) {
    return (
      <Screen background="gradient" edges={['top', 'bottom']} padded>
        <Confetti active />
        <View style={[styles.celebration, { gap: theme.spacing.xl }]}>
          <SuccessCheck size={132} />

          <View style={{ gap: theme.spacing.sm, alignItems: 'center' }}>
            <Text variant="h1" align="center">
              You're in
            </Text>
            <Text variant="body" tone="secondary" align="center">
              You're now member #{joined.position} of {joined.groupName}.
            </Text>
            <Badge
              label={`Your payout is day ${joined.position}`}
              tone="brand"
              size="md"
              icon="gift"
            />
          </View>

          <View style={{ alignSelf: 'stretch' }}>
            <Button
              label="Go to dashboard"
              onPress={() => navigation.navigate('Main')}
              size="lg"
              fullWidth
              icon="arrow-forward"
              iconPosition="right"
            />
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
        <Animated.View
          entering={FadeInDown.duration(500)}
          style={[styles.header, { gap: theme.spacing.lg, marginBottom: theme.spacing['3xl'] }]}
        >
          <AppLogo size={76} />
          <View style={{ gap: theme.spacing.xs, alignItems: 'center' }}>
            <Text variant="h1" align="center" accessibilityRole="header">
              Join a Susu group
            </Text>
            <Text variant="body" tone="secondary" align="center">
              Enter the invite code or share code from the group admin.
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(140).duration(500)}>
          <Card variant="glass" padding="lg" radius="2xl">
            <View style={{ gap: theme.spacing.lg }}>
              <Input
                label="Invite or share code"
                value={inviteCode}
                onChangeText={value => {
                  setInviteCode(value.toUpperCase());
                  if (error) setError(undefined);
                }}
                error={error}
                icon="key-outline"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={12}
                editable={!loading}
                helper="For example XSU-ABC-123 or GROUP-AB12"
                returnKeyType="go"
                onSubmitEditing={() => void handleJoin()}
              />

              <Button
                label="Join group"
                onPress={() => void handleJoin()}
                loading={loading}
                disabled={loading || !inviteCode}
                size="lg"
                fullWidth
                accessibilityHint="Joins the group using this invite code"
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
          Don't have a code? Ask your group admin for an invite link.
        </Text>
      </KeyboardAwareScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center' },
  celebration: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
