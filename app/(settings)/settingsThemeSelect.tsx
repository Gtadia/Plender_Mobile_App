import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text, ScreenView } from "@/components/Themed";
import { observer } from "@legendapp/state/react";
import { useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import { settings$, themeTokens$ } from "@/utils/stateManager";
import { themeOptions } from "@/constants/themes";
import { ScreenHeader } from "@/components/ScreenHeader";
import { horizontalPadding } from "@/constants/globalThemeVar";

const withOpacity = (hex: string | undefined, opacity: number) => {
  if (!hex) return "rgba(0,0,0,0)";
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const SettingsThemeSelect = observer(() => {
  const router = useRouter();
  const selected = settings$.personalization.theme.get();
  const { palette, colors, isDark } = themeTokens$.get();
  const subtext0 = palette.subtext0;
  const surface0 = palette.surface0;
  const surface2 = palette.surface2;
  const cardTint = isDark
    ? withOpacity(surface2, 0.4)
    : withOpacity(surface0, 0.6);
  const dividerColor = withOpacity(subtext0, 0.18);
  const accent = colors.accent;

  return (
    <ScreenView style={styles.container}>
      <ScreenHeader title="Select Theme" size="secondary" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: cardTint, borderColor: dividerColor }]}>
          {themeOptions.map((option, index) => {
            const isSelected = option.key === selected;
            return (
              <Pressable
                key={option.key}
                style={[
                  styles.row,
                  index !== themeOptions.length - 1 && styles.rowDivider,
                  { borderBottomColor: dividerColor },
                ]}
                onPress={() => settings$.personalization.theme.set(option.key)}
              >
                <Text style={styles.rowLabel} fontColor="strong">
                  {option.label}
                </Text>
                {isSelected ? <AntDesign name="check" size={16} color={accent} /> : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </ScreenView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
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
    borderWidth: 1,
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

export default SettingsThemeSelect;
