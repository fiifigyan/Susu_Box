import React, { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import type { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useSecurity } from '../../contexts/SecurityContext';
import { useDashboard } from '../../hooks/useDashboard';
import { useTheme, useThemePreference } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { useHaptics } from '../../hooks/useHaptics';
import type { ThemePreference } from '../../contexts/ThemeContext';
import {
  Screen,
  Text,
  Card,
  Avatar,
  Badge,
  Divider,
  ListItem,
  Skeleton,
  SegmentedControl,
  ConfirmSheet,
  type Segment,
} from '../../components/ui';
import { formatCurrency, formatPhone } from '../../utils/formatters';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const HEADER_FADE_DISTANCE = 120;

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const { authenticateWithBiometrics } = useSecurity();
  const navigation = useNavigation<Navigation>();
  const theme = useTheme();
  const toast = useToast();
  const haptics = useHaptics();
  const { preference, setPreference } = useThemePreference();
  const { summary, loading } = useDashboard();

  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y;
  });

  // Parallax: the avatar shrinks and fades as the user scrolls into the menu.
  const heroStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, HEADER_FADE_DISTANCE], [1, 0.25], 'clamp'),
    transform: [
      { scale: interpolate(scrollY.value, [0, HEADER_FADE_DISTANCE], [1, 0.88], 'clamp') },
      { translateY: interpolate(scrollY.value, [0, HEADER_FADE_DISTANCE], [0, -18], 'clamp') },
    ],
  }));

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');

  const themeSegments: Segment<ThemePreference>[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await logout();
    } catch (error) {
      toast.fromError(error, 'Could not sign out. Please try again.');
    } finally {
      setSigningOut(false);
      setSignOutOpen(false);
    }
  };

  const toggleBiometrics = async (next: boolean) => {
    if (!next) {
      setBiometricsEnabled(false);
      toast.info('Biometric unlock turned off');
      return;
    }

    // Require a successful check before enabling, so the setting can never be
    // switched on for a device that cannot satisfy it.
    const ok = await authenticateWithBiometrics();
    if (ok) {
      setBiometricsEnabled(true);
      haptics.success();
      toast.success('Biometric unlock enabled');
    } else {
      toast.error('Could not verify your biometrics');
    }
  };

  return (
    <Screen>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.screenPadding,
          paddingBottom: theme.spacing['5xl'],
          gap: theme.spacing.xl,
        }}
      >
        {/* Hero */}
        <Animated.View
          style={[styles.hero, heroStyle, { gap: theme.spacing.md, paddingTop: theme.spacing.xl }]}
        >
          <Avatar name={fullName || user?.email} size="2xl" />
          <View style={{ gap: theme.spacing.xs, alignItems: 'center' }}>
            <Text variant="h1" align="center" numberOfLines={1}>
              {fullName || 'Your profile'}
            </Text>
            <Text variant="bodySmall" tone="secondary">
              {user?.email}
            </Text>
            {user?.phone ? (
              <Text variant="mono" tone="tertiary">
                {formatPhone(user.phone)}
              </Text>
            ) : null}
          </View>

          <View style={[styles.badges, { gap: theme.spacing.sm }]}>
            <Badge
              label={user?.role === 'GROUP_ADMIN' ? 'Group admin' : 'Member'}
              tone="brand"
              size="sm"
              icon="person"
            />
            {user?.isVerified ? (
              <Badge label="Verified" tone="success" size="sm" icon="shield-checkmark" />
            ) : (
              <Badge label="Unverified" tone="warning" size="sm" icon="alert-circle" />
            )}
          </View>
        </Animated.View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <View key={index} style={styles.statCell}>
                  <Skeleton height={92} radius="xl" />
                </View>
              ))
            : [
                {
                  icon: 'people' as const,
                  label: 'Groups joined',
                  value: String(summary?.groupsJoined ?? 0),
                  tint: theme.colors.primary,
                },
                {
                  icon: 'repeat' as const,
                  label: 'Contributions',
                  value: String(summary?.contributionsCount ?? 0),
                  tint: theme.colors.accent,
                },
                {
                  icon: 'gift' as const,
                  label: 'Payouts received',
                  value: String(summary?.payoutsReceived ?? 0),
                  tint: theme.colors.secondary,
                },
                {
                  icon: 'trending-up' as const,
                  label: 'Total saved',
                  value: formatCurrency(summary?.totalContributed ?? 0),
                  tint: theme.colors.success,
                },
              ].map((stat, index) => (
                <Animated.View
                  key={stat.label}
                  entering={FadeInDown.delay(index * 60).duration(360)}
                  style={styles.statCell}
                >
                  <Card variant="outlined" padding="md">
                    <View style={{ gap: theme.spacing.sm }}>
                      <View
                        style={[
                          styles.statIcon,
                          { backgroundColor: `${stat.tint}1F`, borderRadius: theme.radius.sm },
                        ]}
                      >
                        <Ionicons name={stat.icon} size={16} color={stat.tint} />
                      </View>
                      <Text variant="h3" numberOfLines={1} tabular>
                        {stat.value}
                      </Text>
                      <Text variant="captionSmall" tone="secondary" numberOfLines={1}>
                        {stat.label}
                      </Text>
                    </View>
                  </Card>
                </Animated.View>
              ))}
        </View>

        {/* Payments */}
        <Section title="Payments">
          <ListItem
            title="Auto-charge"
            subtitle="Never miss a contribution after your payout"
            icon="card"
            index={0}
            onPress={() => navigation.navigate('SetupAutoCharge')}
            accessibilityHint="Opens auto-charge setup"
          />
        </Section>

        {/* Security */}
        <Section title="Security">
          <ListItem
            title="Biometric unlock"
            subtitle="Use your fingerprint or face to unlock XSusu"
            icon="finger-print"
            index={0}
            trailing={
              <Switch
                value={biometricsEnabled}
                onValueChange={value => void toggleBiometrics(value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.surface}
                accessibilityLabel="Biometric unlock"
              />
            }
          />
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <View style={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md }}>
            <Text variant="bodySmall" tone="secondary">
              Choose how XSusu looks. System follows your device setting.
            </Text>
            <SegmentedControl
              segments={themeSegments}
              value={preference}
              onChange={setPreference}
            />
          </View>
        </Section>

        {/* Account */}
        <Section title="Account">
          <ListItem
            title="Sign out"
            subtitle="You'll need your password to sign back in"
            icon="log-out"
            destructive
            index={0}
            onPress={() => setSignOutOpen(true)}
            accessibilityHint="Opens a confirmation before signing out"
          />
        </Section>
      </Animated.ScrollView>

      <ConfirmSheet
        visible={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        onConfirm={() => void handleSignOut()}
        title="Sign out?"
        message="You'll need to sign in again to check in or receive payouts."
        confirmLabel="Sign out"
        destructive
        loading={signingOut}
      />
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Text variant="overline" tone="tertiary" style={{ paddingHorizontal: theme.spacing.lg }}>
        {title}
      </Text>
      <Card variant="outlined" padding="none">
        {children}
      </Card>
      <Divider inset={theme.spacing.lg} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center' },
  badges: { flexDirection: 'row', alignItems: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  statCell: { width: '50%', paddingHorizontal: 6, paddingBottom: 12 },
  statIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
});
