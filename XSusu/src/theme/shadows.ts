import { Platform, type ViewStyle } from 'react-native';

type Elevation = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Elevation presets.
 *
 * iOS uses layered `shadow*` props; Android only honours `elevation`, so both
 * are declared. Shadows are intentionally cool-tinted (slate, not pure black)
 * which reads as softer against the warm off-white background.
 *
 * On dark backgrounds shadows are nearly invisible — use a border or
 * `surfaceElevated` for separation there instead of reaching for a bigger shadow.
 */
export const shadows: Record<Elevation, ViewStyle> = {
  none: Platform.select({
    ios: { shadowOpacity: 0 },
    default: { elevation: 0 },
  }) as ViewStyle,
  xs: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    default: { elevation: 1 },
  }) as ViewStyle,
  sm: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 6,
    },
    default: { elevation: 2 },
  }) as ViewStyle,
  md: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.09,
      shadowRadius: 12,
    },
    default: { elevation: 4 },
  }) as ViewStyle,
  lg: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
    },
    default: { elevation: 8 },
  }) as ViewStyle,
  xl: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.16,
      shadowRadius: 32,
    },
    default: { elevation: 14 },
  }) as ViewStyle,
};

/**
 * A coloured glow, for gradient buttons and the "it's your day" payout card.
 * Android has no tinted-shadow support, so it degrades to a plain elevation.
 */
export function glow(color: string, intensity: 'sm' | 'md' | 'lg' = 'md'): ViewStyle {
  const config = {
    sm: { radius: 8, opacity: 0.25, height: 2, elevation: 3 },
    md: { radius: 16, opacity: 0.35, height: 6, elevation: 6 },
    lg: { radius: 24, opacity: 0.45, height: 10, elevation: 10 },
  }[intensity];

  return Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: config.height },
      shadowOpacity: config.opacity,
      shadowRadius: config.radius,
    },
    default: { elevation: config.elevation },
  }) as ViewStyle;
}
