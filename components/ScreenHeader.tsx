import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AntDesign } from "@expo/vector-icons";
import { Text } from "@/components/Themed";
import { colorTheme$ } from "@/utils/stateManager";
import { horizontalPadding } from "@/constants/globalThemeVar";

type HeaderSize = "primary" | "secondary";

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  size?: HeaderSize;
};

export const ScreenHeader = ({ title, onBack, size = "primary" }: ScreenHeaderProps) => {
  const insets = useSafeAreaInsets();
  const iconColor = colorTheme$.colors.subtext0.get();
  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 4,
          marginBottom: size === "primary" ? 6 : 4,
        },
      ]}
    >
      {onBack ? (
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
          <AntDesign name="left" size={18} color={iconColor} />
        </Pressable>
      ) : null}
      <Text style={[styles.title, size === "secondary" && styles.titleSecondary]} fontColor="strong">
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: horizontalPadding,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -4,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  titleSecondary: {
    fontSize: 20,
  },
});
