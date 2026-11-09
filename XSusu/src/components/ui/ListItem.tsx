import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { Text } from './Text';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { staggerDelay, timings } from '../../theme';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  /** Ionicon shown in a tinted circle on the left. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Tint for the icon circle. Defaults to the brand colour. */
  iconColor?: string;
  /** Replaces the icon circle entirely, e.g. with an Avatar. */
  leading?: React.ReactNode;
  /** Replaces the chevron, e.g. with a Switch or Badge. */
  trailing?: React.ReactNode;
  onPress?: () => void;
  /** Renders the row in the error tone, for destructive actions. */
  destructive?: boolean;
  /** Index in the list, used to stagger the entrance animation. */
  index?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

/** Standard settings/menu row. */
export function ListItem({
  title,
  subtitle,
  icon,
  iconColor,
  leading,
  trailing,
  onPress,
  destructive = false,
  index,
  disabled = false,
  style,
  accessibilityHint,
}: ListItemProps) {
  const theme = useTheme();
  const haptics = useHaptics();
  // A background wash rather than a scale: rows are wide, and scaling them
  // looks wobbly next to their neighbours.
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: pressed.value > 0.5 ? theme.colors.surfaceSunken : 'transparent',
    opacity: 1 - pressed.value * 0.25,
  }));

  const tint = destructive ? theme.colors.error : iconColor ?? theme.colors.primary;

  const body = (
    <Animated.View
      style={[
        styles.row,
        {
          minHeight: 64,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderRadius: theme.radius.lg,
          gap: theme.spacing.lg,
        },
        animatedStyle,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      {leading ??
        (icon ? (
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: destructive ? theme.colors.errorSubtle : theme.colors.primarySubtle,
                borderRadius: theme.radius.md,
              },
            ]}
          >
            <Ionicons name={icon} size={20} color={tint} />
          </View>
        ) : null)}

      <View style={styles.body}>
        <Text variant="h4" color={destructive ? theme.colors.error : undefined} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySmall" tone="secondary" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {trailing ??
        (onPress ? (
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
        ) : null)}
    </Animated.View>
  );

  const content =
    index === undefined ? (
      body
    ) : (
      <Animated.View entering={FadeInDown.delay(staggerDelay(index)).duration(320)}>
        {body}
      </Animated.View>
    );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={() => {
        haptics.light();
        onPress();
      }}
      disabled={disabled}
      onPressIn={() => {
        pressed.value = withTiming(1, timings.fast);
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, timings.fast);
      }}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  disabled: { opacity: 0.45 },
});
