import { Platform, type TextStyle } from 'react-native';

/**
 * Font families. The string values are the export names from
 * `@expo-google-fonts/inter` and `@expo-google-fonts/jetbrains-mono`, which are
 * also the keys the fonts register under via `useFonts`.
 */
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  black: 'Inter_900Black',
  mono: 'JetBrainsMono_500Medium',
} as const;

export const fontSize = {
  '2xs': 11,
  xs: 12,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
  '6xl': 48,
} as const;

/**
 * Named text styles. Prefer these over ad-hoc `fontSize`/`fontWeight` pairs.
 *
 * `fontWeight` is still declared alongside `fontFamily` because Android falls
 * back to a synthetic weight if a font file fails to load, which keeps the
 * hierarchy readable instead of collapsing everything to regular.
 */
export const textVariants = {
  /** Hero numbers — balances, payout amounts. */
  displayLarge: {
    fontFamily: fontFamily.black,
    fontSize: fontSize['6xl'],
    lineHeight: 52,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  display: {
    fontFamily: fontFamily.black,
    fontSize: fontSize['5xl'],
    lineHeight: 44,
    fontWeight: '900',
    letterSpacing: -1.2,
  },
  displaySmall: {
    fontFamily: fontFamily.black,
    fontSize: fontSize['4xl'],
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  /** Screen titles. */
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['3xl'],
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  /** Section titles. */
  h2: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize['2xl'],
    lineHeight: 30,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  /** Card titles. */
  h3: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.lg,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  h4: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    lineHeight: 22,
    fontWeight: '600',
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodyMedium: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    lineHeight: 22,
    fontWeight: '500',
  },
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: 19,
    fontWeight: '400',
  },
  /** Labels and badges. */
  caption: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    lineHeight: 16,
    fontWeight: '500',
  },
  captionSmall: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize['2xs'],
    lineHeight: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  /** All-caps overline for section headers. */
  overline: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize['2xs'],
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  /** Button labels. */
  button: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  buttonSmall: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    lineHeight: 18,
    fontWeight: '600',
  },
  /** Account numbers, invite codes, transaction references. */
  mono: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
} satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof textVariants;

/**
 * Tabular figures keep animated counters from jittering as digits change width.
 * Only iOS supports the font-variant array reliably; Inter's default figures are
 * near-tabular on Android so the omission is not noticeable.
 */
export const tabularNumbers: TextStyle = Platform.select({
  ios: { fontVariant: ['tabular-nums'] },
  default: {},
}) as TextStyle;
