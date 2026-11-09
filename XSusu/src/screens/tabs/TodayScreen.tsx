import React, { useState, useCallback, useEffect } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { groupService, type Group } from '../../services/groupService';
import { contributionService, type TodayStatus } from '../../services/contributionService';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { useHaptics } from '../../hooks/useHaptics';
import {
  Screen,
  Text,
  Card,
  Button,
  Chip,
  Badge,
  Divider,
  Avatar,
  Skeleton,
  SkeletonList,
  EmptyState,
  BottomSheet,
  Confetti,
  ScreenHeader,
} from '../../components/ui';
import { MemberRow, PayoutBanner, ProgressCircle } from '../../components/susu';
import { formatCurrency, formatPhone } from '../../utils/formatters';

interface PendingMember {
  id: string;
  name: string;
  phone: string | null;
  position: number;
}

export function TodayScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const toast = useToast();
  const haptics = useHaptics();

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [detailMember, setDetailMember] = useState<PendingMember | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [])
  );

  useEffect(() => {
    if (selectedGroupId) {
      fetchTodayStatus(selectedGroupId);
    }
  }, [selectedGroupId]);

  const fetchGroups = async () => {
    try {
      const fetchedGroups = await groupService.list();
      setGroups(fetchedGroups);
      const activeGroup = fetchedGroups.find((group: Group) => group.status === 'ACTIVE');
      if (activeGroup && !selectedGroupId) {
        setSelectedGroupId(activeGroup.id);
      }
    } catch (error) {
      toast.fromError(error, 'Failed to load your groups.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayStatus = async (groupId: string) => {
    try {
      setTodayStatus(await contributionService.today(groupId));
    } catch (error) {
      toast.fromError(error, 'Failed to load today’s status.');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    haptics.light();
    await fetchGroups();
    if (selectedGroupId) await fetchTodayStatus(selectedGroupId);
    setRefreshing(false);
  };

  const handleManualCheckIn = async (memberId: string) => {
    if (!selectedGroupId || !todayStatus) return;

    // Without the group we have no contribution amount, and sending an
    // undefined amount would record a malformed contribution.
    const group = groups.find(g => g.id === selectedGroupId);
    if (!group) {
      toast.error('Group details are still loading', { description: 'Try again in a moment.' });
      return;
    }

    try {
      await contributionService.record(selectedGroupId, todayStatus.day, group.dailyContribution);
      haptics.success();
      toast.success('Payment recorded', { silent: true });
      fetchTodayStatus(selectedGroupId);
    } catch (error) {
      toast.fromError(error, 'Failed to record payment');
    }
  };

  const handleAutoVerify = async (memberId: string) => {
    if (!selectedGroupId || !todayStatus) return;

    const group = groups.find(g => g.id === selectedGroupId);
    if (!group) {
      toast.error('Group details are still loading', { description: 'Try again in a moment.' });
      return;
    }

    setVerifying(memberId);
    try {
      await contributionService.verify(
        selectedGroupId,
        todayStatus.day,
        group.dailyContribution,
        `MOMO-${Date.now()}`
      );
      haptics.success();
      toast.success('Payment verified', { silent: true });
      fetchTodayStatus(selectedGroupId);
    } catch (error) {
      toast.fromError(error, 'Verification failed');
    } finally {
      setVerifying(null);
    }
  };

  const handleCompletePayout = async () => {
    if (!selectedGroupId || !todayStatus?.allPaid) return;
    setCompleting(true);
    try {
      await contributionService.completePayout(selectedGroupId, todayStatus.day);
      // Celebrate before refetching, so the burst is not cut short by a re-render.
      setCelebrating(true);
      haptics.celebrate();
      toast.success('Payout completed', { description: 'Moving to the next day.', silent: true });
      fetchTodayStatus(selectedGroupId);
      setTimeout(() => setCelebrating(false), 3200);
    } catch (error) {
      toast.fromError(error, 'Failed to complete the payout');
    } finally {
      setCompleting(false);
    }
  };

  const activeGroup = groups.find(g => g.id === selectedGroupId && g.status === 'ACTIVE');
  const activeGroups = groups.filter(g => g.status === 'ACTIVE');

  if (loading) {
    return (
      <Screen padded>
        <ScreenHeader title="Today" />
        <View style={{ gap: theme.spacing.xl }}>
          <Skeleton height={44} radius="full" />
          <View style={styles.centered}>
            <Skeleton width={150} height={150} radius="full" />
          </View>
          <Skeleton height={180} radius="2xl" />
          <SkeletonList count={2} />
        </View>
      </Screen>
    );
  }

  if (!activeGroup) {
    return (
      <Screen padded>
        <ScreenHeader title="Today" />
        <EmptyState
          title="No active group"
          message="Join or create a Susu group to start daily check-ins with your members."
        />
      </Screen>
    );
  }

  const paidCount = todayStatus?.paidCount ?? 0;
  const totalMembers = todayStatus?.totalMembers ?? 0;
  const progress = totalMembers > 0 ? (paidCount / totalMembers) * 100 : 0;
  const pendingMembers = (todayStatus?.pendingMembers ?? []) as PendingMember[];
  const recipient = todayStatus?.todayRecipient ?? null;
  // Match on phone as well as name: the API returns a display name, not an id
  // that can be compared with the signed-in user's.
  const isMyPayout = Boolean(
    recipient &&
      user &&
      (recipient.phone === user.phone ||
        recipient.name.trim().toLowerCase() ===
          `${user.firstName} ${user.lastName}`.trim().toLowerCase())
  );
  const useAutoVerify = activeGroup.verificationMethod === 'AUTO_VERIFY';

  return (
    <Screen>
      {celebrating ? <Confetti active /> : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.screenPadding,
          paddingBottom: theme.spacing['5xl'],
          gap: theme.spacing.xl,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <ScreenHeader
          title="Today"
          subtitle={`Day ${activeGroup.currentDay} of ${activeGroup.totalDays}`}
        />

        {/* Group selector */}
        {activeGroups.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: theme.spacing.sm }}
          >
            {activeGroups.map(group => (
              <Chip
                key={group.id}
                label={group.name}
                selected={selectedGroupId === group.id}
                onPress={() => setSelectedGroupId(group.id)}
                accessibilityLabel={`Show ${group.name}`}
              />
            ))}
          </ScrollView>
        ) : null}

        {/* Progress */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.centered}>
          <ProgressCircle
            progress={progress}
            size={168}
            strokeWidth={14}
            colorCoded
            label={`${paidCount}/${totalMembers} paid`}
            accessibilityLabel={`${paidCount} of ${totalMembers} members have paid`}
          />
        </Animated.View>

        {/* Today's recipient */}
        {recipient ? (
          <PayoutBanner
            recipientName={recipient.name}
            recipientPhone={recipient.phone}
            payoutAmount={activeGroup.dailyPayout}
            contributionAmount={activeGroup.dailyContribution}
            isCurrentUser={isMyPayout}
            position={recipient.position}
          />
        ) : null}

        {/* Held back notice */}
        {todayStatus && todayStatus.heldBackAmount > 0 ? (
          <Card variant="filled" padding="md">
            <View style={[styles.row, { gap: theme.spacing.md }]}>
              <Badge label="Held back" tone="warning" size="sm" icon="lock-closed" />
              <Text variant="bodySmall" tone="secondary" style={{ flex: 1 }}>
                {formatCurrency(todayStatus.heldBackAmount)} is held until the group's hold-back
                window closes.
              </Text>
            </View>
          </Card>
        ) : null}

        {/* Members */}
        <View style={{ gap: theme.spacing.md }}>
          <View style={styles.sectionHeader}>
            <Text variant="h2">Members</Text>
            {paidCount > 0 ? (
              <Badge label={`${paidCount} paid`} tone="success" size="sm" icon="checkmark-circle" />
            ) : null}
          </View>

          {pendingMembers.length === 0 ? (
            <Card variant="filled" padding="md">
              <View style={[styles.row, { gap: theme.spacing.md }]}>
                <Badge label="All paid" tone="success" size="md" icon="checkmark-done" />
                <Text variant="bodySmall" tone="secondary" style={{ flex: 1 }}>
                  Everyone has contributed for day {todayStatus?.day ?? activeGroup.currentDay}.
                </Text>
              </View>
            </Card>
          ) : (
            pendingMembers.map((member, index) => (
              <MemberRow
                key={member.id}
                name={member.name}
                phone={member.phone ?? ''}
                status={todayStatus?.atRiskMemberIds.includes(member.id) ? 'MISSED' : 'PENDING'}
                position={member.position}
                index={index}
                onCheckIn={() => handleManualCheckIn(member.id)}
                onVerify={() => handleAutoVerify(member.id)}
                isVerifying={verifying === member.id}
                showAutoVerify={useAutoVerify}
                onLongPress={() => setDetailMember(member)}
              />
            ))
          )}

          {pendingMembers.length > 0 ? (
            <Text variant="captionSmall" tone="tertiary" align="center">
              Swipe a row right to check in
              {useAutoVerify ? ', left to verify' : ''} · long press for details
            </Text>
          ) : null}
        </View>

        {/* Complete payout */}
        {todayStatus?.allPaid ? (
          <Animated.View entering={FadeInDown.duration(420)}>
            <Button
              label={`Complete payout · ${formatCurrency(activeGroup.dailyPayout)}`}
              onPress={() => void handleCompletePayout()}
              loading={completing}
              icon="checkmark-circle"
              size="lg"
              fullWidth
              accessibilityHint="Distributes today's payout and advances the group to the next day"
            />
          </Animated.View>
        ) : null}
      </ScrollView>

      {/* Member detail */}
      <BottomSheet
        visible={detailMember !== null}
        onClose={() => setDetailMember(null)}
        title={detailMember?.name}
        subtitle={`Position #${detailMember?.position ?? ''}`}
      >
        {detailMember ? (
          <View style={{ gap: theme.spacing.lg }}>
            <View style={[styles.row, { gap: theme.spacing.lg }]}>
              <Avatar name={detailMember.name} size="xl" />
              <View style={{ flex: 1, gap: 4 }}>
                <Text variant="caption" tone="secondary">
                  Mobile money
                </Text>
                <Text variant="mono">
                  {detailMember.phone ? formatPhone(detailMember.phone) : 'Not provided'}
                </Text>
              </View>
            </View>

            <Divider />

            <View style={styles.sectionHeader}>
              <Text variant="bodySmall" tone="secondary">
                Owed today
              </Text>
              <Text variant="h4">{formatCurrency(activeGroup.dailyContribution)}</Text>
            </View>

            <Button
              label="Mark as paid"
              onPress={() => {
                const member = detailMember;
                setDetailMember(null);
                void handleManualCheckIn(member.id);
              }}
              icon="checkmark"
              fullWidth
            />

            {useAutoVerify ? (
              <Button
                label="Verify via mobile money"
                onPress={() => {
                  const member = detailMember;
                  setDetailMember(null);
                  void handleAutoVerify(member.id);
                }}
                variant="secondary"
                icon="shield-checkmark"
                fullWidth
              />
            ) : null}
          </View>
        ) : null}
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
