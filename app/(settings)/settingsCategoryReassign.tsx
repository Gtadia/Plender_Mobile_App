import React, { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text, ScreenView } from "@/components/Themed";
import { observer } from "@legendapp/state/react";
import { AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SettingsCard } from "@/components/SettingsCard";
import { getListTheme } from "@/constants/listTheme";
import { createSettingsListStyles } from "@/constants/listStyles";
import {
  Category$,
  DEFAULT_CATEGORY_ID,
  NO_CATEGORY_ID,
  ensureCategoriesHydrated,
  themeTokens$,
} from "@/utils/stateManager";
import { getAllEvents } from "@/utils/database";

type CategoryCount = { id: number; label: string; count: number; color?: string };

const SettingsCategoryReassignScreen = observer(() => {
  const router = useRouter();
  const { palette, colors, isDark } = themeTokens$.get();
  const listTheme = getListTheme(palette, isDark);
  const listStyles = createSettingsListStyles(listTheme);
  const dividerColor = listTheme.colors.divider;
  const subtext0 = colors.subtext0;
  const [counts, setCounts] = useState<Record<number, number>>({});

  const refreshCounts = useCallback(async () => {
    const rows = await getAllEvents();
    const next: Record<number, number> = {};
    rows.forEach((row) => {
      next[row.category] = (next[row.category] ?? 0) + 1;
    });
    setCounts(next);
  }, []);

  useEffect(() => {
    void ensureCategoriesHydrated();
    void refreshCounts();
  }, [refreshCounts]);

  useFocusEffect(
    useCallback(() => {
      void refreshCounts();
      return () => {};
    }, [refreshCounts]),
  );

  const categories = Category$.get();
  const existingEntries: CategoryCount[] = Object.entries(categories)
    .map(([id, item]) => ({
      id: Number(id),
      label: item.label,
      color: item.color,
      count: counts[Number(id)] ?? 0,
    }))
    .sort((a, b) => a.id - b.id);

  const deletedIds = Object.keys(counts)
    .map(Number)
    .filter((id) => !Object.prototype.hasOwnProperty.call(categories, id));
  const deletedEntries: CategoryCount[] = deletedIds.map((id) => ({
    id,
    label: id === NO_CATEGORY_ID ? "Unknown" : `Unknown (ID ${id})`,
    count: counts[id] ?? 0,
  }));

  const renderRow = (entry: CategoryCount, showDivider: boolean) => (
    <React.Fragment key={entry.id}>
      <Pressable
        style={listStyles.row}
        onPress={() =>
          router.push({
            pathname: "/(settings)/settingsCategoryReassignSelect",
            params: { sourceId: String(entry.id), sourceLabel: entry.label },
          })
        }
      >
        <View style={listStyles.rowLeft}>
          {entry.color ? (
            <View
              style={[
                styles.swatch,
                { backgroundColor: entry.color, borderColor: dividerColor },
              ]}
            />
          ) : (
            <View style={[styles.swatch, { borderColor: dividerColor }]} />
          )}
          <Text style={listStyles.rowLabel} fontColor="strong">
            {entry.label}
          </Text>
        </View>
        <View style={listStyles.rowRight}>
          <Text style={[listStyles.rowValue, { color: subtext0 }]}>
            {entry.count}
          </Text>
          <AntDesign name="right" size={14} color={subtext0} />
        </View>
      </Pressable>
      {showDivider ? (
        <View style={[listStyles.divider, { backgroundColor: dividerColor }]} />
      ) : null}
    </React.Fragment>
  );

  return (
    <ScreenView style={listStyles.container}>
      <ScreenHeader title="Reassign Categories" size="secondary" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={listStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={listStyles.section}>
          <Text style={listStyles.sectionTitle} fontColor="strong">
            Current Categories
          </Text>
          <SettingsCard style={listStyles.card}>
            {existingEntries.map((entry, index) =>
              renderRow(entry, index < existingEntries.length - 1),
            )}
          </SettingsCard>
        </View>
        {deletedEntries.length ? (
          <View style={listStyles.section}>
            <Text style={listStyles.sectionTitle} fontColor="strong">
              Deleted Categories
            </Text>
            <SettingsCard style={listStyles.card}>
              {deletedEntries.map((entry, index) =>
                renderRow(entry, index < deletedEntries.length - 1),
              )}
            </SettingsCard>
          </View>
        ) : null}
        <View style={listStyles.section}>
          <Text style={[styles.helperText, { color: subtext0 }]}>
            Tap a category to move all its tasks into another category.
          </Text>
        </View>
      </ScrollView>
    </ScreenView>
  );
});

export default SettingsCategoryReassignScreen;

const styles = StyleSheet.create({
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
