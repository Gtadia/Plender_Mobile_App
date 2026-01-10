import React from "react";
import { Pressable, ScrollView } from "react-native";
import { Text, ScreenView } from "@/components/Themed";
import { observer } from "@legendapp/state/react";
import { useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import { settings$, themeTokens$ } from "@/utils/stateManager";
import { ScreenHeader } from "@/components/ScreenHeader";
import { getListTheme } from "@/constants/listTheme";
import { SettingsCard } from "@/components/SettingsCard";
import { createSelectListStyles } from "@/constants/listStyles";

const options = ["Sunday", "Monday", "Saturday"];

const SettingsWeekStartSelect = observer(() => {
  const router = useRouter();
  const selected = settings$.general.startWeekOn.get();
  const { palette, colors, isDark } = themeTokens$.get();
  const listTheme = getListTheme(palette, isDark);
  const listStyles = createSelectListStyles(listTheme);
  const dividerColor = listTheme.colors.divider;
  const accent = colors.accent;

  return (
    <ScreenView style={listStyles.container}>
      <ScreenHeader title="Start Week On" size="secondary" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={listStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <SettingsCard style={listStyles.card}>
          {options.map((option, index) => {
            const isSelected = option === selected;
            return (
              <Pressable
                key={option}
                style={[
                  listStyles.row,
                  index !== options.length - 1 && listStyles.rowDivider,
                  { borderBottomColor: dividerColor },
                ]}
                onPress={() => settings$.general.startWeekOn.set(option)}
              >
                <Text style={listStyles.rowLabel} fontColor="strong">
                  {option}
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

export default SettingsWeekStartSelect;
