import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useFonts } from 'expo-font';
import * as ScreenCapture from 'expo-screen-capture';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { SecurityProvider } from './src/contexts/SecurityContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { useTheme } from './src/hooks/useTheme';
import { AppToast } from './src/components/ui';
import { fontAssets } from './src/theme';

function NotificationRegistration() {
  const { isAuthenticated } = useAuth();
  usePushNotifications(isAuthenticated);
  return null;
}

/**
 * Everything that needs the theme.
 *
 * Split out because `useTheme` can only be called below `ThemeProvider`, and
 * both the navigator and the toast host need themed colours.
 */
function ThemedApp() {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SecurityProvider>
        <AuthProvider>
          <NotificationRegistration />
          <AppNavigator />
        </AuthProvider>
      </SecurityProvider>

      {/* Rendered last so toasts layer above navigation and bottom sheets. */}
      <AppToast />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts(fontAssets);

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

  // Holding the splash until fonts resolve avoids a visible reflow when text
  // swaps from the system font to Inter.
  if (!fontsLoaded) {
    return null;
  }

  return (
    // GestureHandlerRootView must be the outermost view for swipe actions and
    // bottom sheet gestures to receive touches.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <ThemeProvider>
            <BottomSheetModalProvider>
              <ThemedApp />
            </BottomSheetModalProvider>
          </ThemeProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
