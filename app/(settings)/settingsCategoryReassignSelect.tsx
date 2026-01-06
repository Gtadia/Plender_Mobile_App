import React, { useCallback, useEffect, useRef } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text, ScreenView } from "@/components/Themed";
import { observer } from "@legendapp/state/react";
import { AntDesign } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SettingsCard } from "@/components/SettingsCard";
import { getListTheme } from "@/constants/listTheme";
import { createSettingsListStyles } from "@/constants/listStyles";
import {
  Category$,
  DEFAULT_CATEGORY_ID,
  ensureCategoriesHydrated,
  tasks$,
  themeTokens$,
} from "@/utils/stateManager";
import { getAllEvents, updateEvent } from "@/utils/database";

const SettingsCategoryReassignSelectScreen = observer(() => {
  const router = useRouter();
  const params = useLocalSearchParams<{ sourceId?: string | string[]; sourceLabel?: string }>();
  const sourceIdRaw = params.sourceId;
  const sourceId =
    typeof sourceIdRaw === "string" && sourceIdRaw.trim() !== "" ? Number(sourceIdRaw) : null;
  const sourceLabel = params.sourceLabel ?? "Unknown";
  const { palette, colors, isDark } = themeTokens$.get();
  const listTheme = getListTheme(palette, isDark);
  const listStyles = createSettingsListStyles(listTheme);
  const dividerColor = listTheme.colors.divider;
  const subtext0 = colors.subtext0;
  const busyRef = useRef(false);

  useEffect(() => {
    void ensureCategoriesHydrated();
  }, []);

  const categories = Category$.get();
  const entries = Object.entries(categories)
    .map(([id, item]) => ({ id: Number(id), label: item.label, color: item.color }))
    .filter((entry) => sourceId == null || entry.id !== sourceId)
    .sort((a, b) => a.id - b.id);

  const reassign = useCallback(
    async (targetId: number) => {
      if (sourceId == null || busyRef.current) return;
      busyRef.current = true;
      try {
        const rows = await getAllEvents();
        const matching = rows.filter((row) => row.category === sourceId);
        await Promise.all(
          matching.map((row) => updateEvent({ id: row.id, category: targetId })),
        );
        const entities = tasks$.entities.get();
        Object.values(entities).forEach((task) => {
          if (task.category === sourceId) {
            tasks$.entities[task.id].category.set(targetId);
          }
        });
        router.back();
      } finally {
        busyRef.current = false;
      }
    },
    [router, sourceId],
  );

  const handlePress = (targetId: number, label: string) => {
    if (sourceId == null) return;
    Alert.alert(
      "Reassign tasks?",
      `Move all tasks from "${sourceLabel}" to "${label}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Move", onPress: () => void reassign(targetId) },
      ],
      { cancelable: true },
    );
  };

  return (
    <ScreenView style={listStyles.container}>
      <ScreenHeader title="Move Tasks To" size="secondary" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={listStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={listStyles.section}>
          <Text style={listStyles.sectionTitle} fontColor="strong">
            Select Destination
          </Text>
          <SettingsCard style={listStyles.card}>
            {entries.map((entry, index) => (
              <React.Fragment key={entry.id}>
                <Pressable style={listStyles.row} onPress={() => handlePress(entry.id, entry.label)}>
                  <View style={listStyles.rowLeft}>
                    <View
                      style={[
                        styles.swatch,
                        { backgroundColor: entry.color, borderColor: dividerColor },
                      ]}
                    />
                    <Text style={listStyles.rowLabel} fontColor="strong">
                      {entry.label}
                    </Text>
                  </View>
                  <View style={listStyles.rowRight}>
                    {entry.id === DEFAULT_CATEGORY_ID ? (
                      <Text style={[listStyles.rowValue, { color: subtext0 }]}>Default</Text>
                    ) : null}
                    <AntDesign name="right" size={14} color={subtext0} />
                  </View>
                </Pressable>
                {index < entries.length - 1 ? (
                  <View style={[listStyles.divider, { backgroundColor: dividerColor }]} />
                ) : null}
              </React.Fragment>
            ))}
          </SettingsCard>
        </View>
      </ScrollView>
    </ScreenView>
  );
});

export default SettingsCategoryReassignSelectScreen;

const styles = StyleSheet.create({
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
  },
});
