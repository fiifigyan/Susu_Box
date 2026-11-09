import React, { useState, useCallback } from 'react';
import { RefreshControl, ScrollView, Share, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { RootStackParamList } from '../../types/navigation';
import { inviteService, PendingInvite } from '../../services/inviteService';
import { groupService, type Group } from '../../services/groupService';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { useHaptics } from '../../hooks/useHaptics';
import { staggerDelay } from '../../theme';
import {
  Screen,
  Text,
  Card,
  Input,
  Button,
  Badge,
  Chip,
  Avatar,
  Divider,
  Skeleton,
  EmptyState,
  ProgressBar,
  ScreenHeader,
  SegmentedControl,
  ConfirmSheet,
  IconButton,
  type Segment,
} from '../../components/ui';
import { formatCurrency, formatPhone } from '../../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'InviteMembers'>;
type Tab = 'INVITE' | 'PENDING';

export function InviteMembersScreen({ route }: Props) {
  const { groupId } = route.params;
  const theme = useTheme();
  const toast = useToast();
  const haptics = useHaptics();

  const [group, setGroup] = useState<Group | null>(null);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('INVITE');
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<PendingInvite | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [groupId])
  );

  const fetchData = async () => {
    try {
      const [groupResponse, invitesResponse, shareResponse] = await Promise.all([
        groupService.get(groupId),
        inviteService.getPendingInvites(groupId),
        inviteService.generateShareLink(groupId),
      ]);

      setGroup(groupResponse);
      setPendingInvites(invitesResponse);
      setShareUrl(shareResponse);
    } catch (error) {
      toast.fromError(error, 'Failed to load invite details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleInviteByPhone = async () => {
    if (!phone || !position) {
      toast.warning('Phone number and position are required');
      return;
    }

    setAdding(true);
    try {
      const result = await inviteService.inviteByPhone(
        groupId,
        phone,
        parseInt(position),
        name || undefined
      );

      if (result.status === 'ADDED') {
        toast.success('Member added directly!', { silent: true });
      } else {
        toast.success('Invite sent', {
          description: `Code ${result.inviteCode} sent via SMS`,
          silent: true,
        });
      }
      haptics.success();

      // Clear form
      setPhone('');
      setName('');
      setPosition('');
      fetchData();
    } catch (error) {
      toast.fromError(error, 'Failed to invite member');
    } finally {
      setAdding(false);
    }
  };

  const handleShareLink = async () => {
    if (!shareUrl) return;

    try {
      await Share.share({
        message: `🇬🇭 Join my Susu group!\n\nGroup: ${group?.name}\nDaily Pay: GHS ${group?.dailyContribution}\nPayout: GHS ${group?.dailyPayout}\nMembers: ${group?.memberCount}\n\nJoin here: ${shareUrl}\n\nDownload XSusu to join!`,
      });
    } catch (error) {
      toast.fromError(error, 'Could not open the share sheet.');
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    await Clipboard.setStringAsync(shareUrl);
    haptics.success();
    // Swaps the icon to a tick for a moment, instead of an alert.
    setCopied(true);
    toast.success('Invite link copied', { silent: true });
    setTimeout(() => setCopied(false), 1800);
  };

  const handleCancelInvite = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await inviteService.cancelInvite(cancelTarget.id);
      toast.success('Invite cancelled', { silent: true });
      fetchData();
    } catch (error) {
      toast.fromError(error, 'Could not cancel the invite.');
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    haptics.light();
    fetchData();
  };

  if (loading) {
    return (
      <Screen padded edges={['top']}>
        <ScreenHeader title="Invite members" showBack />
        <View style={{ gap: theme.spacing.lg }}>
          <Skeleton height={120} radius="2xl" />
          <Skeleton height={44} radius="lg" />
          <Skeleton height={220} radius="2xl" />
        </View>
      </Screen>
    );
  }

  const members = group?.members ?? [];
  const currentMemberCount = members.length;
  const takenPositions = members.map(member => member.position);
  const pendingPositions = pendingInvites.map(invite => invite.position);
  const unavailablePositions = [...takenPositions, ...pendingPositions];
  const availablePositions = Array.from(
    { length: group?.memberCount || 0 },
    (_, index) => index + 1
  ).filter((value: number) => !unavailablePositions.includes(value));

  const segments: Segment<Tab>[] = [
    { value: 'INVITE', label: 'Invite' },
    { value: 'PENDING', label: 'Pending', count: pendingInvites.length },
  ];

  return (
    <Screen edges={['top']}>
      <View style={{ paddingHorizontal: theme.screenPadding, gap: theme.spacing.lg }}>
        <ScreenHeader title="Invite members" showBack />

        {/* Progress */}
        <Card variant="gradient" gradient={theme.colors.gradientBalance}>
          <View style={{ gap: theme.spacing.md }}>
            <Text variant="h3" color={theme.colors.textInverse} numberOfLines={1}>
              {group?.name}
            </Text>
            <ProgressBar
              progress={currentMemberCount / (group?.memberCount || 1)}
              color={theme.colors.textInverse}
              trackColor={`${theme.colors.textInverse}33`}
              accessibilityLabel={`${currentMemberCount} of ${group?.memberCount} members joined`}
            />
            <Text variant="bodySmall" color={`${theme.colors.textInverse}B3`}>
              {currentMemberCount}/{group?.memberCount} members joined ·{' '}
              {availablePositions.length} position
              {availablePositions.length === 1 ? '' : 's'} open
            </Text>
          </View>
        </Card>

        <SegmentedControl segments={segments} value={activeTab} onChange={setActiveTab} />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.screenPadding,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing['5xl'],
          gap: theme.spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={24}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {activeTab === 'INVITE' ? (
          <Animated.View entering={FadeIn.duration(220)} style={{ gap: theme.spacing.xl }}>
            {/* Share link */}
            <Card variant="outlined">
              <View style={{ gap: theme.spacing.md }}>
                <View style={styles.sectionHeader}>
                  <Text variant="h3">Share a link</Text>
                  <IconButton
                    icon={showQR ? 'list' : 'qr-code'}
                    onPress={() => setShowQR(current => !current)}
                    accessibilityLabel={showQR ? 'Hide QR code' : 'Show QR code'}
                    size="sm"
                    variant="tinted"
                  />
                </View>

                <Text variant="bodySmall" tone="secondary">
                  Anyone with this link can view the group and request to join.
                </Text>

                {showQR && shareUrl ? (
                  <Animated.View
                    entering={FadeIn.duration(240)}
                    style={[
                      styles.qrWrapper,
                      {
                        backgroundColor: '#FFFFFF',
                        borderRadius: theme.radius.lg,
                        padding: theme.spacing.lg,
                      },
                    ]}
                    accessible
                    accessibilityRole="image"
                    accessibilityLabel="QR code for the group invite link"
                  >
                    {/* Always rendered on white: QR scanners need the contrast. */}
                    <QRCode value={shareUrl} size={180} backgroundColor="#FFFFFF" />
                  </Animated.View>
                ) : (
                  <View
                    style={[
                      styles.urlBox,
                      {
                        backgroundColor: theme.colors.surfaceSunken,
                        borderRadius: theme.radius.md,
                        padding: theme.spacing.md,
                      },
                    ]}
                  >
                    <Text variant="mono" tone="brand" numberOfLines={1}>
                      {shareUrl || 'Generating…'}
                    </Text>
                  </View>
                )}

                <View style={[styles.buttonRow, { gap: theme.spacing.md }]}>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Share"
                      onPress={() => void handleShareLink()}
                      icon="share-social"
                      fullWidth
                      disabled={!shareUrl}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      label={copied ? 'Copied' : 'Copy'}
                      onPress={() => void handleCopyLink()}
                      variant="secondary"
                      icon={copied ? 'checkmark' : 'copy'}
                      fullWidth
                      disabled={!shareUrl}
                    />
                  </View>
                </View>
              </View>
            </Card>

            <Divider label="or" />

            {/* Invite by phone */}
            <Card variant="outlined">
              <View style={{ gap: theme.spacing.lg }}>
                <Text variant="h3">Add by phone number</Text>

                <Input
                  label="Full name"
                  value={name}
                  onChangeText={setName}
                  icon="person-outline"
                  helper="Optional"
                />

                <Input
                  label="Phone number"
                  value={phone}
                  onChangeText={setPhone}
                  icon="call-outline"
                  keyboardType="phone-pad"
                  maxLength={10}
                />

                <Input
                  label={`Position (1-${group?.memberCount ?? 0})`}
                  value={position}
                  onChangeText={setPosition}
                  icon="list-outline"
                  keyboardType="numeric"
                />

                {availablePositions.length > 0 ? (
                  <View style={{ gap: theme.spacing.sm }}>
                    <Text variant="captionSmall" tone="secondary">
                      Available positions
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: theme.spacing.sm }}
                    >
                      {availablePositions.slice(0, 12).map(value => (
                        <Chip
                          key={value}
                          label={`#${value}`}
                          selected={position === String(value)}
                          onPress={() => setPosition(String(value))}
                          accessibilityLabel={`Choose position ${value}`}
                        />
                      ))}
                      {availablePositions.length > 12 ? (
                        <Chip label="…" tone="neutral" />
                      ) : null}
                    </ScrollView>
                  </View>
                ) : (
                  <Text variant="bodySmall" tone="warning">
                    Every position is taken or pending.
                  </Text>
                )}

                <Button
                  label="Invite member"
                  onPress={() => void handleInviteByPhone()}
                  loading={adding}
                  disabled={adding || !phone || !position}
                  icon="person-add"
                  fullWidth
                />
              </View>
            </Card>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(220)} style={{ gap: theme.spacing.md }}>
            {pendingInvites.length === 0 ? (
              <EmptyState
                title="No pending invites"
                message="Invites you send by phone will appear here until they're accepted."
                illustration="none"
                icon="mail-outline"
              />
            ) : (
              pendingInvites.map((invite, index) => (
                <Animated.View
                  key={invite.id}
                  entering={FadeInDown.delay(staggerDelay(index)).duration(320)}
                >
                  <Card variant="outlined" padding="md">
                    <View style={{ gap: theme.spacing.md }}>
                      <View style={[styles.pendingRow, { gap: theme.spacing.md }]}>
                        <Avatar name={invite.name || invite.phone} size="md" />
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text variant="h4" numberOfLines={1}>
                            {invite.name || formatPhone(invite.phone)}
                          </Text>
                          <Text variant="mono" tone="tertiary">
                            {formatPhone(invite.phone)}
                          </Text>
                        </View>
                        <IconButton
                          icon="close-circle"
                          onPress={() => setCancelTarget(invite)}
                          accessibilityLabel={`Cancel invite for ${invite.name || invite.phone}`}
                          size="sm"
                          color={theme.colors.error}
                        />
                      </View>

                      <Divider />

                      <View style={[styles.pendingRow, { gap: theme.spacing.sm }]}>
                        <Badge label={`#${invite.position}`} tone="brand" size="sm" />
                        <Badge label={invite.inviteCode} tone="neutral" size="sm" icon="key" />
                        <View style={{ flex: 1 }} />
                        <Text variant="captionSmall" tone="tertiary">
                          Expires {new Date(invite.expiresAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </Animated.View>
              ))
            )}
          </Animated.View>
        )}

        {/* Current members */}
        <View style={{ gap: theme.spacing.md }}>
          <View style={styles.sectionHeader}>
            <Text variant="h2">Current members</Text>
            <Badge label={String(currentMemberCount)} tone="neutral" size="sm" />
          </View>

          {members.map(member => {
            const memberName = [member.user?.firstName, member.user?.lastName]
              .filter(Boolean)
              .join(' ');

            return (
              <Card key={member.id} variant="filled" padding="md">
                <View style={[styles.pendingRow, { gap: theme.spacing.md }]}>
                  <Avatar name={memberName} size="sm" />
                  <Text variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>
                    {memberName || 'Member'}
                  </Text>
                  {member.position === 1 ? (
                    <Badge label="Admin" tone="warning" size="sm" icon="star" />
                  ) : null}
                  <Badge label={`#${member.position}`} tone="neutral" size="sm" />
                </View>
              </Card>
            );
          })}
        </View>
      </KeyboardAwareScrollView>

      <ConfirmSheet
        visible={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => void handleCancelInvite()}
        title="Cancel this invite?"
        message={`${
          cancelTarget?.name || (cancelTarget ? formatPhone(cancelTarget.phone) : 'This person')
        } will no longer be able to join with code ${cancelTarget?.inviteCode ?? ''}.`}
        confirmLabel="Cancel invite"
        cancelLabel="Keep it"
        destructive
        loading={cancelling}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  urlBox: { width: '100%' },
  qrWrapper: { alignItems: 'center', alignSelf: 'center' },
  buttonRow: { flexDirection: 'row' },
  pendingRow: { flexDirection: 'row', alignItems: 'center' },
});
