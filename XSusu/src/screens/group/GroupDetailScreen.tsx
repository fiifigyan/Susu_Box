import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../types/navigation';
import { groupService, type Group, type GroupMember } from '../../services/groupService';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { useHaptics } from '../../hooks/useHaptics';
import { staggerDelay, type Gradient } from '../../theme';
import {
  Screen,
  Text,
  Card,
  Button,
  Badge,
  Chip,
  Avatar,
  Divider,
  Skeleton,
  SkeletonList,
  ErrorState,
  ProgressRing,
  IconButton,
  BottomSheet,
  type BadgeTone,
} from '../../components/ui';
import { formatCurrency, formatPhone } from '../../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupDetail'>;

export function GroupDetailScreen({ route, navigation }: Props) {
  const { groupId } = route.params;
  const theme = useTheme();
  const toast = useToast();
  const haptics = useHaptics();
  const insets = useSafeAreaInsets();

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [detailMember, setDetailMember] = useState<GroupMember | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchGroupDetails();
    }, [groupId])
  );

  const fetchGroupDetails = async () => {
    try {
      setGroup(await groupService.get(groupId));
    } catch (error) {
      toast.fromError(error, 'Failed to load this group.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartGroup = async () => {
    setStarting(true);
    try {
      await groupService.start(groupId);
      haptics.celebrate();
      toast.success('Group has started!', { silent: true });
      fetchGroupDetails();
    } catch (error) {
      toast.fromError(error, 'Could not start the group.');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <Screen padded edges={['top']}>
        <View style={{ gap: theme.spacing.xl, paddingTop: theme.spacing.xl }}>
          <Skeleton height={168} radius="2xl" />
          <Skeleton height={80} radius="xl" />
          <SkeletonList count={3} />
        </View>
      </Screen>
    );
  }

  if (!group) {
    return (
      <Screen padded edges={['top']}>
        <ErrorState
          title="Group not found"
          message="This group may have been removed, or you no longer have access to it."
          onRetry={() => navigation.goBack()}
          retryLabel="Go back"
        />
      </Screen>
    );
  }

  const isForming = group.status === 'FORMING';
  const isActive = group.status === 'ACTIVE';
  const members = group.members ?? [];
  const progress = group.totalDays > 0 ? group.currentDay / group.totalDays : 0;

  const statusPresentation: Record<string, { tone: BadgeTone; gradient: Gradient }> = {
    FORMING: { tone: 'warning', gradient: theme.colors.gradientGold },
    ACTIVE: { tone: 'success', gradient: theme.colors.gradientBalance },
    COMPLETED: { tone: 'info', gradient: theme.colors.gradientSuccess },
    CANCELLED: { tone: 'error', gradient: theme.colors.gradientNeutral },
  };
  const presentation = statusPresentation[group.status] ?? statusPresentation.FORMING;

  const filledPositions = members.length;
  const openPositions = Math.max(0, group.memberCount - filledPositions);

  return (
    <Screen edges={[]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.spacing['5xl'] }}
      >
        {/* Gradient hero, extending under the status bar */}
        <LinearGradient
          colors={presentation.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: insets.top + theme.spacing.md,
            paddingBottom: theme.spacing['3xl'],
            paddingHorizontal: theme.screenPadding,
            gap: theme.spacing.lg,
          }}
        >
          <View style={styles.heroTop}>
            <IconButton
              icon="chevron-back"
              onPress={() => navigation.goBack()}
              accessibilityLabel="Go back"
              color={theme.colors.textInverse}
              style={{ marginLeft: -12 }}
            />
            <Badge label={group.status} tone={presentation.tone} size="sm" solid />
          </View>

          <View style={[styles.heroBody, { gap: theme.spacing.lg }]}>
            <View style={{ flex: 1, gap: theme.spacing.xs }}>
              <Text variant="h1" color={theme.colors.textInverse} numberOfLines={2}>
                {group.name}
              </Text>
              {group.description ? (
                <Text variant="bodySmall" color={`${theme.colors.textInverse}B3`} numberOfLines={3}>
                  {group.description}
                </Text>
              ) : null}
            </View>

            <ProgressRing
              progress={progress}
              size={84}
              thickness={8}
              color={theme.colors.textInverse}
              trackColor={`${theme.colors.textInverse}33`}
              accessibilityLabel={`Day ${group.currentDay} of ${group.totalDays}`}
            >
              <Text variant="captionSmall" color={theme.colors.textInverse}>
                Day
              </Text>
              <Text variant="h3" color={theme.colors.textInverse}>
                {group.currentDay}
              </Text>
            </ProgressRing>
          </View>
        </LinearGradient>

        <View
          style={{
            paddingHorizontal: theme.screenPadding,
            gap: theme.spacing.xl,
            // Pulls the stats grid up so it overlaps the hero.
            marginTop: -theme.spacing['2xl'],
          }}
        >
          {/* Stats */}
          <View style={styles.statsGrid}>
            <StatTile
              icon="people"
              label="Members"
              value={`${filledPositions}/${group.memberCount}`}
              tint={theme.colors.primary}
            />
            <StatTile
              icon="cash"
              label="Daily pay"
              value={formatCurrency(group.dailyContribution)}
              tint={theme.colors.accent}
            />
            <StatTile
              icon="gift"
              label="Payout"
              value={formatCurrency(group.dailyPayout)}
              tint={theme.colors.secondary}
            />
            <StatTile
              icon="calendar"
              label="Duration"
              value={`${group.totalDays} days`}
              tint={theme.colors.info}
            />
          </View>

          {/* Start */}
          {isForming ? (
            <Card variant="outlined">
              <View style={{ gap: theme.spacing.md }}>
                <Text variant="h3">Ready to start?</Text>
                <Text variant="bodySmall" tone="secondary">
                  {openPositions > 0
                    ? `${openPositions} position${openPositions === 1 ? '' : 's'} still open. All ${group.memberCount} members must join before the group can start.`
                    : 'All positions are filled. Starting the group begins day 1 and locks the rotation.'}
                </Text>
                <Button
                  label="Start group"
                  onPress={() => void handleStartGroup()}
                  loading={starting}
                  icon="play-circle"
                  fullWidth
                  accessibilityHint="Begins day one of the rotation"
                />
                <Button
                  label="Invite members"
                  onPress={() => navigation.navigate('InviteMembers', { groupId })}
                  variant="secondary"
                  icon="person-add"
                  fullWidth
                />
                <Button
                  label="View surplus allocation"
                  onPress={() => navigation.navigate('SurplusAllocation', { groupId })}
                  variant="secondary"
                  icon="pie-chart"
                  fullWidth
                />
              </View>
            </Card>
          ) : null}

          {/* Quick actions */}
          {isActive ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: theme.spacing.sm }}
            >
              <Chip
                label="Today's check-in"
                icon="today"
                selected
                onPress={() =>
                  // Targets the Today tab inside the Main tab navigator. Routed
                  // through CommonActions because `Main` takes no params in the
                  // shared param list.
                  navigation.dispatch(
                    CommonActions.navigate({ name: 'Main', params: { screen: 'Today' } })
                  )
                }
                accessibilityHint="Opens today's check-in"
              />
              <Chip
                label="Defaulters"
                icon="warning"
                tone="neutral"
                onPress={() => navigation.navigate('Defaulters', { groupId })}
              />
              <Chip
                label="Deposit"
                icon="shield-checkmark"
                tone="neutral"
                onPress={() => navigation.navigate('SecurityDeposit', { groupId })}
              />
              <Chip
                label="Invite"
                icon="person-add"
                tone="neutral"
                onPress={() => navigation.navigate('InviteMembers', { groupId })}
              />
            </ScrollView>
          ) : null}

          {/* Members */}
          <View style={{ gap: theme.spacing.md }}>
            <View style={styles.sectionHeader}>
              <Text variant="h2">Members</Text>
              <Badge label={`${filledPositions} of ${group.memberCount}`} tone="neutral" size="sm" />
            </View>

            {members.length === 0 ? (
              <Card variant="filled" padding="md">
                <Text variant="bodySmall" tone="secondary">
                  No members have joined yet. Share an invite to fill the rotation.
                </Text>
              </Card>
            ) : (
              members.map((member, index) => {
                const name = [member.user?.firstName, member.user?.lastName]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <Animated.View
                    key={member.id}
                    entering={FadeInDown.delay(staggerDelay(index)).duration(320)}
                  >
                    <Card
                      variant="outlined"
                      padding="md"
                      onPress={() => setDetailMember(member)}
                      accessibilityLabel={`${name || 'Member'}, position ${member.position}`}
                      accessibilityHint="Shows member details"
                    >
                      <View style={[styles.memberRow, { gap: theme.spacing.md }]}>
                        <Avatar name={name} size="md" />
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text variant="h4" numberOfLines={1}>
                            {name || 'Pending member'}
                          </Text>
                          <Text variant="mono" tone="tertiary" numberOfLines={1}>
                            {member.user?.phone ? formatPhone(member.user.phone) : '—'}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 4 }}>
                          <Badge label={`#${member.position}`} tone="neutral" size="sm" />
                          {member.hasReceivedPayout ? (
                            <Ionicons
                              name="checkmark-circle"
                              size={18}
                              color={theme.colors.success}
                            />
                          ) : null}
                        </View>
                      </View>
                    </Card>
                  </Animated.View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      <BottomSheet
        visible={detailMember !== null}
        onClose={() => setDetailMember(null)}
        title={
          detailMember
            ? [detailMember.user?.firstName, detailMember.user?.lastName]
                .filter(Boolean)
                .join(' ') || 'Member'
            : undefined
        }
        subtitle={detailMember ? `Position #${detailMember.position}` : undefined}
      >
        {detailMember ? (
          <View style={{ gap: theme.spacing.lg }}>
            <View style={[styles.memberRow, { gap: theme.spacing.lg }]}>
              <Avatar
                name={[detailMember.user?.firstName, detailMember.user?.lastName]
                  .filter(Boolean)
                  .join(' ')}
                size="xl"
              />
              <View style={{ flex: 1, gap: 4 }}>
                <Text variant="caption" tone="secondary">
                  Mobile money
                </Text>
                <Text variant="mono">
                  {detailMember.user?.phone ? formatPhone(detailMember.user.phone) : 'Not provided'}
                </Text>
              </View>
            </View>

            <Divider />

            <View style={styles.sectionHeader}>
              <Text variant="bodySmall" tone="secondary">
                Payout status
              </Text>
              <Badge
                label={detailMember.hasReceivedPayout ? 'Received' : 'Awaiting turn'}
                tone={detailMember.hasReceivedPayout ? 'success' : 'warning'}
                size="sm"
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text variant="bodySmall" tone="secondary">
                Payout amount
              </Text>
              <Text variant="h4">{formatCurrency(group.dailyPayout)}</Text>
            </View>
          </View>
        ) : null}
      </BottomSheet>
    </Screen>
  );
}

function StatTile({
  icon,
  label,
  value,
  tint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tint: string;
}) {
  const theme = useTheme();

  return (
    <View style={styles.statCell}>
      <Card variant="elevated" padding="md">
        <View style={{ gap: theme.spacing.sm }}>
          <View
            style={[
              styles.statIcon,
              { backgroundColor: `${tint}1F`, borderRadius: theme.radius.sm },
            ]}
          >
            <Ionicons name={icon} size={16} color={tint} />
          </View>
          <Text variant="h4" numberOfLines={1} tabular>
            {value}
          </Text>
          <Text variant="captionSmall" tone="secondary">
            {label}
          </Text>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroBody: { flexDirection: 'row', alignItems: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  statCell: { width: '50%', paddingHorizontal: 6, paddingBottom: 12 },
  statIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  memberRow: { flexDirection: 'row', alignItems: 'center' },
});
