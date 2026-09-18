import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { notificationService } from '../services/notificationService';
Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: true, shouldShowBanner: true, shouldShowList: true }) });
export function usePushNotifications(enabled: boolean): void {
  useEffect(() => { if (!enabled || Platform.OS === 'web' || !Device.isDevice) return; let active = true; const register = async () => { try { const current = await Notifications.getPermissionsAsync(); const permissions = current.granted ? current : await Notifications.requestPermissionsAsync(); if (!permissions.granted || !active) return; const projectId = Constants.expoConfig?.extra?.eas?.projectId; if (!projectId) throw new Error('Expo EAS project ID is not configured'); const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data; await notificationService.registerDeviceToken(token); if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('default', { name: 'default', importance: Notifications.AndroidImportance.DEFAULT }); } catch (error) { console.warn('Push notification registration failed', error); } }; void register(); return () => { active = false; }; }, [enabled]);
}
