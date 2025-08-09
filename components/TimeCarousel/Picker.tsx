import { Observable, observe } from "@legendapp/state";
import React, { useCallback } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDecay,
  withSpring,
} from "react-native-reanimated";

type PickerValue = string | number;

interface PickerProps {
  values: PickerValue[];
  legendState: Observable;
  defaultValue: Observable;
  unit?: string;
  unitWidth?: number;
  VISIBLE_ITEMS?: number;
  ITEM_HEIGHT?: number;
  width?: number;
  viewStyle?: { perspective: number; RADIUS_REL_Factor: number };
  textStyle?: {
    fontFamily?: string;
    fontSize?: number;
    primaryColor?: string;
    secondaryColor?: string;
  };
  moreTextStyles?: {};
  moreViewStyles?: {};
  enableSelectBox?: boolean;
  unitYOffset?: number;

  /** NEW – pill controls so you can see & move it easily */
  pillSpan?: "numbers" | "full";      // span only numbers pane or the full column (incl. unit)
  pillOffsetX?: number;               // px adjust (positive -> right)
  pillOffsetY?: number;               // px adjust (positive -> down)
  pillColor?: string;                 // bg color
  pillBorderColor?: string;           // border
}


const safeAsin = (x: number) => {
  "worklet";
  const eps = 1e-4;
  const c = x > 1 ? 1 : x < -1 ? -1 : x;
  const v = c >= 1 ? 1 - eps : c <= -1 ? -1 + eps : c;
  return Math.asin(v);
};

const Picker = ({
  values,
  legendState,
  defaultValue,
  unit,
  unitWidth = 56,
  VISIBLE_ITEMS = 5,
  ITEM_HEIGHT = 34,
  width,
  textStyle = {
    fontFamily: Platform.select({ ios: "System", android: "sans-serif" })!,
    fontSize: 20,
    primaryColor: "#000",
    secondaryColor: "rgba(0,0,0,0.35)",
  },
  viewStyle = { perspective: 650, RADIUS_REL_Factor: 0.55 },
  enableSelectBox = true,
  moreTextStyles,
  unitYOffset = Platform.OS === "android" ? -1 : 0,

  // defaults that make the pill VERY visible while you adjust
  pillSpan = "full",
  pillOffsetX = 0,
  pillOffsetY = 0,
  pillColor = "rgba(0, 0, 0, 0.22)",
  pillBorderColor = "rgba(0, 0, 0, 0.22)",
}: PickerProps) => {
  const perspective = viewStyle.perspective;
  const RADIUS_REL = VISIBLE_ITEMS * viewStyle.RADIUS_REL_Factor;
  const RADIUS = RADIUS_REL * ITEM_HEIGHT;

  const valueToIndex = (val: PickerValue) =>
    Math.max(0, values.findIndex((v) => String(v) === String(val)));

  const topMax = (ITEM_HEIGHT * (VISIBLE_ITEMS - 1)) / 2;
  const bottomMax = -ITEM_HEIGHT * (values.length - (VISIBLE_ITEMS + 1) / 2);

  const numbersWidth = unit ? Math.max(0, width - unitWidth) : width;

  const translateY = useSharedValue(topMax);
  const scrollTo = useCallback((dest: number) => {
    "worklet";
    translateY.value = withSpring(dest, { damping: 45, stiffness: 280, mass: 0.9 });
  }, []);

  observe(() => {
    const idx = valueToIndex(defaultValue.get());
    scrollTo((idx - 2) * -ITEM_HEIGHT);
  });

  const selectedIndex = useDerivedValue(() =>
    Math.round((translateY.value - ITEM_HEIGHT * 2) / -ITEM_HEIGHT)
  );

  const updateJS = (idx: number) => {
    const safe = Math.min(Math.max(idx, 0), values.length - 1);
    legendState.set(values[safe]);
  };

  const context = useSharedValue({ y: 0 });
  const gesture = Gesture.Pan()
    .onStart(() => { context.value = { y: translateY.value }; })
    .onUpdate((e) => { translateY.value = e.translationY + context.value.y; })
    .onEnd((e) => {
      translateY.value = withDecay(
        {
          velocity: e.velocityY,
          deceleration: 0.995,
          clamp: [bottomMax, topMax],
          velocityFactor: 1,
          rubberBandEffect: true,
          rubberBandFactor: 0.85,
          reduceMotion: ReduceMotion.System,
        },
        () => {
          if (translateY.value > topMax || translateY.value < bottomMax) return;
          const snapped = Math.round(translateY.value / ITEM_HEIGHT) * ITEM_HEIGHT;
          scrollTo(snapped);
          runOnJS(updateJS)(selectedIndex.value);
        }
      );
    });

  const styles = StyleSheet.create({
    container: { position: "relative", height: ITEM_HEIGHT * VISIBLE_ITEMS, flex: 1 },
    listPane: { width: numbersWidth, alignSelf: "flex-start" },
    label: {
      fontFamily: textStyle.fontFamily,
      fontSize: textStyle.fontSize,
      lineHeight: ITEM_HEIGHT,
      textAlign: "center",
      textAlignVertical: "center",
      includeFontPadding: false as any,
    },
    // >>> VERY visible pill with absolute positioning <<<
    pill: {
      position: "absolute",
      left: 0, // was missing before
      top: (ITEM_HEIGHT * VISIBLE_ITEMS - ITEM_HEIGHT) / 2,
      height: ITEM_HEIGHT,
      width: pillSpan === "full" ? '100%' : numbersWidth,
      backgroundColor: pillColor,
      borderColor: pillBorderColor,
      borderWidth: 1,
      borderRadius: 12,
      zIndex: 20,
      elevation: 20,
      pointerEvents: "none",
      transform: [{ translateX: pillOffsetX }, { translateY: pillOffsetY }],
    },
    unitOverlay: {
      // position: "absolute", // keep fixed
      left: numbersWidth,
      top: (ITEM_HEIGHT * VISIBLE_ITEMS - ITEM_HEIGHT) / 2,
      height: ITEM_HEIGHT,
      // width: unit ? unitWidth : 0,
      justifyContent: "center",
      paddingLeft: 6,
      zIndex: 30,
      elevation: 30,
      pointerEvents: "none",
    },
  });

  const listTranslate = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={ styles.container }>
      {/* Scrollable numbers */}
      <GestureHandlerRootView style={{ flex: 1, overflow: "hidden" }}>
        <GestureDetector gesture={gesture}>
          <View style={{ flex: 1, flexDirection: "row", justifyContent: 'center' }}>
            <Animated.View style={[styles.listPane, listTranslate]}>
              {values.map((val, i) => {
                const wheelA = useAnimatedStyle(() => {
                  const y = interpolate(
                    (translateY.value - ITEM_HEIGHT * 2) / -ITEM_HEIGHT,
                    [i - RADIUS_REL, i, i + RADIUS_REL],
                    [-1, 0, 1],
                    Extrapolation.CLAMP
                  );
                  const rotateX = safeAsin(y);
                  const z = RADIUS * Math.cos(rotateX) - RADIUS;
                  return {
                    transform: [
                      { perspective },
                      { rotateX: `${rotateX}rad` },
                      { scale: perspective / (perspective - z) },
                    ],
                  };
                });

                const colorA = useAnimatedStyle(() => ({
                  color: interpolateColor(
                    (translateY.value - ITEM_HEIGHT * 2) / -ITEM_HEIGHT,
                    [i - RADIUS_REL, i, i + RADIUS_REL],
                    [textStyle.secondaryColor!, textStyle.primaryColor!, textStyle.secondaryColor!]
                  ),
                }));

                return (
                  <Animated.View
                    key={`${val}-${i}`}
                    style={[wheelA, { height: ITEM_HEIGHT, justifyContent: "center", alignItems: "center" }]}
                  >
                    <Animated.Text style={[styles.label, colorA, { ...moreTextStyles }]}>
                      {val}
                    </Animated.Text>
                  </Animated.View>
                );
              })}
            </Animated.View>

          <View style={styles.unitOverlay}>
            <Text
              style={{
                fontFamily: textStyle.fontFamily,
                fontSize: textStyle.fontSize,     // same size as numbers
                lineHeight: ITEM_HEIGHT,          // <- ensures vertical centering matches
                textAlignVertical: "center",
                includeFontPadding: false as any,  // Android baseline fix
                color: textStyle.secondaryColor,
                transform: [{ translateY: unitYOffset }], // tiny tweak knob if needed
              }}
            >
              {unit}
            </Text>
          </View>
          </View>
        </GestureDetector>
      </GestureHandlerRootView>

      {/* SUPER VISIBLE pill overlay */}
      {enableSelectBox && <View style={styles.pill} />}
    </View>
  );
};

export default Picker;