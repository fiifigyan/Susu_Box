import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text } from '../ui/Text';
import { Card } from '../ui/Card';
import { Badge, type BadgeTone } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { AvatarStack } from '../ui/Avatar';
import { useTheme } from '../../hooks/useTheme';
import { staggerDelay, type Gradient } from '../../theme';
import { formatCurrency } from '../../utils/formatters';
import type { Group } from '../../services/groupService';

/** `myPosition` is attached by the API alongside the group payload. */
export interface GroupCardGroup extends Group {
  myPosition?: number;
}

export interface GroupCardProps {
  group: GroupCardGroup;
  onPress: () => void;
  /** Hides the progress bar and stats, for dense lists. */
  compact?: boolean;
  /** Position in the list, used to stagger the entrance animation. */
  index?: number;
}

type GroupStatus = 'FORMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

function statusOf(status: string): GroupStatus {
  if (status === 'ACTIVE' || status === 'COMPLETED' || status === 'CANCELLED') return status;
  return 'FORMING';
}

export function GroupCard({ group, onPress, compact = false, index }: GroupCardProps) {
  const theme = useTheme();
  const status = statusOf(group.status);

  const totalDays = typeof group.totalDays === 'number' ? group.totalDays : 0;
  const currentDay = typeof group.currentDay === 'number' ? group.currentDay : 0;
  const progress = totalDays > 0 ? currentDay / totalDays : 0;

  const presentation: Record<
    GroupStatus,
    { tone: BadgeTone; label: string; icon: keyof typeof Ionicons.glyphMap; gradient: Gradient }
  > = {
    FORMING: {
      tone: 'warning',
      label: 'Forming',
      icon: 'person-add',
      gradient: theme.colors.gradientGold,
    },
    ACTIVE: {
      tone: 'success',
      label: 'Active',
      icon: 'people',
      gradient: theme.colors.gradientPrimary,
    },
    COMPLETED: {
      tone: 'info',
      label: 'Completed',
      icon: 'checkmark-done',
      gradient: theme.colors.gradientSuccess,
    },
    CANCELLED: {
      tone: 'error',
      label: 'Cancelled',
      icon: 'close-circle',
      gradient: theme.colors.gradientNeutral,
    },
  };

  const { tone, label, icon, gradient } = presentation[status];

  const memberNames = (group.members ?? [])
    .map(member =>
      [member.user?.firstName, member.user?.lastName].filter(Boolean).join(' ').trim()
    )
    .filter(name => name.length > 0);

  const body = (
    <Card
      variant="elevated"
      padding="none"
      onPress={onPress}
      accessibilityLabel={`${group.name}, ${label}, day ${currentDay} of ${totalDays}`}
      accessibilityHint="Opens the group details"
    >
      {/* Gradient band, tinted by status, so state is legible before reading */}
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.band}
      />

      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <View style={[styles.header, { gap: theme.spacing.md }]}>
          <View
            style={[
              styles.iconTile,
              { backgroundColor: theme.colors.primarySubtle, borderRadius: theme.radius.md },
            ]}
          >
            <Ionicons name={icon} size={20} color={theme.colors.primary} />
          </View>

          <View style={styles.titles}>
            <Text variant="h3" numberOfLines={1}>
              {group.name}
            </Text>
            <Text variant="bodySmall" tone="secondary" numberOfLines={1}>
              {group.myPosition ? `Your position #${group.myPosition}` : `${group.memberCount} members`}
            </Text>
          </View>

          <Badge label={label} tone={tone} size="sm" dot />
        </View>

        {compact ? null : (
          <>
            <View style={{ gap: theme.spacing.sm }}>
              <ProgressBar
                progress={progress}
                gradient={gradient}
                accessibilityLabel={`Day ${currentDay} of ${totalDays}`}
              />
              <View style={styles.progressMeta}>
                <Text variant="caption" tone="secondary">
                  Day {currentDay} of {totalDays}
                </Text>
                <Text variant="caption" tone="brand">
                  {Math.round(progress * 100)}%
                </Text>
              </View>
            </View>

            <View style={[styles.footer, { gap: theme.spacing.md }]}>
              {memberNames.length > 0 ? (
                <AvatarStack names={memberNames} size="sm" max={4} />
              ) : (
                <Badge label={`${group.memberCount} members`} tone="neutral" size="sm" icon="people" />
              )}

              <View style={[styles.amounts, { gap: theme.spacing.sm }]}>
                <Badge
                  label={`${formatCurrency(group.dailyContribution)}/day`}
                  tone="neutral"
                  size="sm"
                />
                <Badge label={formatCurrency(group.dailyPayout)} tone="brand" size="sm" icon="arrow-up" />
              </View>
            </View>
          </>
        )}
      </View>
    </Card>
  );

  if (index === undefined) return body;

  return (
    <Animated.View entering={FadeInDown.delay(staggerDelay(index)).duration(340)}>
      {body}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  band: { height: 5, width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center' },
  iconTile: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  titles: { flex: 1, gap: 2 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  amounts: { flexDirection: 'row', alignItems: 'center' },
});
