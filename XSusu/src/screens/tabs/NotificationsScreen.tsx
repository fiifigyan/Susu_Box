import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService, type NotificationItem } from '../../services/notificationService';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { Screen, ScreenHeader, Card, EmptyState, Text } from '../../components/ui';

export function NotificationsScreen() {
  const theme = useTheme();
  const toast = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setNotifications(await notificationService.list());
    } catch (error) {
      toast.fromError(error, 'Could not load notifications.');
    } finally {
      setRefreshing(false);
    }
  }, [toast]);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications])
  );

  const markRead = async (notification: NotificationItem) => {
    if (notification.isRead) return;
    setNotifications(current => current.map(item => (
      item.id === notification.id ? { ...item, isRead: true } : item
    )));
    try {
      await notificationService.markRead(notification.id);
    } catch (error) {
      setNotifications(current => current.map(item => (
        item.id === notification.id ? { ...item, isRead: false } : item
      )));
      toast.fromError(error, 'Could not update notification.');
    }
  };

  return (
    <Screen>
      <View style={{ paddingHorizontal: theme.screenPadding }}>
        <ScreenHeader title="Notifications" />
      </View>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: theme.screenPadding, paddingBottom: theme.spacing['3xl'] },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadNotifications();
            }}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        renderItem={({ item }) => (
          <Card variant="outlined" padding="md">
            <View style={styles.row}>
              <Ionicons
                name={item.type === 'GROUP_INVITE' ? 'people-outline' : 'notifications-outline'}
                size={22}
                color={item.isRead ? theme.colors.textTertiary : theme.colors.primary}
              />
              <View style={styles.copy}>
                <Text variant="bodyMedium">{item.title}</Text>
                <Text variant="bodySmall" tone="secondary">{item.message}</Text>
                <Text variant="captionSmall" tone="tertiary">
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
              </View>
              {!item.isRead ? <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} /> : null}
            </View>
          </Card>
        )}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
        ListEmptyComponent={
          <EmptyState
            title="No notifications"
            message="Updates and group invitations will appear here."
            illustration="none"
            icon="notifications-outline"
          />
        }
        onViewableItemsChanged={({ viewableItems }) => {
          viewableItems.forEach(({ item }) => {
            if (item) void markRead(item as NotificationItem);
          });
        }}
        viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingTop: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  copy: { flex: 1, gap: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});
