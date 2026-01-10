import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ScreenView, Text } from "@/components/Themed";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SettingsCard } from "@/components/SettingsCard";
import { getListTheme } from "@/constants/listTheme";
import { createSettingsListStyles } from "@/constants/listStyles";
import { globalTheme } from "@/constants/globalThemeVar";
import { themeTokens$ } from "@/utils/stateManager";
import { observer } from "@legendapp/state/react";

const SupportScreen = observer(() => {
  const { palette, isDark, colors } = themeTokens$.get();
  const listTheme = getListTheme(palette, isDark);
  const listStyles = createSettingsListStyles(listTheme);

  return (
    <ScreenView style={globalTheme.container}>
      <ScreenHeader title="Support" />
      <ScrollView contentContainerStyle={listStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <SettingsCard style={listStyles.card}>
          <Text style={styles.title} fontColor="strong">
            Support Plender
          </Text>
          <Text style={[styles.body, { color: colors.subtext0 }]}>
            Thanks for using Plender. This page will let you support development and keep the app
            improving.
          </Text>
        </SettingsCard>
        <SettingsCard style={listStyles.card}>
          <Text style={styles.subtitle} fontColor="strong">
            What support might look like
          </Text>
          <Text style={[styles.body, { color: colors.subtext0 }]}>
            We can add one‑time tips or a recurring membership option. We’ll confirm the flow and
            pricing before implementing payments.
          </Text>
        </SettingsCard>
      </ScrollView>
    </ScreenView>
  );
});

export default SupportScreen;

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
});
