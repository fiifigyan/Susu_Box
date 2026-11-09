import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, type ColorSchemeName, type Theme } from '../theme';

/** What the user picked. `system` follows the OS setting. */
export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme_preference';

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

interface ThemeContextType {
  theme: Theme;
  /** Resolved scheme actually in use, after applying `system`. */
  scheme: ColorSchemeName;
  isDark: boolean;
  /** The user's stored choice, which may be `system`. */
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  /** Flips between light and dark, pinning the choice (no longer `system`). */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  // Load the persisted preference. Until it resolves we render with `system`,
  // which matches the OS and so avoids a jarring flash for most users.
  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(STORAGE_KEY)
      .then(stored => {
        if (!cancelled && isThemePreference(stored)) {
          setPreferenceState(stored);
        }
      })
      .catch(() => {
        // Storage unavailable — `system` is a safe default.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const scheme: ColorSchemeName =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // Non-fatal: the choice still applies for this session.
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setPreference(scheme === 'dark' ? 'light' : 'dark');
  }, [scheme, setPreference]);

  const value = useMemo<ThemeContextType>(
    () => ({
      theme: themes[scheme],
      scheme,
      isDark: scheme === 'dark',
      preference,
      setPreference,
      toggleTheme,
    }),
    [scheme, preference, setPreference, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used inside a ThemeProvider');
  }
  return context;
}
