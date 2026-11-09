import { useMemo } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback helpers.
 *
 * Every call is fire-and-forget and swallows errors: haptics are unavailable on
 * web, on Android devices without a vibrator, and when the user has disabled
 * system haptics. None of those should ever surface as an app error.
 */
export interface HapticsApi {
  /** Standard button press. */
  light: () => void;
  /** Swipe actions, drag thresholds. */
  medium: () => void;
  heavy: () => void;
  /** Tab switches, segmented control, picker changes. */
  selection: () => void;
  /** Completed action — payment recorded, member checked in. */
  success: () => void;
  warning: () => void;
  error: () => void;
  /** Celebration pattern for payout completion. */
  celebrate: () => void;
}

const isSupported = Platform.OS === 'ios' || Platform.OS === 'android';

function run(action: () => Promise<void>): void {
  if (!isSupported) return;
  action().catch(() => {
    // Device or OS setting does not support haptics.
  });
}

const haptics: HapticsApi = {
  light: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  heavy: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  selection: () => run(() => Haptics.selectionAsync()),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  celebrate: () => {
    if (!isSupported) return;
    // Three ascending taps. Delays are staggered so the pulses stay distinct
    // rather than merging into one long buzz.
    run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    setTimeout(() => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)), 120);
    setTimeout(() => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)), 260);
  },
};

/** Stable across renders, so it is safe in dependency arrays. */
export function useHaptics(): HapticsApi {
  return useMemo(() => haptics, []);
}

/** Non-hook access, for use inside event handlers outside components. */
export { haptics };
