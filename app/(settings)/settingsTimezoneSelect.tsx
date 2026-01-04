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

const fallbackTimezones = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Singapore",
  "Australia/Sydney",
];

const resolveTimezones = () => {
  if (typeof Intl.supportedValuesOf === "function") {
    try {
      const list = Intl.supportedValuesOf("timeZone");
      if (list?.length) return list;
    } catch (err) {
      return fallbackTimezones;
    }
  }
  return fallbackTimezones;
};

const SettingsTimezoneSelect = observer(() => {
  const router = useRouter();
  const selected = settings$.general.timezone.get();
  const { palette, colors, isDark } = themeTokens$.get();
  const listTheme = getListTheme(palette, isDark);
  const listStyles = createSelectListStyles(listTheme);
  const dividerColor = listTheme.colors.divider;
  const accent = colors.accent;
  const timezones = resolveTimezones();

  return (
    <ScreenView style={listStyles.container}>
      <ScreenHeader title="Timezone" size="secondary" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={listStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <SettingsCard style={listStyles.card}>
          {timezones.map((tz, index) => {
            const isSelected = tz === selected;
            return (
              <Pressable
                key={tz}
                style={[
                  listStyles.row,
                  index !== timezones.length - 1 && listStyles.rowDivider,
                  { borderBottomColor: dividerColor },
                ]}
                onPress={() => {
                  settings$.general.timezone.set(tz);
                }}
              >
                <Text style={listStyles.rowLabel} fontColor="strong">
                  {tz}
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

export default SettingsTimezoneSelect;
