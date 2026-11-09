import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Text } from '../ui/Text';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { glow, palette, pressScale, springs, timings } from '../../theme';

/**
 * Channel identifiers accepted by `paymentService.initialize`. These are
 * Paystack's values and must not be renamed — only their labels are ours.
 */
export type MoMoChannel = 'mtn_mobile_money' | 'vodafone_cash' | 'airteltigo_money';

interface ChannelPresentation {
  label: string;
  hint: string;
  brand: string;
  /** Brand colours are light, so the label ink flips where needed. */
  onBrand: string;
  icon: keyof typeof Ionicons.glyphMap;
}

/**
 * Vodafone Ghana became Telecel in 2023, so the label follows the current brand
 * while the channel value stays `vodafone_cash` for the payment API.
 */
export const MOMO_CHANNELS: Record<MoMoChannel, ChannelPresentation> = {
  mtn_mobile_money: {
    label: 'MTN MoMo',
    hint: '024, 054, 055, 059',
    brand: palette.brand.mtn,
    onBrand: palette.slate[900],
    icon: 'phone-portrait',
  },
  vodafone_cash: {
    label: 'Telecel Cash',
    hint: '020, 050',
    brand: palette.brand.telecel,
    onBrand: palette.white,
    icon: 'phone-portrait',
  },
  airteltigo_money: {
    label: 'AirtelTigo Money',
    hint: '027, 057, 026, 056',
    brand: palette.brand.airtelTigo,
    onBrand: palette.white,
    icon: 'phone-portrait',
  },
};

export interface PaymentMethodCardProps {
  channel: MoMoChannel;
  selected: boolean;
  onSelect: (channel: MoMoChannel) => void;
  disabled?: boolean;
}

/** Selectable mobile-money channel tile. */
export function PaymentMethodCard({
  channel,
  selected,
  onSelect,
  disabled = false,
}: PaymentMethodCardProps) {
  const theme = useTheme();
  const haptics = useHaptics();
  const { label, hint, brand, onBrand, icon } = MOMO_CHANNELS[channel];

  const scale = useSharedValue(1);
  const selection = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    selection.value = withTiming(selected ? 1 : 0, timings.fast);
  }, [selected, selection]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderWidth: 1 + selection.value * 1.5,
  }));

  return (
    <Pressable
      onPress={() => {
        haptics.selection();
        onSelect(channel);
      }}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(pressScale, springs.snappy);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, springs.snappy);
      }}
      accessibilityRole="radio"
      accessibilityLabel={`${label}, numbers starting ${hint}`}
      accessibilityState={{ selected, disabled }}
    >
      <Animated.View
        style={[
          styles.card,
          {
            borderRadius: theme.radius.xl,
            padding: theme.spacing.lg,
            gap: theme.spacing.md,
            backgroundColor: theme.colors.surface,
            borderColor: selected ? brand : theme.colors.border,
          },
          // The glow ties the selected state to the brand colour.
          selected && !theme.isDark ? glow(brand, 'sm') : null,
          animatedStyle,
          disabled ? styles.disabled : null,
        ]}
      >
        <View style={[styles.logo, { borderRadius: theme.radius.md, overflow: 'hidden' }]}>
          <LinearGradient
            colors={[brand, `${brand}CC`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name={icon} size={20} color={onBrand} />
        </View>

        <View style={styles.body}>
          <Text variant="h4" numberOfLines={1}>
            {label}
          </Text>
          <Text variant="captionSmall" tone="tertiary" numberOfLines={1}>
            {hint}
          </Text>
        </View>

        <View
          style={[
            styles.radio,
            {
              borderRadius: theme.radius.full,
              borderColor: selected ? brand : theme.colors.borderStrong,
              backgroundColor: selected ? brand : 'transparent',
            },
          ]}
        >
          {selected ? <Ionicons name="checkmark" size={14} color={onBrand} /> : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  radio: {
    width: 22,
    height: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
});
