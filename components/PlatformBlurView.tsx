import React from "react";
import { Platform, View, ViewProps, ViewStyle } from "react-native";
import { BlurView as ExpoBlurView } from "expo-blur";
import { BlurView as RNBlurView } from "@react-native-community/blur";

type PlatformBlurViewProps = {
  intensity?: number;
  tint?: "light" | "dark" | "default";
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
} & Pick<ViewProps, "pointerEvents">;

const mapTint = (tint?: "light" | "dark" | "default") => {
  if (tint === "dark") return "dark";
  if (tint === "light") return "light";
  return "light";
};

export const PlatformBlurView = ({
  intensity = 40,
  tint = "light",
  style,
  children,
  pointerEvents,
}: PlatformBlurViewProps) => {
  if (Platform.OS === "android") {
    return (
      <View style={style} pointerEvents={pointerEvents}>
        {children}
      </View>
    );
  }

  return (
    <ExpoBlurView intensity={intensity} tint={tint} style={style} pointerEvents={pointerEvents}>
      {children}
    </ExpoBlurView>
  );
};
