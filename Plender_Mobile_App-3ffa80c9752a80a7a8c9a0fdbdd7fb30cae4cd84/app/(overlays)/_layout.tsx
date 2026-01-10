import React from "react";
import { Stack } from "expo-router";

export default function OverlaysLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "transparentModal",
        animation: "fade",
        contentStyle: { backgroundColor: "transparent" },
      }}
    />
  );
}
