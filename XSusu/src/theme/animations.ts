import { Easing, ReduceMotion, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';

/** Timing durations in ms. */
export const duration = {
  /** Press feedback — must feel instant. */
  instant: 90,
  fast: 160,
  normal: 240,
  slow: 360,
  /** Counters, progress rings, celebration sequences. */
  deliberate: 800,
} as const;

export const easing = {
  /** Default for most UI transitions. */
  standard: Easing.bezier(0.2, 0, 0, 1),
  /** Elements entering the screen. */
  decelerate: Easing.out(Easing.cubic),
  /** Elements leaving the screen. */
  accelerate: Easing.in(Easing.cubic),
  /** Emphasised, for hero moments. */
  emphasized: Easing.bezier(0.05, 0.7, 0.1, 1),
} as const;

/**
 * Spring presets.
 *
 * `ReduceMotion.System` makes Reanimated honour the OS "Reduce Motion"
 * accessibility setting and jump to the target value instead of animating.
 */
export const springs = {
  /** Snappy, minimal overshoot — buttons, toggles, tab indicators. */
  snappy: {
    damping: 20,
    stiffness: 300,
    mass: 0.6,
    reduceMotion: ReduceMotion.System,
  },
  /** Default for cards, sheets and layout changes. */
  gentle: {
    damping: 18,
    stiffness: 160,
    mass: 0.9,
    reduceMotion: ReduceMotion.System,
  },
  /** Visible bounce — success checkmarks, celebration badges. */
  bouncy: {
    damping: 11,
    stiffness: 180,
    mass: 0.8,
    reduceMotion: ReduceMotion.System,
  },
  /** Bottom sheets and modal presentation. */
  sheet: {
    damping: 24,
    stiffness: 220,
    mass: 1,
    reduceMotion: ReduceMotion.System,
  },
} satisfies Record<string, WithSpringConfig>;

export const timings = {
  fast: {
    duration: duration.fast,
    easing: easing.standard,
    reduceMotion: ReduceMotion.System,
  },
  normal: {
    duration: duration.normal,
    easing: easing.standard,
    reduceMotion: ReduceMotion.System,
  },
  slow: {
    duration: duration.slow,
    easing: easing.emphasized,
    reduceMotion: ReduceMotion.System,
  },
  counter: {
    duration: duration.deliberate,
    easing: easing.decelerate,
    reduceMotion: ReduceMotion.System,
  },
} satisfies Record<string, WithTimingConfig>;

/** Per-item delay for staggered list entrances. */
export const stagger = {
  step: 50,
  /** Cap the delay so long lists don't leave the last rows blank. */
  maxItems: 10,
} as const;

/** Delay for the item at `index` in a staggered entrance. */
export function staggerDelay(index: number): number {
  return Math.min(index, stagger.maxItems) * stagger.step;
}

/** Scale factor applied while a pressable is held down. */
export const pressScale = 0.97;

/** Shimmer sweep duration for skeleton loaders. */
export const shimmerDuration = 1100;
