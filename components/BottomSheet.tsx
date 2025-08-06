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

export const openAddMenu$ = observable(false);

const BottomSheet = ({ close, children }: any) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(0);

  const scrollTo = useCallback((destination: number) => {
    "worklet";
    translateY.value = withSpring(destination, { damping: 50 });
  }, []);

  const context = useSharedValue({ y: 0 }); // to keep context of the previous scroll position
  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      console.log(context.value.y, -height * 5 / 8, event.translationY);
      if (context.value.y <= (-height * 5) / 8 + 30 && event.translationY >= -30) {
        translateY.value = event.translationY + context.value.y; // adding previous scroll position
        translateY.value = Math.max(translateY.value, MAX_TRANSLATE_Y);
      }
    })
    .onEnd((event) => {
      if (event.translationY > gestureOffset) {
        // Swiping Down
        if (context.value.y + (height * 5) / 8 < 10) {
          console.log("1");
          scrollTo(0);
        } else {
          console.log("2");
          scrollTo(context.value.y);
        }
      } else if (event.translationY < -gestureOffset) {
        // Swiping Up
        if (context.value.y + (height * 5) / 8 < 10) {
          // scrollTo(MAX_TRANSLATE_Y);
          console.log("3");
          scrollTo((-height * 5) / 8)
        } else {
          console.log("4");
          scrollTo(context.value.y);
        }
      } else {
        console.log("5")
        // if (context.value.y )
        //   scrollTo(context.value.y);
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

  openAddMenu$.onChange(
    ({ value }) => {
      scrollTo((-height * 5) / 8);
    },
    { initial: false, trackingType: true }
  );
  close.onChange(
    ({ value }: any) => {
      scrollTo(0);
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
          <View style={[styles.gestureArea]}>
            <View style={styles.line} />
          </View>
        </GestureDetector>
        <View style={{ overflow: "hidden" }}>
          <Animated.View style={[animatedStyles]}>
            <View
              style={{ paddingTop: insets.top - 2 * lineMargin - lineHeight }}
            ></View>
            <TouchableOpacity
              onPress={() => scrollTo(0)}
              style={{ alignSelf: "flex-start" }}
            >
              <AntDesign name="close" size={24} color="black" />
            </TouchableOpacity>
          </Animated.View>
          {
            // TODO — Use ...props to import clear functions to clear form when 'close' is pressed
          }
        </View>
        <View style={{ flex: 1 }}>{children}</View>
      </BlurView>
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