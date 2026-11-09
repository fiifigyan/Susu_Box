import { darkColors, lightColors, type ThemeColors } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';
import { minTouchTarget, screenPadding, spacing } from './spacing';
import { fontFamily, fontSize, textVariants } from './typography';

export * from './animations';
export * from './colors';
export * from './radius';
export * from './shadows';
export * from './spacing';
export * from './typography';

export type ColorSchemeName = 'light' | 'dark';

/** The object exposed by `useTheme()`. */
export interface Theme {
  scheme: ColorSchemeName;
  isDark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  textVariants: typeof textVariants;
  fontFamily: typeof fontFamily;
  fontSize: typeof fontSize;
  screenPadding: typeof screenPadding;
  minTouchTarget: typeof minTouchTarget;
}

const base = {
  spacing,
  radius,
  shadows,
  textVariants,
  fontFamily,
  fontSize,
  screenPadding,
  minTouchTarget,
} as const;

export const lightTheme: Theme = {
  scheme: 'light',
  isDark: false,
  colors: lightColors,
  ...base,
};

export const darkTheme: Theme = {
  scheme: 'dark',
  isDark: true,
  colors: darkColors,
  ...base,
};

export const themes: Record<ColorSchemeName, Theme> = {
  light: lightTheme,
  dark: darkTheme,
};

/** Font asset map, spread into `useFonts` in App.tsx. */
export { fontAssets } from './fonts';
