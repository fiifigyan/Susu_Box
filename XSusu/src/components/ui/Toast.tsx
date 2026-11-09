import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ToastMessage, {
  type ToastConfig,
  type ToastConfigParams,
} from 'react-native-toast-message';
import { Text } from './Text';
import { useTheme } from '../../hooks/useTheme';
import type { ToastVariant } from '../../hooks/useToast';

interface ToastAppearance {
  accent: string;
  wash: string;
  icon: keyof typeof Ionicons.glyphMap;
  role: string;
}

/**
 * Themed toast card.
 *
 * Toasts replace `Alert.alert` for anything that does not need a decision: they
 * do not interrupt, and they dismiss themselves.
 */
function ToastCard({
  params,
  appearance,
}: {
  params: ToastConfigParams<unknown>;
  appearance: ToastAppearance;
}) {
  const theme = useTheme();
  const { text1, text2 } = params;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          gap: theme.spacing.md,
          borderLeftWidth: 4,
          borderLeftColor: appearance.accent,
        },
        theme.isDark
          ? { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border }
          : theme.shadows.lg,
      ]}
      accessible
      // `assertive` interrupts the screen reader, which is right for a message
      // that will disappear on its own.
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      accessibilityLabel={`${appearance.role}. ${text1}${text2 ? `. ${text2}` : ''}`}
    >
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: appearance.wash, borderRadius: theme.radius.full },
        ]}
      >
        <Ionicons name={appearance.icon} size={18} color={appearance.accent} />
      </View>

      <View style={styles.body}>
        {text1 ? (
          <Text variant="h4" numberOfLines={2}>
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text variant="bodySmall" tone="secondary" numberOfLines={3}>
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Toast host. Render once, as the last child of the app root so it layers above
 * navigation and bottom sheets.
 */
export function AppToast() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const config = useMemo<ToastConfig>(() => {
    const appearances: Record<ToastVariant, ToastAppearance> = {
      success: {
        accent: theme.colors.success,
        wash: theme.colors.successSubtle,
        icon: 'checkmark-circle',
        role: 'Success',
      },
      error: {
        accent: theme.colors.error,
        wash: theme.colors.errorSubtle,
        icon: 'alert-circle',
        role: 'Error',
      },
      warning: {
        accent: theme.colors.warning,
        wash: theme.colors.warningSubtle,
        icon: 'warning',
        role: 'Warning',
      },
      info: {
        accent: theme.colors.info,
        wash: theme.colors.infoSubtle,
        icon: 'information-circle',
        role: 'Information',
      },
    };

    return {
      success: params => <ToastCard params={params} appearance={appearances.success} />,
      error: params => <ToastCard params={params} appearance={appearances.error} />,
      warning: params => <ToastCard params={params} appearance={appearances.warning} />,
      info: params => <ToastCard params={params} appearance={appearances.info} />,
    };
  }, [theme]);

  return <ToastMessage config={config} topOffset={insets.top + 8} />;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '92%',
    alignSelf: 'center',
  },
  iconCircle: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
});
