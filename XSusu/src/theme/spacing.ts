/**
 * 4px-based spacing scale. Every margin, padding and gap in the app should come
 * from here so vertical rhythm stays consistent across screens.
 */
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export type SpacingKey = keyof typeof spacing;

/** Horizontal gutter used by every screen container. */
export const screenPadding = spacing.xl;

/**
 * Minimum touch target per the WCAG 2.5.5 / iOS HIG guidance. Interactive
 * components must not render smaller than this.
 */
export const minTouchTarget = 44;
