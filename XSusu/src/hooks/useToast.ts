import { useMemo } from 'react';
import Toast from 'react-native-toast-message';
import { haptics } from './useHaptics';
import { getErrorMessage } from '../utils/errors';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  /** Secondary line, for detail below the headline. */
  description?: string;
  /** Milliseconds on screen. Defaults to 2500, or 4000 for errors. */
  duration?: number;
  /** Suppress the accompanying haptic pulse. */
  silent?: boolean;
}

export interface ToastApi {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  /**
   * Shows the message the API returned for a failed request.
   * Replaces the `Alert.alert('...failed', error.message)` pattern.
   */
  fromError: (error: unknown, fallback?: string) => void;
  hide: () => void;
}

function show(type: ToastVariant, message: string, options?: ToastOptions): void {
  if (!options?.silent) {
    if (type === 'success') haptics.success();
    else if (type === 'error') haptics.error();
    else if (type === 'warning') haptics.warning();
    else haptics.light();
  }

  Toast.show({
    type,
    text1: message,
    text2: options?.description,
    // Errors get longer on screen: they usually require the user to act.
    visibilityTime: options?.duration ?? (type === 'error' ? 4000 : 2500),
  });
}

const toast: ToastApi = {
  success: (message, options) => show('success', message, options),
  error: (message, options) => show('error', message, options),
  warning: (message, options) => show('warning', message, options),
  info: (message, options) => show('info', message, options),
  fromError: (error, fallback) => show('error', getErrorMessage(error, fallback)),
  hide: () => Toast.hide(),
};

/** Stable across renders, so it is safe in dependency arrays. */
export function useToast(): ToastApi {
  return useMemo(() => toast, []);
}

/** Non-hook access, for use in services or outside the component tree. */
export { toast };
