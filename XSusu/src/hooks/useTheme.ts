import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useThemeContext } from '../contexts/ThemeContext';
import type { Theme } from '../theme';

/** The active theme. Use this instead of importing colour tokens directly. */
export function useTheme(): Theme {
  return useThemeContext().theme;
}

/** Theme preference controls, for the Appearance setting. */
export function useThemePreference() {
  const { preference, setPreference, toggleTheme, scheme, isDark } = useThemeContext();
  return { preference, setPreference, toggleTheme, scheme, isDark };
}

type NamedStyles<T> = StyleSheet.NamedStyles<T>;

/**
 * Builds a themed stylesheet, recreated only when the theme changes.
 *
 * ```ts
 * const styles = useThemedStyles(t => ({
 *   card: { backgroundColor: t.colors.surface, padding: t.spacing.lg },
 * }));
 * ```
 */
export function useThemedStyles<T extends NamedStyles<T>>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  // `factory` is intentionally excluded: inline arrow functions are a new
  // reference every render, which would defeat the memo entirely. Factories must
  // therefore be pure functions of `theme`, which is the documented contract.
  return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
}
