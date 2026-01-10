import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Text, ScreenView } from "@/components/Themed";
import { observer } from "@legendapp/state/react";
import { useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import { settings$, themeTokens$ } from "@/utils/stateManager";
import { accentKeys } from "@/constants/themes";
import { ScreenHeader } from "@/components/ScreenHeader";
import { getListTheme } from "@/constants/listTheme";
import { SettingsCard } from "@/components/SettingsCard";
import { createSelectListStyles } from "@/constants/listStyles";

const humanize = (value: string) =>
  value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (m) => m.toUpperCase());

const SettingsAccentSelect = observer(() => {
  const router = useRouter();
  const accentKey = settings$.personalization.accent.get();
  const { palette, colors, isDark } = themeTokens$.get();
  const listTheme = getListTheme(palette, isDark);
  const listStyles = createSelectListStyles(listTheme);
  const dividerColor = listTheme.colors.divider;
  const highlight = colors.accent;

  return (
    <ScreenView style={listStyles.container}>
      <ScreenHeader title="Accent Color" size="secondary" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={listStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <SettingsCard style={listStyles.card}>
          {accentKeys.map((key, index) => {
            const color = (palette as Record<string, string>)[key];
            const selected = key === accentKey;
            return (
              <Pressable
                key={key}
                style={[
                  listStyles.row,
                  index !== accentKeys.length - 1 && listStyles.rowDivider,
                  { borderBottomColor: dividerColor },
                ]}
                onPress={() => settings$.personalization.accent.set(key)}
              >
                <View style={listStyles.rowLeft}>
                  <View
                    style={[
                      listStyles.swatch,
                      { backgroundColor: color, borderColor: selected ? highlight : dividerColor },
                    ]}
                  />
                  <Text style={listStyles.rowLabel} fontColor="strong">
                    {humanize(key)}
                  </Text>
                </View>
                {selected ? <AntDesign name="check" size={16} color={highlight} /> : null}
              </Pressable>
            );
          })}
        </SettingsCard>
      </ScrollView>
    </ScreenView>
  );
});

export default SettingsAccentSelect;
