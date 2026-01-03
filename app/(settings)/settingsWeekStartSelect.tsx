import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text, ScreenView } from "@/components/Themed";
import { observer } from "@legendapp/state/react";
import { useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import { settings$, themeTokens$ } from "@/utils/stateManager";
import { ScreenHeader } from "@/components/ScreenHeader";
import { horizontalPadding } from "@/constants/globalThemeVar";
import { getListTheme } from "@/constants/listTheme";
import { SettingsCard } from "@/components/SettingsCard";

const options = ["Sunday", "Monday", "Saturday"];

const SettingsWeekStartSelect = observer(() => {
  const router = useRouter();
  const selected = settings$.general.startWeekOn.get();
  const { palette, colors, isDark } = themeTokens$.get();
  const listTheme = getListTheme(palette, isDark);
  const dividerColor = listTheme.colors.divider;
  const accent = colors.accent;

  return (
    <ScreenView style={styles.container}>
      <ScreenHeader title="Start Week On" size="secondary" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <SettingsCard style={styles.card}>
          {options.map((option, index) => {
            const isSelected = option === selected;
            return (
              <Pressable
                key={option}
                style={[
                  styles.row,
                  index !== options.length - 1 && styles.rowDivider,
                  { borderBottomColor: dividerColor },
                ]}
                onPress={() => settings$.general.startWeekOn.set(option)}
              >
                <Text style={styles.rowLabel} fontColor="strong">
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
  rowLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  rowDivider: {
    borderBottomWidth: 1,
  },
});

export default SettingsWeekStartSelect;
