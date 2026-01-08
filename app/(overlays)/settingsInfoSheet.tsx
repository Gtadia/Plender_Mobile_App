import React, { useEffect } from "react";
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/Themed";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PlatformBlurView } from "@/components/PlatformBlurView";
import { AntDesign } from "@expo/vector-icons";
import { getListTheme } from "@/constants/listTheme";
import { createListSheetStyles } from "@/constants/listStyles";
import { styling$, themeTokens$ } from "@/utils/stateManager";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

const SettingsInfoSheet = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = Dimensions.get("window");
  const translateY = useSharedValue(height);
  const { palette, colors, isDark } = themeTokens$.get();
  const listTheme = getListTheme(palette, isDark);
  const sheetStyles = createListSheetStyles(listTheme);
  const blurEnabled = styling$.tabBarBlurEnabled.get();
  const overlayColor = blurEnabled
    ? isDark
      ? "rgba(255,255,255,0.08)"
      : "rgba(0,0,0,0.35)"
    : palette.base;

  const params = useLocalSearchParams<{ title?: string; body?: string }>();
  const title = params.title ? String(params.title) : "Info";
  const body = params.body ? String(params.body) : "";

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 260 });
  }, [translateY]);

  const closeSheet = () => {
    translateY.value = withTiming(height, { duration: 220 }, (finished) => {
      if (finished) {
        runOnJS(router.back)();
      }
    });
  };

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={sheetStyles.overlay}>
      {blurEnabled ? (
        <PlatformBlurView
          tint={isDark ? "dark" : "light"}
          intensity={40}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]}
      />
      <Pressable style={sheetStyles.background} onPress={closeSheet} />
      <Animated.View
        style={[
          sheetStyles.container,
          {
            height: height * 0.55,
            minHeight: 320,
            backgroundColor: listTheme.colors.row,
            paddingTop: 16,
            paddingBottom: Math.max(24, insets.bottom + 12),
          },
          sheetStyle,
        ]}
      >
        <View style={styles.header}>
          <Pressable
            style={[
              sheetStyles.headerIconButton,
              { backgroundColor: listTheme.colors.card, borderColor: listTheme.colors.divider },
            ]}
            onPress={closeSheet}
          >
            <AntDesign name="close" size={20} color={colors.textStrong} />
          </Pressable>
          <Text style={[styles.title, { color: colors.textStrong }]} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.body, { color: colors.subtext0 }]}>{body}</Text>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

export default SettingsInfoSheet;

const styles = StyleSheet.create({
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
    paddingHorizontal: 12,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
});
