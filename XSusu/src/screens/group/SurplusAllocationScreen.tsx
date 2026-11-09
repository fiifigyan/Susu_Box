import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { groupService, type Group } from '../../services/groupService';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { Screen, ScreenHeader, Text, Card, Badge, Divider, Skeleton, ErrorState } from '../../components/ui';
import { formatCurrency } from '../../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'SurplusAllocation'>;

type Allocation = { label: string; amount?: number; description?: string };

function parseAllocations(value?: string | null): Allocation[] {
  if (!value?.trim()) return [];

  return value
    .split(/[,\n]/)
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      const match = item.match(/^(.+?):\s*(?:GHS\s*)?([\d,.]+)$/i);
      if (!match) return { label: item };
      return {
        label: match[1].trim(),
        amount: Number(match[2].replace(/,/g, '')),
      };
    });
}

export function SurplusAllocationScreen({ route, navigation }: Props) {
  const { groupId } = route.params;
  const theme = useTheme();
  const toast = useToast();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      groupService.get(groupId)
        .then(value => {
          if (active) setGroup(value);
        })
        .catch(error => toast.fromError(error, 'Could not load surplus details.'))
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [groupId, toast])
  );

  const allocations = useMemo(() => parseAllocations(group?.surplusUse), [group?.surplusUse]);

  if (loading) {
    return (
      <Screen padded edges={['top']}>
        <ScreenHeader title="Surplus allocation" showBack />
        <View style={{ gap: theme.spacing.lg }}>
          <Skeleton height={160} radius="2xl" />
          <Skeleton height={220} radius="xl" />
        </View>
      </Screen>
    );
  }

  if (!group) {
    return (
      <Screen padded edges={['top']}>
        <ScreenHeader title="Surplus allocation" showBack />
        <ErrorState title="Details unavailable" message="This group could not be loaded." onRetry={() => navigation.goBack()} retryLabel="Go back" />
      </Screen>
    );
  }

  const totalCollected = group.dailyContribution * group.memberCount;
  const dailySurplus = group.dailySurplus ?? totalCollected - group.dailyPayout;
  const holdback = group.holdBackPercentage ?? 0;
  const forming = group.status === 'FORMING';

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: theme.screenPadding, paddingBottom: theme.spacing['5xl'], gap: theme.spacing.lg }}
      >
        <ScreenHeader title="Surplus allocation" subtitle={group.name} showBack />

        <Card variant="elevated" padding="lg">
          <View style={{ gap: theme.spacing.md }}>
            <View style={styles.titleRow}>
              <View style={[styles.icon, { backgroundColor: `${theme.colors.success}1F` }]}>
                <Ionicons name="pie-chart" size={22} color={theme.colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="h3">Where the money goes</Text>
                <Text variant="bodySmall" tone="secondary">A transparent view of each contribution day.</Text>
              </View>
            </View>
            <Divider />
            <MoneyRow label="Collected from members" value={formatCurrency(totalCollected)} />
            <MoneyRow label="Daily payout" value={`− ${formatCurrency(group.dailyPayout)}`} />
            <Divider spacing="sm" />
            <MoneyRow label="Daily surplus" value={formatCurrency(dailySurplus)} emphasis />
          </View>
        </Card>

        <Card variant="outlined" padding="lg">
          <View style={{ gap: theme.spacing.md }}>
            <View style={styles.sectionHeader}>
              <Text variant="h3">Planned use</Text>
              <Badge label={forming ? 'Editable now' : 'Locked'} tone={forming ? 'warning' : 'success'} size="sm" />
            </View>
            {allocations.length > 0 ? allocations.map((allocation, index) => (
              <View key={`${allocation.label}-${index}`} style={styles.allocationRow}>
                <View style={[styles.bullet, { backgroundColor: theme.colors.primary }]} />
                <Text variant="bodyMedium" style={{ flex: 1 }}>{allocation.label}</Text>
                {allocation.amount !== undefined ? <Text variant="bodyMedium" tabular>{formatCurrency(allocation.amount)}</Text> : null}
              </View>
            )) : (
              <Text variant="bodySmall" tone="secondary">
                The group admin has not described how the surplus will be used yet.
              </Text>
            )}
          </View>
        </Card>

        <Card variant="filled" padding="lg">
          <View style={{ gap: theme.spacing.md }}>
            <Text variant="h3">Other protections</Text>
            <MoneyRow
              label="Hold-back reserve"
              value={holdback > 0 ? `${holdback}% for ${group.holdBackDays ?? 0} days` : 'Not configured'}
            />
            <MoneyRow
              label="Security deposit"
              value={group.securityDepositPercent && group.securityDepositPercent > 0
                ? `${group.securityDepositPercent}%`
                : group.securityDepositRequired && group.securityDepositRequired > 0
                  ? formatCurrency(group.securityDepositRequired)
                  : 'Not configured'}
            />
            {group.appFeePerMember && group.appFeePerMember > 0 ? (
              <MoneyRow label="Monthly app fee per member" value={formatCurrency(group.appFeePerMember)} />
            ) : null}
          </View>
        </Card>

        <Text variant="bodySmall" tone="tertiary">
          {forming
            ? 'The group is still forming. The admin can update these rules before the group starts.'
            : 'The group has started. These allocation rules should remain unchanged for the rest of the rotation.'}
        </Text>
      </ScrollView>
    </Screen>
  );
}

function MoneyRow({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.moneyRow}>
      <Text variant={emphasis ? 'bodyMedium' : 'bodySmall'} tone={emphasis ? undefined : 'secondary'}>{label}</Text>
      <Text variant={emphasis ? 'h3' : 'bodyMedium'} color={emphasis ? theme.colors.success : undefined} tabular>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  allocationRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bullet: { width: 8, height: 8, borderRadius: 4 },
  moneyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
});
