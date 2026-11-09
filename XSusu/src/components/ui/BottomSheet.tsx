import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { Button } from './Button';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  /** Heights the sheet snaps to, as points or percentages. */
  snapPoints?: (string | number)[];
  /** Disables swipe-down and backdrop dismissal, for blocking flows. */
  dismissible?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Declarative wrapper around `@gorhom/bottom-sheet`.
 *
 * Sheets replace centre-screen modals and `Alert.alert` throughout the app:
 * they are thumb-reachable and dismissible by gesture.
 *
 * Requires `BottomSheetModalProvider` and `GestureHandlerRootView` at the app
 * root — both are wired up in `App.tsx`.
 */
export function BottomSheet({
  visible,
  onClose,
  children,
  title,
  subtitle,
  snapPoints,
  dismissible = true,
  contentStyle,
}: BottomSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  const handleChange = useCallback(
    (index: number) => {
      // -1 means the sheet was dismissed, including by swipe or backdrop tap.
      if (index === -1 && visible) onClose();
    },
    [onClose, visible]
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={1}
        pressBehavior={dismissible ? 'close' : 'none'}
        style={[props.style, { backgroundColor: theme.colors.backdrop }]}
      />
    ),
    [dismissible, theme.colors.backdrop]
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      // Omitting snapPoints lets the sheet size itself to its content.
      enableDynamicSizing={!snapPoints}
      onChange={handleChange}
      enablePanDownToClose={dismissible}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: theme.radius['2xl'],
        borderTopRightRadius: theme.radius['2xl'],
      }}
      handleIndicatorStyle={{
        backgroundColor: theme.colors.borderStrong,
        width: 40,
      }}
    >
      <BottomSheetView
        style={[
          {
            paddingHorizontal: theme.spacing.xl,
            // Clears the home indicator, with a floor for devices without one.
            paddingBottom: Math.max(insets.bottom, theme.spacing.xl),
            paddingTop: theme.spacing.sm,
            gap: theme.spacing.lg,
          },
          contentStyle,
        ]}
      >
        {title ? (
          <View style={styles.header}>
            <Text variant="h2" accessibilityRole="header">
              {title}
            </Text>
            {subtitle ? (
              <Text variant="body" tone="secondary">
                {subtitle}
              </Text>
            ) : null}
          </View>
        ) : null}

        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

export interface ConfirmSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as destructive and fires an error haptic. */
  destructive?: boolean;
  loading?: boolean;
}

/**
 * Confirmation sheet — the replacement for `Alert.alert` with a destructive
 * action, e.g. signing out or removing a member.
 */
export function ConfirmSheet({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
}: ConfirmSheetProps) {
  const theme = useTheme();
  const haptics = useHaptics();

  useEffect(() => {
    // A warning pulse on open makes destructive confirmations harder to
    // dismiss on autopilot.
    if (visible && destructive) haptics.warning();
  }, [destructive, haptics, visible]);

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} subtitle={message}>
      <View style={{ gap: theme.spacing.md }}>
        <Button
          label={confirmLabel}
          onPress={onConfirm}
          variant={destructive ? 'danger' : 'primary'}
          loading={loading}
          fullWidth
        />
        <Button label={cancelLabel} onPress={onClose} variant="ghost" fullWidth />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4 },
});
