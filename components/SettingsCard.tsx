import React from "react";
import { View, type ViewStyle } from "react-native";
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
  const { settings } = listTheme.layout;

  return (
    <View
      style={[
        {
          backgroundColor: listTheme.colors.card,
          borderColor: listTheme.colors.divider,
          borderWidth,
          borderRadius: settings.cardRadius,
          paddingVertical: settings.cardPaddingVertical,
          paddingHorizontal: settings.cardPaddingHorizontal,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
});
