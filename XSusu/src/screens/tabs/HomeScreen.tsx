import React from 'react';
import { RefreshControl, StyleSheet, View, useWindowDimensions } from 'react-native';
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
import { useDashboard } from '../../hooks/useDashboard';
import { useGroups } from '../../hooks/useGroups';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import {
  Screen,
  Text,
  Card,
  Avatar,
  Badge,
  AnimatedCounter,
  Sparkline,
  SkeletonList,
  Skeleton,
  EmptyState,
  ErrorState,
  IconButton,
} from '../../components/ui';
import { GroupCard } from '../../components/susu';
import { formatCurrency } from '../../utils/formatters';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

/** Distance over which the greeting header fades out as the user scrolls. */
const HEADER_FADE_DISTANCE = 90;

interface QuickAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color: string;
  hint: string;
}

export function HomeScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const haptics = useHaptics();
  const navigation = useNavigation<Navigation>();
  const { width } = useWindowDimensions();

  const { summary, loading: summaryLoading, refreshing, error, refresh } = useDashboard();
  const { groups, loading: groupsLoading } = useGroups();

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y;
  });

  // Parallax: the greeting drifts up and fades as content scrolls over it.
  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, HEADER_FADE_DISTANCE], [1, 0], 'clamp'),
    transform: [
      { translateY: interpolate(scrollY.value, [0, HEADER_FADE_DISTANCE], [0, -24], 'clamp') },
    ],
  }));

  const firstName = user?.firstName || 'there';
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  const activeGroups = groups.filter(group => group.status === 'ACTIVE');
  const isLoading = summaryLoading || groupsLoading;

  const quickActions: QuickAction[] = [
    {
      icon: 'add',
      label: 'Create',
      onPress: () => navigation.navigate('CreateGroup'),
      color: theme.colors.primary,
      hint: 'Create a new Susu group',
    },
    {
      icon: 'enter',
      label: 'Join',
      onPress: () => navigation.navigate('JoinGroup'),
      color: theme.colors.accent,
      hint: 'Join a group with an invite code',
    },
    {
      icon: 'card',
      label: 'Auto-pay',
      onPress: () => navigation.navigate('SetupAutoCharge'),
      color: theme.colors.info,
      hint: 'Set up automatic contributions',
    },
    {
      icon: 'shield-checkmark',
      label: 'Deposits',
      onPress: () => {
        const target = activeGroups[0] ?? groups[0];
        if (target) navigation.navigate('SecurityDeposit', { groupId: target.id });
      },
      color: theme.colors.secondary,
      hint: 'Review your security deposit',
    },
  ];

  const trendValues = summary?.trend.map(point => point.amount) ?? [];
  const trendUp = (summary?.trendChangePercent ?? 0) >= 0;

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              haptics.light();
              void refresh();
            }}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Greeting */}
        <Animated.View style={[styles.greeting, headerStyle, { paddingTop: theme.spacing.md }]}>
          <View style={styles.greetingText}>
            <Text variant="bodySmall" tone="secondary">
              {greetingFor(new Date())}
            </Text>
            <Text variant="h1" numberOfLines={1}>
              {firstName}
            </Text>
          </View>
          <Avatar name={fullName || firstName} size="lg" />
        </Animated.View>

        {error && !summary ? (
          <ErrorState message={error} onRetry={() => void refresh()} />
        ) : (
          <>
            {/* Hero balance */}
            {isLoading ? (
              <Skeleton height={196} radius="2xl" />
            ) : (
              <Animated.View entering={FadeInDown.duration(420)}>
                <Card variant="gradient" gradient={theme.colors.gradientBalance} padding="lg">
                  <View style={{ gap: theme.spacing.lg }}>
                    <View style={styles.balanceHeader}>
                      <Text variant="overline" color={`${theme.colors.textInverse}B3`}>
                        Total contributed
                      </Text>
                      <Ionicons
                        name="trending-up"
                        size={18}
                        color={`${theme.colors.textInverse}B3`}
                      />
                    </View>

                    <AnimatedCounter
                      value={summary?.totalContributed ?? 0}
                      prefix="GHS "
                      decimals={2}
                      variant="display"
                      color={theme.colors.textInverse}
                      accessibilityLabel={`Total contributed ${formatCurrency(
                        summary?.totalContributed ?? 0
                      )}`}
                    />

                    <View style={[styles.balanceFooter, { gap: theme.spacing.md }]}>
                      <BalanceStat
                        label="Received"
                        value={summary?.totalReceived ?? 0}
                        icon="arrow-down-circle"
                      />
                      <View
                        style={{
                          width: StyleSheet.hairlineWidth,
                          backgroundColor: `${theme.colors.textInverse}40`,
                        }}
                      />
                      <BalanceStat
                        label="Held back"
                        value={summary?.heldBack ?? 0}
                        icon="lock-closed"
                      />
                    </View>
                  </View>
                </Card>
              </Animated.View>
            )}

            {/* Next payout */}
            {summary?.nextPayout ? (
              <Animated.View entering={FadeInDown.delay(60).duration(420)}>
                <Card
                  variant="outlined"
                  onPress={() =>
                    navigation.navigate('GroupDetail', { groupId: summary.nextPayout!.groupId })
                  }
                  accessibilityLabel={`Next payout ${formatCurrency(
                    summary.nextPayout.amount
                  )} in ${summary.nextPayout.daysAway} days`}
                  accessibilityHint="Opens the group"
                >
                  <View style={[styles.row, { gap: theme.spacing.lg }]}>
                    <View
                      style={[
                        styles.iconTile,
                        {
                          backgroundColor: theme.colors.secondarySubtle,
                          borderRadius: theme.radius.md,
                        },
                      ]}
                    >
                      <Ionicons name="gift" size={22} color={theme.colors.secondary} />
                    </View>

                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="caption" tone="secondary">
                        Your next payout
                      </Text>
                      <Text variant="h3">{formatCurrency(summary.nextPayout.amount)}</Text>
                      <Text variant="bodySmall" tone="secondary" numberOfLines={1}>
                        {summary.nextPayout.groupName}
                      </Text>
                    </View>

                    <Badge
                      label={
                        summary.nextPayout.daysAway === 0
                          ? 'Today'
                          : summary.nextPayout.daysAway === 1
                            ? 'Tomorrow'
                            : `${summary.nextPayout.daysAway} days`
                      }
                      tone={summary.nextPayout.daysAway === 0 ? 'warning' : 'brand'}
                      size="sm"
                    />
                  </View>
                </Card>
              </Animated.View>
            ) : null}

            {/* Contribution trend */}
            {isLoading ? (
              <Skeleton height={148} radius="2xl" />
            ) : trendValues.length >= 2 ? (
              <Animated.View entering={FadeInDown.delay(120).duration(420)}>
                <Card variant="elevated">
                  <View style={{ gap: theme.spacing.md }}>
                    <View style={styles.trendHeader}>
                      <View style={{ gap: 2 }}>
                        <Text variant="caption" tone="secondary">
                          Last 7 days
                        </Text>
                        <Text variant="h2">
                          {formatCurrency(trendValues.reduce((sum, value) => sum + value, 0))}
                        </Text>
                      </View>

                      <Badge
                        label={`${trendUp ? '+' : ''}${Math.round(
                          summary?.trendChangePercent ?? 0
                        )}%`}
                        tone={trendUp ? 'success' : 'error'}
                        icon={trendUp ? 'arrow-up' : 'arrow-down'}
                        size="sm"
                      />
                    </View>

                    <Sparkline
                      data={trendValues}
                      // Card padding is 20 each side plus the screen gutter.
                      width={width - theme.screenPadding * 2 - theme.spacing.xl * 2}
                      height={56}
                      color={trendUp ? theme.colors.success : theme.colors.error}
                    />
                  </View>
                </Card>
              </Animated.View>
            ) : null}

            {/* Quick actions */}
            <Animated.View entering={FadeInDown.delay(180).duration(420)}>
              <View style={styles.quickActions}>
                {quickActions.map(action => (
                  <View key={action.label} style={styles.quickAction}>
                    <IconButton
                      icon={action.icon}
                      onPress={action.onPress}
                      accessibilityLabel={action.label}
                      accessibilityHint={action.hint}
                      size="lg"
                      variant="surface"
                      color={action.color}
                    />
                    <Text variant="captionSmall" tone="secondary">
                      {action.label}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Active groups */}
            <View style={{ gap: theme.spacing.lg }}>
              <View style={styles.sectionHeader}>
                <Text variant="h2">Your groups</Text>
                {summary ? (
                  <Badge
                    label={`${summary.activeGroups} active`}
                    tone="success"
                    size="sm"
                    dot
                  />
                ) : null}
              </View>

              {isLoading ? (
                <SkeletonList count={2} />
              ) : groups.length === 0 ? (
                <EmptyState
                  title="No groups yet"
                  message="Create a Susu group or join one with an invite code to start saving together."
                  actionLabel="Create a group"
                  onAction={() => navigation.navigate('CreateGroup')}
                  secondaryActionLabel="Join with a code"
                  onSecondaryAction={() => navigation.navigate('JoinGroup')}
                />
              ) : (
                groups
                  .slice(0, 3)
                  .map((group, index) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      index={index}
                      onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
                    />
                  ))
              )}
            </View>
          </>
        )}
      </Animated.ScrollView>
    </Screen>
  );
}

/** Small labelled figure inside the hero balance card. */
function BalanceStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const theme = useTheme();
  const muted = `${theme.colors.textInverse}B3`;

  return (
    <View style={{ flex: 1, gap: 2 }}>
      <View style={[styles.row, { gap: 4 }]}>
        <Ionicons name={icon} size={12} color={muted} />
        <Text variant="captionSmall" color={muted}>
          {label}
        </Text>
      </View>
      <Text variant="h4" color={theme.colors.textInverse} tabular>
        {formatCurrency(value)}
      </Text>
    </View>
  );
}

function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  greeting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greetingText: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconTile: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceFooter: { flexDirection: 'row', alignItems: 'center' },
  trendHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  quickAction: { alignItems: 'center', gap: 8, flex: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
