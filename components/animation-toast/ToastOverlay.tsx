import React from "react";
import { StyleSheet, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { Host } from "react-native-portalize";
import { Toast } from "./components";

const ToastOverlay = () => {
  const isFocused = useIsFocused();
  if (!isFocused) return null;

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <Host>
        <Toast />
      </Host>
    </View>
  );
};

export default ToastOverlay;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
});
