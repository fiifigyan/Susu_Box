import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import type { Gradient } from '../../theme';

export interface ScreenProps {
  children: React.ReactNode;
  /**
   * Which insets to apply. Defaults to the top edge only — bottom is usually
   * owned by the tab bar or a sticky footer, which handle it themselves.
   */
  edges?: readonly Edge[];
  /**
   * `default` — the warm app background.
   * `surface` — card white, for form-heavy screens.
   * `gradient` — full-bleed gradient, for auth and celebration screens.
   */
  background?: 'default' | 'surface' | 'gradient';
  /** Gradient stops when `background="gradient"`. Defaults to the auth wash. */
  gradient?: Gradient;
  /** Applies the standard horizontal gutter. */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  /**
   * Forces status bar content colour. By default it follows the theme, which is
   * correct except over dark gradients in light mode.
   */
  statusBarStyle?: 'light' | 'dark';
}

/**
 * Root container for every screen.
 *
 * Handles safe-area insets and the status bar so no screen has to, which is what
 * stops content colliding with notches and home indicators.
 */
export function Screen({
  children,
  edges = ['top'],
  background = 'default',
  gradient,
  padded = false,
  style,
  statusBarStyle,
}: ScreenProps) {
  const theme = useTheme();

  const containerStyle: ViewStyle[] = [
    styles.container,
    padded ? { paddingHorizontal: theme.screenPadding } : {},
    (style as ViewStyle) ?? {},
  ];

  const barStyle = statusBarStyle ?? (theme.isDark ? 'light' : 'dark');

  if (background === 'gradient') {
    return (
      <LinearGradient
        colors={gradient ?? theme.colors.gradientAuth}
        style={styles.fill}
        // Top-left to bottom-right reads as a light source above the screen.
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 1 }}
      >
        <StatusBar style={barStyle} />
        <SafeAreaView style={styles.fill} edges={edges}>
          <View style={containerStyle}>{children}</View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const backgroundColor =
    background === 'surface' ? theme.colors.surface : theme.colors.background;

  return (
    <View style={[styles.fill, { backgroundColor }]}>
      <StatusBar style={barStyle} />
      <SafeAreaView style={styles.fill} edges={edges}>
        <View style={containerStyle}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { flex: 1 },
});
