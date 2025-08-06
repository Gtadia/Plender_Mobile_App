import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withClamp,
  withDecay,
  withSpring,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { Observable, observe } from "@legendapp/state";

interface PickerProps {
  values: { value: number; label: string | number }[];
  legendState: Observable;
  defaultValue: Observable;
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
}

// const hours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

const Picker = ({
  values,
  legendState,
  moreTextStyles,
  defaultValue,
  VISIBLE_ITEMS = 7,
  ITEM_HEIGHT = 25,
  width = 100,
  textStyle = {
    fontFamily: "Roboto",
    fontSize: 24,
    primaryColor: "black",
    secondaryColor: "rgba(0, 0, 0, 0.3)",
  },
  viewStyle = { perspective: 600, RADIUS_REL_Factor: 0.5 },
  enableSelectBox = true,
}: PickerProps) => {
  const perspective = viewStyle.perspective;
  // const RADIUS_REL = VISIBLE_ITEMS * viewStyle.RADIUS_REL_Factor;
  const RADIUS_REL = VISIBLE_ITEMS * viewStyle.RADIUS_REL_Factor;
  const RADIUS = RADIUS_REL * ITEM_HEIGHT;

  const topMax = (ITEM_HEIGHT * (VISIBLE_ITEMS - 1)) / 2;
  const bottomMax = -ITEM_HEIGHT * (values.length - (VISIBLE_ITEMS + 1) / 2);

  const translateY = useSharedValue(topMax);
  const scrollTo = useCallback((destination: number) => {
    "worklet";
    translateY.value = withSpring(destination, { damping: 50 });
  }, []);

  observe(() => {
    scrollTo((defaultValue.get() - 2) * -ITEM_HEIGHT);
  });

  const update = (num: number) => {
    legendState.set(num);
  };

  const context = useSharedValue({ y: 0 }); // to keep context of the previous scroll position
  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = event.translationY + context.value.y; // adding previous scroll position
    })
    .onEnd((event) => {
      translateY.value = withDecay(
        {
          velocity: event.velocityY,
          deceleration: 0.998,
          clamp: [bottomMax, topMax],
          velocityFactor: 1,
          rubberBandEffect: true,
          rubberBandFactor: 0.6,
          reduceMotion: ReduceMotion.System,
        },
        () => {
          // callback
          if (translateY.value >= topMax) {
            // Do Nothing
          } else if (translateY.value <= bottomMax) {
            // Do Nothing
          } else {
            scrollTo(Math.round(translateY.value / ITEM_HEIGHT) * ITEM_HEIGHT);
          }
          console.log(
            translateY.value,
            Math.abs(Math.round(translateY.value / ITEM_HEIGHT) - 2),
            ITEM_HEIGHT
          );

          runOnJS(update)(
            Math.round(Math.abs(translateY.value / ITEM_HEIGHT - 2))
          );
        }
      );
    });

  // TODO — Implement Tapping Gestures
  const gestureTap = Gesture.Tap();

  const styles = StyleSheet.create({
    container: {
      height: ITEM_HEIGHT * VISIBLE_ITEMS,
      width: width,
      // overflow: "hidden",
      // borderWidth: 2,
      // borderColor: 'red'
    },
    item: {
      height: ITEM_HEIGHT,
      justifyContent: "center",
    },
    label: {
      fontFamily: textStyle.fontFamily,
      fontSize: textStyle.fontSize,
      lineHeight: ITEM_HEIGHT,
      textAlign: "center",
      textAlignVertical: "center",
    },
  });

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const maskElement = (
    <View style={[styles.container]}>
      {enableSelectBox && (
        <View
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              height: ITEM_HEIGHT,
              width: width,
              backgroundColor:
                textStyle.primaryColor === "white"
                  ? "rgba(255,255,255,0.3)"
                  : "rgba(0,0,0,0.3)",
              borderRadius: 16,
            }}
          />
        </View>
      )}
      <Animated.View style={[animatedStyles]}>
        {values.map((v, i) => {
          const animate = useAnimatedStyle(() => {
            const y = interpolate(
              (translateY.value - ITEM_HEIGHT * 2) / -ITEM_HEIGHT,
              [i - RADIUS_REL, i, i + RADIUS_REL],
              [-1, 0, 1],
              Extrapolation.CLAMP
            );
            const rotateX = Math.asin(y);
            const z = RADIUS * Math.cos(rotateX) - RADIUS;

            return {
              transform: [
                { perspective: perspective },
                { rotateX: `${rotateX}rad` },
                { scale: perspective / (perspective - z) }, // translateZ
              ],
            };
          });

          const colorAnimate = useAnimatedStyle(() => {
            return {
              color: interpolateColor(
                (translateY.value - ITEM_HEIGHT * 2) / -ITEM_HEIGHT,
                [i - RADIUS_REL, i, i + RADIUS_REL],
                [
                  `${textStyle.secondaryColor}`,
                  `${textStyle.primaryColor}`,
                  `${textStyle.secondaryColor}`,
                ]
              ),
            };
          });

          return (
            <Animated.View
              key={i}
              style={[
                animate,
                {
                  height: ITEM_HEIGHT,
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              <Animated.Text
                style={[styles.label, colorAnimate, { ...moreTextStyles }]}
              >
                {v.label}
              </Animated.Text>
            </Animated.View>
          );
        })}
      </Animated.View>
    </View>
  );

  return (
    <View>
      <GestureHandlerRootView>
        <GestureDetector gesture={gesture}>{maskElement}</GestureDetector>
      </GestureHandlerRootView>
    </View>
  );
};

export default Picker;