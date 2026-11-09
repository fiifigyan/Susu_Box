import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text } from './Text';
import { IconButton } from './IconButton';
import { useTheme } from '../../hooks/useTheme';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Renders a back chevron. Defaults to `navigation.goBack()`. */
  showBack?: boolean;
  onBack?: () => void;
  /** Action rendered on the right, e.g. an IconButton. */
  action?: React.ReactNode;
  /** Colour for title and controls. Set when the header sits on a gradient. */
  contentColor?: string;
  align?: 'left' | 'center';
  style?: StyleProp<ViewStyle>;
}

/**
 * In-screen header.
 *
 * Screens use this with the native navigator header hidden, which gives full
 * control over typography and lets headers sit on top of gradients.
 */
export function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  action,
  contentColor,
  align = 'left',
  style,
}: ScreenHeaderProps) {
  const theme = useTheme();
  const navigation = useNavigation();

  const handleBack = onBack ?? (() => navigation.goBack());

  return (
    <View
      style={[
        styles.container,
        {
          paddingVertical: theme.spacing.md,
          gap: theme.spacing.md,
        },
        style,
      ]}
    >
      {showBack ? (
        <IconButton
          icon="chevron-back"
          onPress={handleBack}
          accessibilityLabel="Go back"
          size="sm"
          color={contentColor}
          style={styles.back}
        />
      ) : null}

      <View style={[styles.titles, align === 'center' ? styles.centered : null]}>
        <Text
          variant="h1"
          color={contentColor}
          align={align === 'center' ? 'center' : undefined}
          numberOfLines={1}
          // Announced as the screen's heading by screen readers.
          accessibilityRole="header"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            variant="bodySmall"
            tone="secondary"
            color={contentColor ? `${contentColor}B3` : undefined}
            align={align === 'center' ? 'center' : undefined}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {action ?? (showBack && align === 'center' ? <View style={styles.spacer} /> : null)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  back: { marginLeft: -12 },
  titles: { flex: 1, gap: 2 },
  centered: { alignItems: 'center' },
  // Balances the back button so a centred title stays optically centred.
  spacer: { width: 44 },
});
