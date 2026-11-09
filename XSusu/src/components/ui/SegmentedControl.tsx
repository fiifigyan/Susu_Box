import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text } from './Text';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { springs } from '../../theme';

export interface Segment<T extends string> {
  value: T;
  label: string;
  /** Optional count shown after the label, e.g. "Active 3". */
  count?: number;
}

export interface SegmentedControlProps<T extends string> {
  segments: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}

const TRACK_PADDING = 4;

/**
 * Tab selector with a sliding indicator.
 *
 * The indicator is positioned from a measured track width, so it stays aligned
 * regardless of label length or screen size.
 */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  const haptics = useHaptics();
  const [trackWidth, setTrackWidth] = useState(0);

  const selectedIndex = Math.max(
    0,
    segments.findIndex(segment => segment.value === value)
  );
  const indicatorOffset = useSharedValue(0);
  const segmentWidth = trackWidth > 0 ? (trackWidth - TRACK_PADDING * 2) / segments.length : 0;

  React.useEffect(() => {
    indicatorOffset.value = withSpring(selectedIndex * segmentWidth, springs.snappy);
  }, [indicatorOffset, segmentWidth, selectedIndex]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorOffset.value }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.track,
        {
          padding: TRACK_PADDING,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.surfaceSunken,
        },
        style,
      ]}
      accessibilityRole="tablist"
    >
      {segmentWidth > 0 ? (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: segmentWidth,
              top: TRACK_PADDING,
              left: TRACK_PADDING,
              bottom: TRACK_PADDING,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.surface,
              ...(theme.isDark ? {} : theme.shadows.xs),
            },
            indicatorStyle,
          ]}
        />
      ) : null}

      {segments.map(segment => {
        const isSelected = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            onPress={() => {
              if (isSelected) return;
              haptics.selection();
              onChange(segment.value);
            }}
            style={styles.segment}
            accessibilityRole="tab"
            accessibilityLabel={
              segment.count === undefined ? segment.label : `${segment.label}, ${segment.count}`
            }
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              variant="caption"
              color={isSelected ? theme.colors.text : theme.colors.textSecondary}
              numberOfLines={1}
            >
              {segment.label}
              {segment.count === undefined ? '' : `  ${segment.count}`}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', position: 'relative' },
  indicator: { position: 'absolute' },
  segment: {
    flex: 1,
    // Matches the 44pt minimum target once track padding is included.
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
