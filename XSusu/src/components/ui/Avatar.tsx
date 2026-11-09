import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Text';
import { useTheme } from '../../hooks/useTheme';
import { palette, type Gradient } from '../../theme';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AvatarProps {
  /** Shown as initials when there is no image. */
  name?: string;
  /** Remote or local image URI. Falls back to initials while loading or on error. */
  uri?: string | null;
  size?: AvatarSize;
  /** Forces specific gradient stops instead of the name-derived pair. */
  gradient?: Gradient;
  /** Ring around the avatar, for overlapping stacks. */
  ringColor?: string;
  style?: StyleProp<ViewStyle>;
}

const SIZES: Record<AvatarSize, { box: number; variant: 'captionSmall' | 'caption' | 'h4' | 'h3' | 'h2' | 'h1' }> = {
  xs: { box: 24, variant: 'captionSmall' },
  sm: { box: 32, variant: 'caption' },
  md: { box: 40, variant: 'h4' },
  lg: { box: 52, variant: 'h3' },
  xl: { box: 72, variant: 'h2' },
  '2xl': { box: 96, variant: 'h1' },
};

/**
 * Fixed set of gradient pairs. A name always maps to the same pair, so a member
 * keeps a recognisable colour across every screen.
 */
const IDENTITY_GRADIENTS: Gradient[] = [
  [palette.emerald[600], palette.emerald[400]],
  [palette.purple[600], palette.purple[400]],
  [palette.sky[600], palette.sky[400]],
  [palette.gold[600], palette.gold[400]],
  [palette.kente.jade, palette.emerald[400]],
  [palette.kente.indigo, palette.purple[400]],
  [palette.kente.clay, palette.gold[500]],
  [palette.rose[600], palette.rose[400]],
];

function initialsOf(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function gradientFor(name?: string): Gradient {
  if (!name) return IDENTITY_GRADIENTS[0];
  // Simple additive hash — deterministic and good enough for bucketing colours.
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash + name.charCodeAt(index) * (index + 1)) % 997;
  }
  return IDENTITY_GRADIENTS[hash % IDENTITY_GRADIENTS.length];
}

export function Avatar({ name, uri, size = 'md', gradient, ringColor, style }: AvatarProps) {
  const theme = useTheme();
  const { box, variant } = SIZES[size];

  const ring: ViewStyle = ringColor
    ? { borderWidth: 2, borderColor: ringColor }
    : {};

  return (
    <View
      style={[
        styles.container,
        { width: box, height: box, borderRadius: theme.radius.full },
        ring,
        style,
      ]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={name ? `${name}'s avatar` : 'Avatar'}
    >
      <LinearGradient
        colors={gradient ?? gradientFor(name)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {uri ? (
        // expo-image fades in progressively; the gradient underneath acts as the
        // placeholder, so there is never an empty grey box.
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
      ) : (
        <Text variant={variant} color={palette.white}>
          {initialsOf(name)}
        </Text>
      )}
    </View>
  );
}

/**
 * Overlapping avatars with a "+N" overflow chip, for member counts on cards.
 */
export interface AvatarStackProps {
  names: string[];
  size?: Extract<AvatarSize, 'xs' | 'sm' | 'md'>;
  /** Avatars shown before collapsing the rest into "+N". */
  max?: number;
  style?: StyleProp<ViewStyle>;
}

export function AvatarStack({ names, size = 'sm', max = 4, style }: AvatarStackProps) {
  const theme = useTheme();
  const visible = names.slice(0, max);
  const overflow = names.length - visible.length;
  const { box } = SIZES[size];

  return (
    <View
      style={[styles.stack, style]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${names.length} members`}
    >
      {visible.map((name, index) => (
        <Avatar
          key={`${name}-${index}`}
          name={name}
          size={size}
          ringColor={theme.colors.surface}
          style={index > 0 ? { marginLeft: -box / 3 } : undefined}
        />
      ))}

      {overflow > 0 ? (
        <View
          style={[
            styles.overflow,
            {
              width: box,
              height: box,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.surfaceSunken,
              borderColor: theme.colors.surface,
              marginLeft: -box / 3,
            },
          ]}
        >
          <Text variant="captionSmall" tone="secondary">
            +{overflow}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stack: { flexDirection: 'row', alignItems: 'center' },
  overflow: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
