import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeIn, FadeInLeft, FadeOut } from 'react-native-reanimated';
import { groupService, type Group } from '../../services/groupService';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { useHaptics } from '../../hooks/useHaptics';
import { staggerDelay } from '../../theme';
import {
  Screen,
  Text,
  Card,
  Chip,
  Badge,
  Avatar,
  Button,
  Skeleton,
  EmptyState,
  ScreenHeader,
} from '../../components/ui';
import { formatCurrency, formatDate, formatPhone } from '../../utils/formatters';

/** One row of `GET /groups/:id/schedule`. */
interface ScheduleEntry {
  position: number;
  name: string;
  phone: string;
  hasReceived: boolean;
  payoutDate: string | null;
  isToday: boolean;
  isPast: boolean;
}

/** Scroll offset past which the "jump to today" pill appears. */
const JUMP_THRESHOLD = 240;

export function ScheduleScreen() {
  const theme = useTheme();
  const toast = useToast();
  const haptics = useHaptics();
  const scrollRef = useRef<ScrollView>(null);
  const todayOffset = useRef(0);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [groupInfo, setGroupInfo] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [showJump, setShowJump] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [])
  );

  useEffect(() => {
    if (selectedGroupId) {
      fetchSchedule(selectedGroupId);
    }
  }, [selectedGroupId]);

  const fetchGroups = async () => {
    try {
      const allGroups = await groupService.list();
      setGroups(allGroups);
      const active = allGroups.find((g: Group) => g.status === 'ACTIVE');
      if (active && !selectedGroupId) {
        setSelectedGroupId(active.id);
        setGroupInfo(active);
      }
    } catch (error) {
      toast.fromError(error, 'Failed to load your groups.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async (groupId: string) => {
    try {
      setSchedule(await groupService.schedule(groupId));

      const group = groups.find(g => g.id === groupId);
      if (group) setGroupInfo(group);
    } catch (error) {
      toast.fromError(error, 'Failed to load the payout schedule.');
    }
  };

  const jumpToToday = () => {
    haptics.light();
    scrollRef.current?.scrollTo({
      // Leave a little headroom so today's card is not flush with the header.
      y: Math.max(0, todayOffset.current - 80),
      animated: true,
    });
  };

  if (loading) {
    return (
      <Screen padded>
        <ScreenHeader title="Payout schedule" />
        <View style={{ gap: theme.spacing.lg }}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} height={92} radius="xl" />
          ))}
        </View>
      </Screen>
    );
  }

  if (!groupInfo) {
    return (
      <Screen padded>
        <ScreenHeader title="Payout schedule" />
        <EmptyState
          title="No active group"
          message="Join an active Susu group to see when each member gets paid."
        />
      </Screen>
    );
  }

  const activeGroups = groups.filter(g => g.status === 'ACTIVE');
  const dailyPayout = groupInfo.dailyPayout;

  return (
    <Screen>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={32}
        onScroll={event => {
          const next = event.nativeEvent.contentOffset.y > JUMP_THRESHOLD;
          if (next !== showJump) setShowJump(next);
        }}
        contentContainerStyle={{
          paddingHorizontal: theme.screenPadding,
          paddingBottom: theme.spacing['5xl'],
          gap: theme.spacing.lg,
        }}
      >
        <ScreenHeader
          title="Payout schedule"
          subtitle={`${groupInfo.totalDays} days · ${formatCurrency(dailyPayout)} per payout`}
        />

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
                accessibilityLabel={`Show schedule for ${group.name}`}
              />
            ))}
          </ScrollView>
        ) : null}

        {/* Legend */}
        <View style={[styles.legend, { gap: theme.spacing.lg }]}>
          <LegendItem color={theme.colors.success} label="Paid out" />
          <LegendItem color={theme.colors.primary} label="Today" />
          <LegendItem color={theme.colors.border} label="Upcoming" />
        </View>

        {/* Timeline */}
        <View>
          {schedule.map((entry, index) => (
            <Animated.View
              key={entry.position}
              entering={FadeInLeft.delay(staggerDelay(index)).duration(340)}
              onLayout={event => {
                if (entry.isToday) todayOffset.current = event.nativeEvent.layout.y;
              }}
              style={styles.timelineRow}
            >
              {/* Rail */}
              <View style={styles.rail}>
                <View
                  style={[
                    styles.node,
                    {
                      borderRadius: theme.radius.full,
                      backgroundColor: entry.hasReceived
                        ? theme.colors.success
                        : entry.isToday
                          ? theme.colors.primary
                          : theme.colors.surfaceSunken,
                      // Today's node is enlarged and ringed to anchor the eye.
                      width: entry.isToday ? 34 : 28,
                      height: entry.isToday ? 34 : 28,
                      borderWidth: entry.isToday ? 3 : 0,
                      borderColor: theme.colors.primarySubtle,
                    },
                  ]}
                >
                  {entry.hasReceived ? (
                    <Ionicons name="checkmark" size={15} color={theme.colors.onPrimary} />
                  ) : (
                    <Text
                      variant="captionSmall"
                      color={entry.isToday ? theme.colors.onPrimary : theme.colors.textSecondary}
                    >
                      {entry.position}
                    </Text>
                  )}
                </View>

                {index < schedule.length - 1 ? (
                  <View
                    style={[
                      styles.connector,
                      {
                        backgroundColor: entry.isPast
                          ? theme.colors.success
                          : theme.colors.border,
                      },
                    ]}
                  />
                ) : null}
              </View>

              {/* Card */}
              <View style={[styles.timelineBody, { paddingBottom: theme.spacing.lg }]}>
                <Card
                  variant={entry.isToday ? 'elevated' : 'outlined'}
                  padding="md"
                  style={entry.isPast && !entry.isToday ? styles.past : undefined}
                >
                  <View style={[styles.cardRow, { gap: theme.spacing.md }]}>
                    <Avatar name={entry.name} size="md" />

                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={[styles.cardRow, { gap: theme.spacing.sm }]}>
                        <Text variant="h4" numberOfLines={1} style={{ flexShrink: 1 }}>
                          {entry.name}
                        </Text>
                        {entry.isToday ? <Badge label="Today" tone="brand" size="sm" /> : null}
                      </View>

                      {entry.phone ? (
                        <Text variant="mono" tone="tertiary" numberOfLines={1}>
                          {formatPhone(entry.phone)}
                        </Text>
                      ) : null}

                      <Text variant="bodyMedium" tone={entry.hasReceived ? 'success' : 'brand'}>
                        {formatCurrency(dailyPayout)}
                      </Text>

                      {entry.hasReceived && entry.payoutDate ? (
                        <Text variant="captionSmall" tone="tertiary">
                          Paid {formatDate(entry.payoutDate)}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </Card>
              </View>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {showJump ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.jumpWrapper}
        >
          <Button
            label="Jump to today"
            onPress={jumpToToday}
            variant="secondary"
            size="sm"
            icon="arrow-up-circle"
            accessibilityHint="Scrolls to today's payout"
          />
        </Animated.View>
      ) : null}
    </Screen>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text variant="captionSmall" tone="secondary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', alignItems: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  timelineRow: { flexDirection: 'row' },
  rail: { width: 40, alignItems: 'center' },
  node: { alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  connector: { width: 2, flex: 1, marginVertical: 4 },
  timelineBody: { flex: 1, marginLeft: 8 },
  past: { opacity: 0.65 },
  jumpWrapper: { position: 'absolute', bottom: 24, alignSelf: 'center' },
});
