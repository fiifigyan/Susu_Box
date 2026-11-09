import React, { useState, useCallback } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { groupService, type Group } from '../../services/groupService';
import { inviteService, type PendingInvite } from '../../services/inviteService';
import type { RootStackParamList } from '../../types/navigation';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { useHaptics } from '../../hooks/useHaptics';
import { glow, pressScale, springs } from '../../theme';
import {
  Screen,
  IconButton,
  ScreenHeader,
  SegmentedControl,
  SkeletonList,
  EmptyState,
  ErrorState,
  Card,
  Button,
  Text,
  type Segment,
} from '../../components/ui';
import { GroupCard } from '../../components/susu';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Filter = 'ALL' | 'ACTIVE' | 'COMPLETED';

interface GroupListItem extends Group {
  myPosition?: number;
}

export function GroupsScreen() {
  const theme = useTheme();
  const toast = useToast();
  const haptics = useHaptics();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();

  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [])
  );

  const fetchGroups = async () => {
    try {
      const [groupList, invites] = await Promise.all([
        groupService.list(),
        inviteService.getMyInvites(),
      ]);
      setGroups(groupList);
      setPendingInvites(invites);
      setError(null);
    } catch (err) {
      setError('Could not load your groups.');
      toast.fromError(err, 'Could not load your groups.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    haptics.light();
    fetchGroups();
  };

  const filteredGroups = groups.filter(group => {
    if (filter === 'ALL') return true;
    return group.status === filter;
  });

  const activeCount = groups.filter(group => group.status === 'ACTIVE').length;
  const completedCount = groups.filter(group => group.status === 'COMPLETED').length;

  const segments: Segment<Filter>[] = [
    { value: 'ALL', label: 'All', count: groups.length },
    { value: 'ACTIVE', label: 'Active', count: activeCount },
    { value: 'COMPLETED', label: 'Done', count: completedCount },
  ];

  return (
    <Screen>
      <View style={{ paddingHorizontal: theme.screenPadding, gap: theme.spacing.lg }}>
        <ScreenHeader
          title="My groups"
          action={
            <IconButton
              icon="enter-outline"
              onPress={() => navigation.navigate('JoinGroup')}
              accessibilityLabel="Join a group"
              accessibilityHint="Opens the invite code form"
              variant="tinted"
              size="sm"
            />
          }
        />
        <SegmentedControl segments={segments} value={filter} onChange={setFilter} />
      </View>

      {pendingInvites.length > 0 ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.lg, gap: theme.spacing.md }}>
          <Text variant="h3">Pending invitations</Text>
          {pendingInvites.map(invite => (
            <Card key={invite.id} variant="outlined" padding="md">
              <View style={{ gap: theme.spacing.sm }}>
                <Text variant="bodyMedium">
                  Join {invite.group?.name || 'a Susu group'} as member #{invite.position}
                </Text>
                <Text variant="mono" tone="tertiary">
                  Code: {invite.inviteCode}
                </Text>
                <Button
                  label="Accept invitation"
                  onPress={() => navigation.navigate('JoinGroup', { code: invite.inviteCode })}
                  size="sm"
                  fullWidth
                />
              </View>
            </Card>
          ))}
        </View>
      ) : null}

      {loading ? (
        <View style={{ padding: theme.screenPadding }}>
          <SkeletonList count={3} />
        </View>
      ) : error && groups.length === 0 ? (
        <ErrorState message={error} onRetry={onRefresh} />
      ) : (
        <FlashList
          data={filteredGroups}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <GroupCard
              group={item}
              index={index}
              onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.lg,
            // Clears the FAB and the tab bar.
            paddingBottom: insets.bottom + 120,
          }}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.lg }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title={filter === 'ALL' ? 'No groups yet' : `No ${filter.toLowerCase()} groups`}
              message={
                filter === 'ALL'
                  ? 'Create a Susu group and invite people you trust to start saving together.'
                  : 'Try a different filter, or create a new group.'
              }
              actionLabel="Create a group"
              onAction={() => navigation.navigate('CreateGroup')}
              secondaryActionLabel="Join with a code"
              onSecondaryAction={() => navigation.navigate('JoinGroup')}
            />
          }
        />
      )}

      <CreateFab onPress={() => navigation.navigate('CreateGroup')} />
    </Screen>
  );
}

/** Gradient floating action button that spins its icon on press. */
function CreateFab({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  const haptics = useHaptics();
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 90}deg` }],
  }));

  return (
    <Pressable
      onPress={() => {
        haptics.medium();
        // A quarter turn out and back reads as "opening" without needing a menu.
        rotation.value = withSpring(1, springs.snappy, () => {
          rotation.value = withSpring(0, springs.snappy);
        });
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(pressScale, springs.snappy);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, springs.snappy);
      }}
      style={[styles.fabWrapper, { bottom: insets.bottom + 24 }]}
      accessibilityRole="button"
      accessibilityLabel="Create a group"
      accessibilityHint="Opens the group creation form"
    >
      <Animated.View
        style={[
          styles.fab,
          { borderRadius: theme.radius.full },
          theme.isDark ? theme.shadows.lg : glow(theme.colors.primary, 'lg'),
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={theme.colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={iconStyle}>
          <Ionicons name="add" size={30} color={theme.colors.onPrimary} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fabWrapper: { position: 'absolute', right: 20 },
  fab: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
