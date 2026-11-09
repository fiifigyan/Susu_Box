/**
 * Colour tokens for XSusu.
 *
 * `palette` holds the raw, mode-independent ramps. Never consume it directly in
 * a component — read from the active theme (`useTheme().colors`) so dark mode
 * keeps working.
 */

export const palette = {
  emerald: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  gold: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  purple: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
  },
  rose: {
    50: '#FFF1F2',
    100: '#FFE4E6',
    300: '#FDA4AF',
    400: '#FB7185',
    500: '#F43F5E',
    600: '#E11D48',
  },
  sky: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',
    600: '#0284C7',
  },
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  zinc: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    400: '#A1A1AA',
    500: '#71717A',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#0A0A0B',
  },
  /** Kente-inspired accents. Used sparingly, for celebration surfaces only. */
  kente: {
    saffron: '#E8A33D',
    clay: '#C2410C',
    indigo: '#3730A3',
    jade: '#0F766E',
  },
  white: '#FFFFFF',
  black: '#000000',
  /** Ghanaian mobile-money brand colours, for payment method cards. */
  brand: {
    mtn: '#FFCC00',
    telecel: '#E60000',
    airtelTigo: '#0057B8',
  },
} as const;

/** A gradient is always at least two stops, matching expo-linear-gradient. */
export type Gradient = readonly [string, string, ...string[]];

export interface ThemeColors {
  /** Brand */
  primary: string;
  primaryDark: string;
  primaryLight: string;
  /** Text/icon colour that is legible on top of `primary`. */
  onPrimary: string;
  /** Low-emphasis primary wash, e.g. selected rows or icon circles. */
  primarySubtle: string;

  secondary: string;
  secondarySubtle: string;
  onSecondary: string;

  accent: string;
  accentSubtle: string;
  onAccent: string;

  /** Surfaces */
  background: string;
  surface: string;
  /** A surface raised above `surface`, e.g. a card on a card. */
  surfaceElevated: string;
  /** Pressed/hover wash for list rows and tiles. */
  surfaceSunken: string;
  border: string;
  borderStrong: string;
  /** Scrim behind modals and expanded FABs. */
  backdrop: string;
  /** Fill for glassmorphic cards where real blur is unavailable. */
  glass: string;
  glassBorder: string;

  /** Content */
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  /** Status */
  success: string;
  successSubtle: string;
  warning: string;
  warningSubtle: string;
  error: string;
  errorSubtle: string;
  info: string;
  infoSubtle: string;

  /** Skeleton shimmer */
  skeletonBase: string;
  skeletonHighlight: string;

  /** Gradients */
  gradientPrimary: Gradient;
  gradientBalance: Gradient;
  gradientGold: Gradient;
  gradientAccent: Gradient;
  gradientSuccess: Gradient;
  gradientError: Gradient;
  gradientNeutral: Gradient;
  /** Subtle wash behind auth screens. */
  gradientAuth: Gradient;
}

export const lightColors: ThemeColors = {
  primary: palette.emerald[700],
  primaryDark: palette.emerald[800],
  primaryLight: palette.emerald[500],
  onPrimary: palette.white,
  primarySubtle: palette.emerald[50],

  secondary: palette.gold[500],
  secondarySubtle: palette.gold[50],
  onSecondary: palette.slate[900],

  accent: palette.purple[600],
  accentSubtle: palette.purple[50],
  onAccent: palette.white,

  background: '#FAFAF9',
  surface: palette.white,
  surfaceElevated: palette.white,
  surfaceSunken: palette.slate[50],
  border: palette.slate[200],
  borderStrong: palette.slate[300],
  backdrop: 'rgba(15, 23, 42, 0.45)',
  glass: 'rgba(255, 255, 255, 0.72)',
  glassBorder: 'rgba(255, 255, 255, 0.55)',

  text: palette.slate[900],
  textSecondary: palette.slate[500],
  textTertiary: palette.slate[400],
  textInverse: palette.white,

  success: palette.emerald[500],
  successSubtle: palette.emerald[50],
  warning: palette.gold[500],
  warningSubtle: palette.gold[50],
  error: palette.rose[500],
  errorSubtle: palette.rose[50],
  info: palette.sky[500],
  infoSubtle: palette.sky[50],

  skeletonBase: palette.slate[100],
  skeletonHighlight: palette.slate[200],

  gradientPrimary: [palette.emerald[700], palette.emerald[500]],
  gradientBalance: [palette.emerald[800], palette.emerald[600], palette.kente.jade],
  gradientGold: [palette.gold[600], palette.kente.saffron, palette.gold[300]],
  gradientAccent: [palette.purple[700], palette.purple[500]],
  gradientSuccess: [palette.emerald[600], palette.emerald[400]],
  gradientError: [palette.rose[600], palette.rose[400]],
  gradientNeutral: [palette.slate[700], palette.slate[500]],
  gradientAuth: [palette.emerald[50], '#FAFAF9', palette.white],
};

/**
 * Dark mode. Accents are brightened one ramp step so they keep the same
 * perceived weight against a near-black background.
 */
export const darkColors: ThemeColors = {
  primary: palette.emerald[500],
  primaryDark: palette.emerald[600],
  primaryLight: palette.emerald[400],
  onPrimary: palette.zinc[950],
  primarySubtle: 'rgba(16, 185, 129, 0.14)',

  secondary: palette.gold[400],
  secondarySubtle: 'rgba(251, 191, 36, 0.14)',
  onSecondary: palette.zinc[950],

  accent: palette.purple[400],
  accentSubtle: 'rgba(167, 139, 250, 0.14)',
  onAccent: palette.zinc[950],

  background: palette.zinc[950],
  surface: palette.zinc[900],
  surfaceElevated: palette.zinc[800],
  surfaceSunken: 'rgba(255, 255, 255, 0.04)',
  border: palette.zinc[800],
  borderStrong: palette.zinc[700],
  backdrop: 'rgba(0, 0, 0, 0.6)',
  glass: 'rgba(39, 39, 42, 0.68)',
  glassBorder: 'rgba(255, 255, 255, 0.10)',

  text: palette.zinc[50],
  textSecondary: palette.zinc[400],
  textTertiary: palette.zinc[500],
  textInverse: palette.zinc[950],

  success: palette.emerald[400],
  successSubtle: 'rgba(52, 211, 153, 0.14)',
  warning: palette.gold[400],
  warningSubtle: 'rgba(251, 191, 36, 0.14)',
  error: palette.rose[400],
  errorSubtle: 'rgba(251, 113, 133, 0.14)',
  info: palette.sky[400],
  infoSubtle: 'rgba(56, 189, 248, 0.14)',

  skeletonBase: palette.zinc[800],
  skeletonHighlight: palette.zinc[700],

  gradientPrimary: [palette.emerald[600], palette.emerald[400]],
  gradientBalance: [palette.emerald[800], palette.kente.jade, palette.zinc[900]],
  gradientGold: [palette.gold[500], palette.kente.saffron, palette.gold[300]],
  gradientAccent: [palette.purple[600], palette.purple[400]],
  gradientSuccess: [palette.emerald[500], palette.emerald[300]],
  gradientError: [palette.rose[500], palette.rose[300]],
  gradientNeutral: [palette.zinc[700], palette.zinc[800]],
  gradientAuth: [palette.zinc[900], palette.zinc[950], palette.black],
};
