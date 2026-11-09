import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  Easing,
  FadeInDown,
  ReduceMotion,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Text } from '../ui/Text';
import { Badge, type BadgeTone } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { staggerDelay } from '../../theme';
import { formatPhone } from '../../utils/formatters';

export type MemberStatus = 'PAID' | 'VERIFIED' | 'PENDING' | 'MISSED';

export interface MemberRowProps {
  name: string;
  phone: string;
  status: MemberStatus;
  position: number;
  /** Swipe right, or tap the inline button, to record a manual payment. */
  onCheckIn?: () => void;
  /** Swipe left to verify against mobile money. */
  onVerify?: () => void;
  isVerifying?: boolean;
  showAutoVerify?: boolean;
  /** Long press to open the member detail sheet. */
  onLongPress?: () => void;
  /** Position in the list, used to stagger the entrance animation. */
  index?: number;
}

export function MemberRow({
  name,
  phone,
  status,
  position,
  onCheckIn,
  onVerify,
  isVerifying = false,
  showAutoVerify = false,
  onLongPress,
  index,
}: MemberRowProps) {
  const theme = useTheme();
  const haptics = useHaptics();
  const swipeableRef = useRef<SwipeableMethods>(null);
  const pulse = useSharedValue(0);

  const isPending = status === 'PENDING';

  useEffect(() => {
    if (!isPending) {
      pulse.value = 0;
      return;
    }
    // A slow breath on the pending marker draws the eye to rows still owing,
    // without the distraction of a spinner.
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease), reduceMotion: ReduceMotion.System }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease), reduceMotion: ReduceMotion.System })
      ),
      -1,
      false
    );
  }, [isPending, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + pulse.value * 0.45,
    transform: [{ scale: 1 + pulse.value * 0.12 }],
  }));

  const presentation: Record<
    MemberStatus,
    { tone: BadgeTone; label: string; icon: keyof typeof Ionicons.glyphMap; accent: string }
  > = {
    PAID: { tone: 'success', label: 'Paid', icon: 'checkmark-circle', accent: theme.colors.success },
    VERIFIED: { tone: 'info', label: 'Verified', icon: 'shield-checkmark', accent: theme.colors.info },
    PENDING: { tone: 'warning', label: 'Pending', icon: 'time', accent: theme.colors.warning },
    MISSED: { tone: 'error', label: 'Missed', icon: 'close-circle', accent: theme.colors.error },
  };

  const { tone, label, icon, accent } = presentation[status];

  const closeAndRun = (action?: () => void) => {
    swipeableRef.current?.close();
    action?.();
  };

  const renderAction = (
    progress: SharedValue<number>,
    config: {
      side: 'left' | 'right';
      icon: keyof typeof Ionicons.glyphMap;
      label: string;
      color: string;
      onPress: () => void;
    }
  ) => <SwipeAction progress={progress} {...config} />;

  const row = (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.md,
          gap: theme.spacing.md,
          borderLeftWidth: 4,
          borderLeftColor: accent,
        },
      ]}
    >
      <View style={styles.identity}>
        <Avatar name={name} size="md" />
        <View
          style={[
            styles.positionPill,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.full,
            },
          ]}
        >
          <Text variant="captionSmall" tone="secondary">
            {position}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text variant="h4" numberOfLines={1}>
          {name}
        </Text>
        {phone ? (
          <Text variant="mono" tone="tertiary" numberOfLines={1}>
            {formatPhone(phone)}
          </Text>
        ) : null}
      </View>

      <View style={[styles.trailing, { gap: theme.spacing.sm }]}>
        {isPending ? (
          <Animated.View style={pulseStyle}>
            <Badge label={label} tone={tone} size="sm" icon={icon} />
          </Animated.View>
        ) : (
          <Badge label={label} tone={tone} size="sm" icon={icon} />
        )}

        {isPending && showAutoVerify && onVerify ? (
          <Pressable
            onPress={() => closeAndRun(onVerify)}
            disabled={isVerifying}
            hitSlop={8}
            style={[
              styles.inlineAction,
              { borderColor: theme.colors.info, borderRadius: theme.radius.sm },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Verify payment for ${name}`}
            accessibilityHint="Checks mobile money for this contribution"
            accessibilityState={{ disabled: isVerifying, busy: isVerifying }}
          >
            {isVerifying ? (
              <ActivityIndicator size="small" color={theme.colors.info} />
            ) : (
              <Text variant="captionSmall" tone="info">
                Verify
              </Text>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  const content = (
    <ReanimatedSwipeable
      ref={swipeableRef}
      // Swipe gestures are only meaningful while a contribution is outstanding.
      enabled={isPending && Boolean(onCheckIn || (showAutoVerify && onVerify))}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
      onSwipeableWillOpen={() => haptics.medium()}
      containerStyle={styles.swipeContainer}
      renderLeftActions={
        onCheckIn
          ? progress =>
              renderAction(progress, {
                side: 'left',
                icon: 'checkmark-circle',
                label: 'Check in',
                color: theme.colors.success,
                onPress: () => closeAndRun(onCheckIn),
              })
          : undefined
      }
      renderRightActions={
        showAutoVerify && onVerify
          ? progress =>
              renderAction(progress, {
                side: 'right',
                icon: 'shield-checkmark',
                label: 'Verify',
                color: theme.colors.info,
                onPress: () => closeAndRun(onVerify),
              })
          : undefined
      }
    >
      {onLongPress ? (
        <Pressable
          onLongPress={() => {
            haptics.medium();
            onLongPress();
          }}
          accessibilityRole="button"
          accessibilityLabel={`${name}, position ${position}, ${label}`}
          accessibilityHint="Long press for member details"
        >
          {row}
        </Pressable>
      ) : (
        row
      )}
    </ReanimatedSwipeable>
  );

  if (index === undefined) return content;

  return (
    <Animated.View entering={FadeInDown.delay(staggerDelay(index)).duration(320)}>
      {content}
    </Animated.View>
  );
}

/** Revealed panel behind a swiped row. */
function SwipeAction({
  progress,
  side,
  icon,
  label,
  color,
  onPress,
}: {
  progress: SharedValue<number>;
  side: 'left' | 'right';
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  const animatedStyle = useAnimatedStyle(() => ({
    // Content scales up as the row is pulled further, confirming the target.
    transform: [{ scale: interpolate(progress.value, [0, 0.6, 1], [0.6, 0.95, 1]) }],
    opacity: interpolate(progress.value, [0, 0.4, 1], [0, 0.7, 1]),
  }));

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.action,
        {
          backgroundColor: color,
          borderRadius: theme.radius.lg,
          marginRight: side === 'left' ? theme.spacing.sm : 0,
          marginLeft: side === 'right' ? theme.spacing.sm : 0,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.actionContent, animatedStyle]}>
        <Ionicons name={icon} size={22} color={theme.colors.onPrimary} />
        <Text variant="captionSmall" color={theme.colors.onPrimary}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  swipeContainer: { overflow: 'visible' },
  row: { flexDirection: 'row', alignItems: 'center' },
  identity: { position: 'relative' },
  positionPill: {
    position: 'absolute',
    bottom: -4,
    right: -6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  body: { flex: 1, gap: 2 },
  trailing: { alignItems: 'flex-end' },
  inlineAction: {
    minHeight: 28,
    minWidth: 60,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  action: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 92,
  },
  actionContent: { alignItems: 'center', gap: 4 },
});
