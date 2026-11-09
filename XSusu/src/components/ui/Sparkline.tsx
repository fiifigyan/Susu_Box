import React, { useEffect, useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { timings } from '../../theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface SparklineProps {
  /** Series values, oldest first. Needs at least two points to render. */
  data: number[];
  width: number;
  height: number;
  color?: string;
  /** Adds a soft gradient fill beneath the line. */
  filled?: boolean;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * Compact trend line for the contributions card.
 *
 * The stroke is drawn in on mount via `strokeDashoffset`. Data is normalised to
 * the series' own min/max so a flat-but-high series still reads clearly.
 */
export function Sparkline({
  data,
  width,
  height,
  color,
  filled = true,
  strokeWidth = 2.5,
  style,
  accessibilityLabel,
}: SparklineProps) {
  const theme = useTheme();
  const stroke = color ?? theme.colors.primary;
  const draw = useSharedValue(0);

  const { linePath, areaPath, pathLength } = useMemo(() => {
    if (data.length < 2) {
      return { linePath: '', areaPath: '', pathLength: 0 };
    }

    const padding = strokeWidth;
    const usableHeight = height - padding * 2;
    const min = Math.min(...data);
    const max = Math.max(...data);
    // A flat series would divide by zero; pinning the range centres the line.
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = padding + (1 - (value - min) / range) * usableHeight;
      return { x, y };
    });

    const line = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(' ');

    const area = `${line} L${width} ${height} L0 ${height} Z`;

    // Straight-line distance between points is a good enough estimate to drive
    // the dash animation.
    const length = points.reduce((total, point, index) => {
      if (index === 0) return 0;
      const previous = points[index - 1];
      return total + Math.hypot(point.x - previous.x, point.y - previous.y);
    }, 0);

    return { linePath: line, areaPath: area, pathLength: Math.ceil(length) };
  }, [data, height, strokeWidth, width]);

  useEffect(() => {
    draw.value = 0;
    draw.value = withTiming(1, timings.counter);
  }, [draw, linePath]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: pathLength * (1 - draw.value),
  }));

  if (!linePath) {
    return <View style={[{ width, height }, style]} />;
  }

  return (
    <View
      style={[{ width, height }, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? 'Contribution trend for the last 7 days'}
    >
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="sparkline-fill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={stroke} stopOpacity="0.28" />
            <Stop offset="1" stopColor={stroke} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {filled ? <Path d={areaPath} fill="url(#sparkline-fill)" /> : null}

        <AnimatedPath
          d={linePath}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={pathLength}
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
}
