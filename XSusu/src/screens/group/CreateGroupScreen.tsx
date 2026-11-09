import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, {
  FadeIn,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import { groupService } from '../../services/groupService';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { useHaptics } from '../../hooks/useHaptics';
import {
  Screen,
  Text,
  Card,
  Input,
  Button,
  Badge,
  Divider,
  ProgressBar,
  ScreenHeader,
  Confetti,
} from '../../components/ui';
import { SuccessCheck } from '../../components/illustrations';
import { formatCurrency } from '../../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateGroup'>;

const TOTAL_STEPS = 3;

const STEP_TITLES = ['Basic info', 'Money setup', 'Review'] as const;

export function CreateGroupScreen({ navigation }: Props) {
  const theme = useTheme();
  const toast = useToast();
  const haptics = useHaptics();

  const [step, setStep] = useState(1);
  /** 1 when moving forward, -1 when going back. Drives the slide direction. */
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | undefined>(undefined);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    memberCount: '35',
    dailyContribution: '21',
    dailyPayout: '700',
    surplusUse: 'App maintenance: GHS 10, Emergency fund: GHS 25',
    verificationMethod: 'MANUAL' as 'MANUAL' | 'AUTO_VERIFY',
    appFeePerMember: '2',
  });

  const dailyTotal =
    parseFloat(formData.dailyContribution || '0') * parseInt(formData.memberCount || '0');
  const dailySurplus = dailyTotal - parseFloat(formData.dailyPayout || '0');
  const monthlyRevenue =
    parseFloat(formData.appFeePerMember || '0') * parseInt(formData.memberCount || '0');

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      setNameError('Please enter a group name');
      setDirection(-1);
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      const group = await groupService.create({
        name: formData.name,
        description: formData.description,
        memberCount: parseInt(formData.memberCount),
        dailyContribution: parseFloat(formData.dailyContribution),
        dailyPayout: parseFloat(formData.dailyPayout),
        surplusUse: formData.surplusUse,
        verificationMethod: formData.verificationMethod,
        appFeePerMember: parseFloat(formData.appFeePerMember),
      });

      // Replaces the old multi-button Alert with a success screen that offers
      // the same two choices.
      setCreatedGroupId(group.id);
      haptics.celebrate();
    } catch (error) {
      toast.fromError(error, 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'name' && nameError) setNameError(undefined);
  };

  const goNext = () => {
    if (step === 1 && !formData.name.trim()) {
      setNameError('Please enter a group name');
      return;
    }
    setDirection(1);
    setStep(current => current + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep(current => current - 1);
  };

  if (createdGroupId) {
    return (
      <Screen background="gradient" edges={['top', 'bottom']} padded>
        <Confetti active />
        <View style={[styles.celebration, { gap: theme.spacing.xl }]}>
          <SuccessCheck size={132} />
          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="h1" align="center">
              Group created
            </Text>
            <Text variant="body" tone="secondary" align="center">
              {formData.name} is ready. Invite members to fill the {formData.memberCount}{' '}
              positions.
            </Text>
          </View>

          <View style={{ alignSelf: 'stretch', gap: theme.spacing.md }}>
            <Button
              label="Invite members"
              onPress={() =>
                navigation.navigate('InviteMembers', { groupId: createdGroupId })
              }
              icon="person-add"
              size="lg"
              fullWidth
            />
            <Button
              label="Done"
              onPress={() => navigation.goBack()}
              variant="ghost"
              fullWidth
            />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ paddingHorizontal: theme.screenPadding, gap: theme.spacing.md }}>
        <ScreenHeader title="Create a group" showBack />

        {/* Progress */}
        <View style={{ gap: theme.spacing.sm }}>
          <ProgressBar
            progress={step / TOTAL_STEPS}
            accessibilityLabel={`Step ${step} of ${TOTAL_STEPS}`}
          />
          <View style={styles.stepRow}>
            <Text variant="caption" tone="secondary">
              Step {step} of {TOTAL_STEPS}
            </Text>
            <Text variant="caption" tone="brand">
              {STEP_TITLES[step - 1]}
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.screenPadding,
          paddingTop: theme.spacing.xl,
          paddingBottom: theme.spacing['3xl'],
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={24}
      >
        <Animated.View
          // Keyed on step so each pane mounts fresh and animates in.
          key={step}
          entering={direction > 0 ? SlideInRight.duration(260) : SlideInLeft.duration(260)}
          exiting={direction > 0 ? SlideOutLeft.duration(200) : SlideOutRight.duration(200)}
          style={{ gap: theme.spacing.lg }}
        >
          {step === 1 ? (
            <>
              <Input
                label="Group name"
                value={formData.name}
                onChangeText={value => updateField('name', value)}
                error={nameError}
                icon="people-outline"
                helper="e.g. Family Susu 2026"
              />
              <Input
                label="Description"
                value={formData.description}
                onChangeText={value => updateField('description', value)}
                icon="document-text-outline"
                helper="Optional — what is this group for?"
              />
              <Input
                label="Number of members"
                value={formData.memberCount}
                onChangeText={value => updateField('memberCount', value)}
                icon="person-add-outline"
                keyboardType="numeric"
                helper="Each member gets one payout day"
              />

              <GroupPreview
                name={formData.name}
                memberCount={formData.memberCount}
                dailyContribution={formData.dailyContribution}
                dailyPayout={formData.dailyPayout}
              />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Input
                label="Daily contribution (GHS)"
                value={formData.dailyContribution}
                onChangeText={value => updateField('dailyContribution', value)}
                icon="cash-outline"
                keyboardType="numeric"
              />
              <Input
                label="Daily payout (GHS)"
                value={formData.dailyPayout}
                onChangeText={value => updateField('dailyPayout', value)}
                icon="gift-outline"
                keyboardType="numeric"
              />

              {/* Live surplus calculator */}
              <Card variant="filled">
                <View style={{ gap: theme.spacing.sm }}>
                  <Text variant="h4">Daily breakdown</Text>
                  <CalcRow label="Total collected" value={formatCurrency(dailyTotal)} />
                  <CalcRow
                    label="Payout"
                    value={`− ${formatCurrency(parseFloat(formData.dailyPayout || '0'))}`}
                  />
                  <Divider spacing="sm" />
                  <View style={styles.stepRow}>
                    <Text variant="bodyMedium">Daily surplus</Text>
                    <Text
                      variant="h3"
                      tone={dailySurplus < 0 ? 'error' : 'success'}
                      tabular
                    >
                      {formatCurrency(dailySurplus)}
                    </Text>
                  </View>
                  {dailySurplus < 0 ? (
                    <Text variant="bodySmall" tone="error">
                      The payout exceeds what the group collects each day. Lower the payout or
                      raise the contribution.
                    </Text>
                  ) : null}
                </View>
              </Card>

              <Input
                label="Surplus usage"
                value={formData.surplusUse}
                onChangeText={value => updateField('surplusUse', value)}
                icon="pie-chart-outline"
              />

              {/* Verification method */}
              <View style={{ gap: theme.spacing.sm }}>
                <Text variant="caption" tone="secondary">
                  Verification method
                </Text>
                {(
                  [
                    {
                      value: 'MANUAL' as const,
                      label: 'Manual check-in',
                      hint: 'An admin marks each contribution as paid',
                    },
                    {
                      value: 'AUTO_VERIFY' as const,
                      label: 'Auto-verify',
                      hint: 'Confirm contributions against mobile money',
                    },
                  ]
                ).map(option => {
                  const selected = formData.verificationMethod === option.value;
                  return (
                    <Card
                      key={option.value}
                      variant="outlined"
                      padding="md"
                      onPress={() => updateField('verificationMethod', option.value)}
                      accessibilityLabel={`${option.label}. ${option.hint}`}
                      style={
                        selected
                          ? { borderColor: theme.colors.primary, borderWidth: 2 }
                          : undefined
                      }
                    >
                      <View style={[styles.optionRow, { gap: theme.spacing.md }]}>
                        <Ionicons
                          name={selected ? 'radio-button-on' : 'radio-button-off'}
                          size={22}
                          color={selected ? theme.colors.primary : theme.colors.textTertiary}
                        />
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text variant="h4">{option.label}</Text>
                          <Text variant="bodySmall" tone="secondary">
                            {option.hint}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  );
                })}
              </View>

              <Input
                label="Monthly app fee per member (GHS)"
                value={formData.appFeePerMember}
                onChangeText={value => updateField('appFeePerMember', value)}
                icon="wallet-outline"
                keyboardType="numeric"
                helper={`Monthly revenue: ${formatCurrency(monthlyRevenue)} (${
                  formData.memberCount
                } members × ${formatCurrency(parseFloat(formData.appFeePerMember || '0'))})`}
              />
            </>
          ) : null}

          {step === 3 ? (
            <>
              <GroupPreview
                name={formData.name}
                memberCount={formData.memberCount}
                dailyContribution={formData.dailyContribution}
                dailyPayout={formData.dailyPayout}
              />

              <Card variant="outlined">
                <View style={{ gap: theme.spacing.xs }}>
                  <Text variant="h3" style={{ marginBottom: theme.spacing.sm }}>
                    Review &amp; confirm
                  </Text>

                  {(
                    [
                      ['Group name', formData.name || '—'],
                      ['Members', formData.memberCount],
                      [
                        'Daily contribution',
                        formatCurrency(parseFloat(formData.dailyContribution || '0')),
                      ],
                      ['Daily payout', formatCurrency(parseFloat(formData.dailyPayout || '0'))],
                      ['Daily surplus', formatCurrency(dailySurplus)],
                      [
                        'Verification',
                        formData.verificationMethod === 'AUTO_VERIFY'
                          ? 'Auto-verify'
                          : 'Manual',
                      ],
                      ['Monthly revenue', formatCurrency(monthlyRevenue)],
                    ] as Array<[string, string]>
                  ).map(([label, value]) => (
                    <View key={label} style={[styles.summaryRow, { paddingVertical: theme.spacing.sm }]}>
                      <Text variant="bodySmall" tone="secondary">
                        {label}
                      </Text>
                      <Text variant="bodyMedium">{value}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            </>
          ) : null}
        </Animated.View>
      </KeyboardAwareScrollView>

      {/* Footer navigation */}
      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.md,
            paddingBottom: theme.spacing.lg,
            gap: theme.spacing.md,
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        {step > 1 ? (
          <View style={styles.backButton}>
            <Button label="Back" onPress={goBack} variant="outline" fullWidth />
          </View>
        ) : null}

        <View style={styles.primaryButton}>
          {step < TOTAL_STEPS ? (
            <Button
              label="Next"
              onPress={goNext}
              icon="arrow-forward"
              iconPosition="right"
              fullWidth
            />
          ) : (
            <Button
              label="Create group"
              onPress={() => void handleCreate()}
              loading={loading}
              icon="checkmark"
              fullWidth
              accessibilityHint="Creates the group with these settings"
            />
          )}
        </View>
      </View>
    </Screen>
  );
}

/** Live preview of how the group will appear once created. */
function GroupPreview({
  name,
  memberCount,
  dailyContribution,
  dailyPayout,
}: {
  name: string;
  memberCount: string;
  dailyContribution: string;
  dailyPayout: string;
}) {
  const theme = useTheme();

  return (
    <Animated.View entering={FadeIn.duration(280)}>
      <Card variant="gradient" gradient={theme.colors.gradientBalance}>
        <View style={{ gap: theme.spacing.md }}>
          <Text variant="overline" color={`${theme.colors.textInverse}B3`}>
            Preview
          </Text>
          <Text variant="h2" color={theme.colors.textInverse} numberOfLines={1}>
            {name || 'Your group name'}
          </Text>
          <View style={[styles.previewRow, { gap: theme.spacing.sm }]}>
            <Badge label={`${memberCount || '0'} members`} tone="neutral" size="sm" solid />
            <Badge
              label={`${formatCurrency(parseFloat(dailyContribution || '0'))}/day`}
              tone="neutral"
              size="sm"
              solid
            />
            <Badge
              label={formatCurrency(parseFloat(dailyPayout || '0'))}
              tone="success"
              size="sm"
              solid
            />
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}

function CalcRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stepRow}>
      <Text variant="bodySmall" tone="secondary">
        {label}
      </Text>
      <Text variant="bodyMedium" tabular>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionRow: { flexDirection: 'row', alignItems: 'center' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  previewRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  footer: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
  backButton: { flex: 1 },
  primaryButton: { flex: 2 },
  celebration: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
