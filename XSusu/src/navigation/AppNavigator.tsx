import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, type Theme as NavTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { useHaptics } from '../hooks/useHaptics';
import { AppLogo } from '../components/illustrations';
import { Text } from '../components/ui';
import { fontFamily } from '../theme';
import { notificationService } from '../services/notificationService';

// Screens
import { SignInScreen } from '../screens/auth/SignInScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { VerifyOTPScreen } from '../screens/auth/VerifyOTPScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { HomeScreen } from '../screens/tabs/HomeScreen';
import { TodayScreen } from '../screens/tabs/TodayScreen';
import { GroupsScreen } from '../screens/tabs/GroupsScreen';
import { ScheduleScreen } from '../screens/tabs/ScheduleScreen';
import { ProfileScreen } from '../screens/tabs/ProfileScreen';
import { NotificationsScreen } from '../screens/tabs/NotificationsScreen';
import { CreateGroupScreen } from '../screens/group/CreateGroupScreen';
import { GroupDetailScreen } from '../screens/group/GroupDetailScreen';
import { InviteMembersScreen } from '../screens/group/InviteMembersSreen';
import { JoinGroupScreen } from '../screens/group/joinGroupScreen';
import { DefaultersScreen } from '../screens/group/DefaultersScreen';
import { MakePaymentScreen } from '../screens/payment/MakePaymentScreen';
import { SetupAutoChargeScreen } from '../screens/payment/SetupAutoChargeScreen';
import { SecurityDepositScreen } from '../screens/payment/SecurityDepositScreen';
import { SurplusAllocationScreen } from '../screens/group/SurplusAllocationScreen';

import {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
} from '../types/navigation';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const linking = {
  prefixes: ['xsusu://', 'https://xsusu.com'],
  config: {
    screens: {
      JoinGroup: 'join/:code',
    },
  },
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        // Every auth screen renders its own ScreenHeader, so the native header
        // is off throughout.
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

const TAB_ICONS: Record<
  keyof MainTabParamList,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Today: { active: 'today', inactive: 'today-outline' },
  Groups: { active: 'people', inactive: 'people-outline' },
  Schedule: { active: 'calendar', inactive: 'calendar-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
  Notifications: { active: 'notifications', inactive: 'notifications-outline' },
};

function MainTabs() {
  const theme = useTheme();
  const haptics = useHaptics();
  const insets = useSafeAreaInsets();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    const refreshUnreadCount = async () => {
      try {
        const items = await notificationService.list();
        if (active) setUnreadCount(items.filter(item => !item.isRead).length);
      } catch {
        // Notification availability should not block the main navigation.
      }
    };

    void refreshUnreadCount();
    const interval = setInterval(() => void refreshUnreadCount(), 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const tabBarHeight = 58 + insets.bottom;

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        // Screens own their headers so titles can use the typography scale and
        // sit on gradients.
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          return (
            <Ionicons name={focused ? icons.active : icons.inactive} size={size} color={color} />
          );
        },
        tabBarBadge: route.name === 'Notifications' && unreadCount > 0
          ? (unreadCount > 99 ? '99+' : unreadCount)
          : undefined,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          position: 'absolute',
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.border,
          // Transparent on iOS so the blur behind it shows through.
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : theme.colors.surface,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={80}
              tint={theme.isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: fontFamily.medium,
          fontSize: 11,
        },
        tabBarItemStyle: { paddingVertical: 2 },
      })}
      screenListeners={{
        tabPress: () => {
          haptics.selection();
        },
      }}
    >
      <MainTab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <MainTab.Screen name="Today" component={TodayScreen} options={{ title: 'Today' }} />
      <MainTab.Screen name="Groups" component={GroupsScreen} options={{ title: 'Groups' }} />
      <MainTab.Screen name="Schedule" component={ScheduleScreen} options={{ title: 'Schedule' }} />
      <MainTab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <MainTab.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    </MainTab.Navigator>
  );
}

/** Branded splash shown while the stored session is being restored. */
function AuthLoadingScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.splash, { backgroundColor: theme.colors.background }]}>
      <AppLogo size={96} />
      <Text variant="bodySmall" tone="secondary">
        Loading your groups…
      </Text>
    </View>
  );
}

export function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const theme = useTheme();

  // Keeps navigation's own surfaces (card backgrounds, transition overlays) in
  // step with the app theme, which prevents white flashes in dark mode.
  const navigationTheme: NavTheme = {
    ...(theme.isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.isDark ? DarkTheme : DefaultTheme).colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.error,
    },
  };

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme} linking={linking}>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          // Enables the iOS edge swipe-back gesture across the stack.
          gestureEnabled: true,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        {isAuthenticated ? (
          <>
            <RootStack.Screen name="Main" component={MainTabs} />
            <RootStack.Screen
              name="CreateGroup"
              component={CreateGroupScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <RootStack.Screen
              name="JoinGroup"
              component={JoinGroupScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <RootStack.Screen name="GroupDetail" component={GroupDetailScreen} />
            <RootStack.Screen name="Defaulters" component={DefaultersScreen} />
            <RootStack.Screen
              name="MakePayment"
              component={MakePaymentScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <RootStack.Screen name="SetupAutoCharge" component={SetupAutoChargeScreen} />
            <RootStack.Screen name="SecurityDeposit" component={SecurityDepositScreen} />
            <RootStack.Screen name="SurplusAllocation" component={SurplusAllocationScreen} />
            <RootStack.Screen
              name="InviteMembers"
              component={InviteMembersScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
});
