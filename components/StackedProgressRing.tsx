import React from "react";
import { StyleSheet, Text, View, type TextStyle, type ViewStyle } from "react-native";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { observer } from "@legendapp/state/react";

export type RingSegment = {
  value: number;
  color: string;
};

type StackedProgressRingProps = {
  size: number;
  strokeWidth: number;
  trackColor: string;
  segments: RingSegment[];
  centerLabel?: string;
  centerLabelStyle?: TextStyle;
  style?: ViewStyle;
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));

const StackedProgressRing = observer(
  ({
    size,
    strokeWidth,
    trackColor,
    segments,
    centerLabel,
    centerLabelStyle,
    style,
  }: StackedProgressRingProps) => {
    const radius = size / 2;
    const innerRadius = radius - strokeWidth / 2;

    const path = Skia.Path.Make();
    path.addCircle(radius, radius, innerRadius);

    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        <Canvas style={{ width: size, height: size }}>
          <Path
            path={path}
            strokeWidth={strokeWidth}
            style="stroke"
            color={trackColor}
            strokeJoin="round"
            strokeCap="round"
            start={0}
            end={1}
          />
          {segments.map((segment, index) => (
            <Path
              key={`${index}-${segment.color}`}
              path={path}
              strokeWidth={strokeWidth}
              style="stroke"
              color={segment.color}
              strokeJoin="round"
              strokeCap="round"
              start={0}
              end={clamp(segment.value)}
            />
          ))}
        </Canvas>
        {centerLabel != null ? (
          <View pointerEvents="none" style={styles.center}>
            <Text style={[styles.centerLabel, centerLabelStyle]}>{centerLabel}</Text>
          </View>
        ) : null}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111",
  },
});

export default StackedProgressRing;
