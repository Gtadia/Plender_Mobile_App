import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback } from "react";

import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated";


import { useSafeAreaInsets } from "react-native-safe-area-context";

let { height } = Dimensions.get("window");
const MAX_TRANSLATE_Y = -height;

import AntDesign from "@expo/vector-icons/AntDesign";
import { observable } from "@legendapp/state";

import { BlurView } from 'expo-blur';

const gestureOffset = 10;
const lineMargin = 15;
const lineHeight = 4;

// Default controller for legacy usages
export const openAddMenu$ = observable(false);

type ObservableLike<T> = { onChange: (fn: (ev: { value: T }) => void, opts?: any) => void; set: (v: T) => void };

const BottomSheet = ({
  close,
  children,
  open$,
}: {
  close?: ObservableLike<any>;
  open$?: ObservableLike<boolean>;
  children: React.ReactNode;
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(0);

  const scrollTo = useCallback((destination: number) => {
    "worklet";
    translateY.value = withSpring(destination, { damping: 50 });
  }, []);

  const context = useSharedValue({ y: 0 }); // to keep context of the previous scroll position
  const openHeight = (-height * 5) / 8;

  const closeSheet = useCallback(() => {
    openObservable.set(false);
  }, [openObservable]);

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      const next = context.value.y + event.translationY;
      translateY.value = Math.min(0, Math.max(openHeight, next));
    })
    .onEnd((event) => {
      const drag = event.translationY;
      if (drag < -50) {
        scrollTo(openHeight);
      } else if (drag > 50) {
        scrollTo(0);
        runOnJS(closeSheet)();
      } else {
        // settle to nearest state
        if (translateY.value < openHeight / 2) {
          scrollTo(openHeight);
        } else {
          scrollTo(0);
          runOnJS(closeSheet)();
        }
      }
    });

    // TODO — EXPO-BLUR is EXPERIMENTAL on ANDROID!!!
    // TODO — enable experimentalBlurMethod on Android in app.json

  const rBottomSheetStyle = useAnimatedStyle(() => {
    const borderRadius = interpolate(
      translateY.value, // when translateY.value...
      [MAX_TRANSLATE_Y + 50, MAX_TRANSLATE_Y], // reaches value of MAX_TRANSLATE_Y+50, the border radius needs to be 5
      [25, 5], // otherwise, if it is less than or equal to MAX_TRANSLATE_Y, it will be 25
      Extrapolation.CLAMP // without CLAMP, if the value is less than MAX_TRANSLATE_Y, the borderRadius won't be clamped to 25, but greater
    );
    const borderWidth = interpolate(
      translateY.value,
      [-50, 0],
      // [3, 0], // TODO — This is temporary, make the background blur
      Extrapolation.CLAMP
    );
    return {
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
      borderWidth,
      height: -translateY.value,
    };
  });

  const animatedStyles = useAnimatedStyle(() => {
    return {
      height: translateY.value - MAX_TRANSLATE_Y < 10 ? "auto" : 0,
    };
  });

  const openObservable = open$ ?? openAddMenu$;
  openObservable.onChange?.(
    ({ value }) => {
      if (value) scrollTo(openHeight);
      else scrollTo(0);
    },
    { initial: false, trackingType: true }
  );
  close?.onChange?.(
    () => {
      scrollTo(0);
      closeSheet();
    },
    { initial: false, trackingType: true }
  );

  // observe(() => {
  //   // Doesn't matter if it's true or false, just detect when changes happen
  //   scrollTo((-height * 5) / 8);
  // });

  return (
    <Animated.View
      style={[styles.container, rBottomSheetStyle, { overflow: "hidden" }]}
    >
      <GestureDetector gesture={gesture}>
        <BlurView intensity={90} tint="light" style={{ flex: 1, backgroundColor: "white" }}>
          <View style={[styles.gestureArea]}>
            <View style={styles.line} />
          </View>
          <View style={{ overflow: "hidden" }}>
            <Animated.View style={[animatedStyles]}>
              <View
                style={{ paddingTop: insets.top - 2 * lineMargin - lineHeight }}
              ></View>
              <TouchableOpacity
                onPress={() => {
                  scrollTo(0);
                  closeSheet();
                }}
                style={{ alignSelf: "flex-start" }}
              >
                <AntDesign name="close" size={24} color="black" />
              </TouchableOpacity>
            </Animated.View>
          </View>
          <View style={{ flex: 1 }}>{children}</View>
        </BlurView>
      </GestureDetector>
    </Animated.View>
  );
};

export default BottomSheet;

const styles = StyleSheet.create({
  container: {
    height: 0,
    width: "100%",
    backgroundColor: "",
    position: "absolute",
    bottom: 0,
    zIndex: 1000,
  },
  line: {
    width: 75,
    height: lineHeight,
    backgroundColor: "gray",
    alignSelf: "center",
    marginVertical: lineMargin,
    borderRadius: lineHeight / 2,
  },
  gestureArea: {
    width: "100%",
    height: "auto",
  },
});
