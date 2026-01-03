import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text, ScreenView } from "@/components/Themed";
import { observer } from "@legendapp/state/react";
import { useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import { colorTheme$, settings$ } from "@/utils/stateManager";
import { ScreenHeader } from "@/components/ScreenHeader";
import { horizontalPadding } from "@/constants/globalThemeVar";

const withOpacity = (hex: string, opacity: number) => {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const options = ["Sunday", "Monday", "Saturday"];

const SettingsWeekStartSelect = observer(() => {
  const router = useRouter();
  const selected = settings$.general.startWeekOn.get();
  const subtext0 = colorTheme$.colors.subtext0.get();
  const surface0 = colorTheme$.colors.surface0.get();
  const surface2 = colorTheme$.colors.surface2.get();
  const cardTint = colorTheme$.nativeTheme.dark.get()
    ? withOpacity(surface2, 0.4)
    : withOpacity(surface0, 0.6);
  const dividerColor = withOpacity(subtext0, 0.18);
  const accent = colorTheme$.colors.accent.get();

  return (
    <ScreenView style={styles.container}>
      <ScreenHeader title="Start Week On" size="secondary" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: cardTint, borderColor: dividerColor }]}>
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
        </View>
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

export default SettingsWeekStartSelect;
