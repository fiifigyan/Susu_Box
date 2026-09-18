import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SecurityProvider } from './src/contexts/SecurityContext';
import * as ScreenCapture from 'expo-screen-capture';
import { Platform } from 'react-native';
import { useAuth } from './src/contexts/AuthContext';
import { usePushNotifications } from './src/hooks/usePushNotifications';

function NotificationRegistration() {
  const { isAuthenticated } = useAuth();
  usePushNotifications(isAuthenticated);
  return null;
}

export default function App() {
  useEffect(() => {
    // Prevent screen capture for security
    if (Platform.OS !== 'web') {
      ScreenCapture.preventScreenCaptureAsync().catch(() => {
        // Some devices don't support this
      });
    }

    return () => {
      if (Platform.OS !== 'web') {
        ScreenCapture.allowScreenCaptureAsync();
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <SecurityProvider>
        <AuthProvider>
          <NotificationRegistration />
          <StatusBar style="auto" />
          <AppNavigator />
        </AuthProvider>
      </SecurityProvider>
    </SafeAreaProvider>
  );
}