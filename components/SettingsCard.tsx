import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { observer } from "@legendapp/state/react";
import { getListTheme } from "@/constants/listTheme";
import { themeTokens$ } from "@/utils/stateManager";

type SettingsCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  borderWidth?: number;
};

export const SettingsCard = observer(({ children, style, borderWidth = 1 }: SettingsCardProps) => {
  const { palette, isDark } = themeTokens$.get();
  const listTheme = getListTheme(palette, isDark);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: listTheme.colors.card,
          borderColor: listTheme.colors.divider,
          borderWidth,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {},
});
