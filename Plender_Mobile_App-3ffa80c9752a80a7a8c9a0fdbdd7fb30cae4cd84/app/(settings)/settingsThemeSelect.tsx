import React from "react";
import { Pressable, ScrollView } from "react-native";
import { Text, ScreenView } from "@/components/Themed";
import { observer } from "@legendapp/state/react";
import { useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import { settings$, themeTokens$ } from "@/utils/stateManager";
import { themeOptions } from "@/constants/themes";
import { ScreenHeader } from "@/components/ScreenHeader";
import { getListTheme } from "@/constants/listTheme";
import { SettingsCard } from "@/components/SettingsCard";
import { createSelectListStyles } from "@/constants/listStyles";

const SettingsThemeSelect = observer(() => {
  const router = useRouter();
  const selected = settings$.personalization.theme.get();
  const { palette, colors, isDark } = themeTokens$.get();
  const listTheme = getListTheme(palette, isDark);
  const listStyles = createSelectListStyles(listTheme);
  const dividerColor = listTheme.colors.divider;
  const accent = colors.accent;

  return (
    <ScreenView style={listStyles.container}>
      <ScreenHeader title="Select Theme" size="secondary" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={listStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <SettingsCard style={listStyles.card}>
          {themeOptions.map((option, index) => {
            const isSelected = option.key === selected;
            return (
              <Pressable
                key={option.key}
                style={[
                  listStyles.row,
                  index !== themeOptions.length - 1 && listStyles.rowDivider,
                  { borderBottomColor: dividerColor },
                ]}
                onPress={() => settings$.personalization.theme.set(option.key)}
              >
                <Text style={listStyles.rowLabel} fontColor="strong">
                  {option.label}
                </Text>
                {isSelected ? <AntDesign name="check" size={16} color={accent} /> : null}
              </Pressable>
            );
          })}
        </SettingsCard>
      </ScrollView>
    </ScreenView>
  );
});

export default SettingsThemeSelect;
