import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { RootStackParamList } from '../../types/navigation';
import { useDefaultPrevention } from '../../hooks/useDefaultPrevention';
import { useTheme } from '../../hooks/useTheme';
import { staggerDelay } from '../../theme';
import {
  Screen,
  Text,
  Card,
  Badge,
  Avatar,
  Divider,
  Skeleton,
  EmptyState,
  ScreenHeader,
} from '../../components/ui';
import { formatCurrency, formatPhone } from '../../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'Defaulters'>;

export function DefaultersScreen({ route }: Props) {
  const { defaulters, depositStatus, defaultStats, loading } = useDefaultPrevention(
    route.params.groupId
  );
  const theme = useTheme();

  if (loading) {
    return (
      <Screen padded edges={['top']}>
        <ScreenHeader title="Defaulters" showBack />
        <View style={{ gap: theme.spacing.lg }}>
          <Skeleton height={96} radius="2xl" />
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} height={104} radius="xl" />
          ))}
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.screenPadding,
          paddingBottom: theme.spacing['5xl'],
          gap: theme.spacing.xl,
        }}
      >
        <ScreenHeader
          title="Defaulters"
          subtitle="Members who have missed contributions"
          showBack
        />

        {/* Deposit cover */}
        {depositStatus ? (
          <Card variant="outlined">
            <View style={{ gap: theme.spacing.md }}>
              <View style={styles.rowBetween}>
                <Text variant="h3">Security deposits</Text>
                <Badge
                  label={depositStatus.complete ? 'Complete' : 'Outstanding'}
                  tone={depositStatus.complete ? 'success' : 'warning'}
                  size="sm"
                  dot
                />
              </View>
              <Text variant="bodySmall" tone="secondary">
                {depositStatus.complete
                  ? 'Every member has paid their deposit, so missed contributions can be covered.'
                  : `${formatCurrency(depositStatus.required)} is still required to fully cover this group.`}
              </Text>
            </View>
          </Card>
        ) : null}

        {/* Personal record */}
        {defaultStats ? (
          <Card variant="filled">
            <View style={{ gap: theme.spacing.md }}>
              <Text variant="h4">Your record</Text>
              <View style={styles.statsRow}>
                <MiniStat label="Defaults" value={String(defaultStats.defaultCount)} />
                <MiniStat label="Groups" value={String(defaultStats.groupsDefaulted)} />
                <MiniStat label="Missed" value={String(defaultStats.totalMissed)} />
                <MiniStat label="Forfeited" value={String(defaultStats.depositsForfeited)} />
              </View>
              {defaultStats.creditReported ? (
                <>
                  <Divider />
                  <View style={[styles.row, { gap: theme.spacing.sm }]}>
                    <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
                    <Text variant="bodySmall" tone="error" style={{ flex: 1 }}>
                      Your defaults have been reported to the credit bureau.
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
          </Card>
        ) : null}

        {/* Defaulter list */}
        {defaulters.length === 0 ? (
          <EmptyState
            title="No defaulted members"
            message="Everyone in this group is keeping up with their contributions."
            illustration="none"
            icon="shield-checkmark"
          />
        ) : (
          <View style={{ gap: theme.spacing.md }}>
            <View style={styles.rowBetween}>
              <Text variant="h2">Defaulted</Text>
              <Badge label={String(defaulters.length)} tone="error" size="sm" />
            </View>

            {defaulters.map((defaulter, index) => {
              const name = `${defaulter.user.firstName} ${defaulter.user.lastName}`.trim();

              return (
                <Animated.View
                  key={defaulter.id}
                  entering={FadeInDown.delay(staggerDelay(index)).duration(320)}
                >
                  <Card
                    variant="outlined"
                    padding="md"
                    style={{
                      // A red spine marks the row as an exception without
                      // flooding the card in error colour.
                      borderLeftWidth: 4,
                      borderLeftColor: theme.colors.error,
                    }}
                  >
                    <View style={{ gap: theme.spacing.md }}>
                      <View style={[styles.row, { gap: theme.spacing.md }]}>
                        <Avatar name={name} size="md" />
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text variant="h4" numberOfLines={1}>
                            {name || 'Member'}
                          </Text>
                          <Text variant="mono" tone="tertiary">
                            {defaulter.user.phone ? formatPhone(defaulter.user.phone) : '—'}
                          </Text>
                        </View>
                        <Badge
                          label={`${defaulter.totalMissed} missed`}
                          tone="error"
                          size="sm"
                          icon="close-circle"
                        />
                      </View>

                      <Text variant="bodySmall" tone="secondary">
                        {defaulter.defaultReason || 'Post-payout default'}
                      </Text>
                    </View>
                  </Card>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text variant="h3" tabular>
        {value}
      </Text>
      <Text variant="captionSmall" tone="secondary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  miniStat: { alignItems: 'center', gap: 2, flex: 1 },
});
