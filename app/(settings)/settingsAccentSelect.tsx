import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text, ScreenView } from "@/components/Themed";
import { observer } from "@legendapp/state/react";
import { useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import { settings$, themeTokens$ } from "@/utils/stateManager";
import { accentKeys } from "@/constants/themes";
import { ScreenHeader } from "@/components/ScreenHeader";
import { horizontalPadding } from "@/constants/globalThemeVar";
import { getListTheme } from "@/constants/listTheme";
import { SettingsCard } from "@/components/SettingsCard";

const humanize = (value: string) =>
  value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (m) => m.toUpperCase());

const SettingsAccentSelect = observer(() => {
  const router = useRouter();
  const accentKey = settings$.personalization.accent.get();
  const { palette, colors, isDark } = themeTokens$.get();
  const listTheme = getListTheme(palette, isDark);
  const dividerColor = listTheme.colors.divider;
  const highlight = colors.accent;

  return (
    <ScreenView style={styles.container}>
      <ScreenHeader title="Accent Color" size="secondary" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <SettingsCard style={styles.card}>
          {accentKeys.map((key, index) => {
            const color = (palette as Record<string, string>)[key];
            const selected = key === accentKey;
            return (
              <Pressable
                key={key}
                style={[
                  styles.row,
                  index !== accentKeys.length - 1 && styles.rowDivider,
                  { borderBottomColor: dividerColor },
                ]}
                onPress={() => settings$.personalization.accent.set(key)}
              >
                <View style={styles.rowLeft}>
                  <View
                    style={[
                      styles.swatch,
                      { backgroundColor: color, borderColor: selected ? highlight : dividerColor },
                    ]}
                  />
                  <Text style={styles.rowLabel} fontColor="strong">
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: horizontalPadding,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  rowDivider: {
    borderBottomWidth: 1,
  },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
});

export default SettingsAccentSelect;
