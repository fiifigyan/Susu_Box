/** Border radius scale. `full` is a pill — pair it with a fixed height. */
export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

export type RadiusKey = keyof typeof radius;
