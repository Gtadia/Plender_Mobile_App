import React, { useEffect } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text, ScreenView } from "@/components/Themed";
import { observer } from "@legendapp/state/react";
import { AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SettingsCard } from "@/components/SettingsCard";
import { getListTheme } from "@/constants/listTheme";
import { createSettingsListStyles } from "@/constants/listStyles";
import {
  Category$,
  DeletedCategories$,
  DEFAULT_CATEGORY_ID,
  ensureCategoriesHydrated,
  themeTokens$,
} from "@/utils/stateManager";

const withOpacity = (hex: string, opacity: number) => {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const SettingsCategoriesScreen = observer(() => {
  const router = useRouter();
  const { palette, colors, isDark } = themeTokens$.get();
  const listTheme = getListTheme(palette, isDark);
  const listStyles = createSettingsListStyles(listTheme);
  const dividerColor = listTheme.colors.divider;
  const subtext0 = colors.subtext0;

  useEffect(() => {
    void ensureCategoriesHydrated();
  }, []);

  const categories = Category$.get();
  const entries = Object.entries(categories)
    .map(([id, item]) => ({ id: Number(id), ...item }))
    .sort((a, b) => a.id - b.id);

  const handleDelete = (categoryId: number, label: string) => {
    Alert.alert(
      "Delete category?",
      `Delete "${label}"? You can reassign its tasks later.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            DeletedCategories$.assign({ [categoryId]: { label } });
            Category$.set((prev) => {
              const next = { ...prev };
              delete next[categoryId];
              return next;
            });
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <ScreenView style={listStyles.container}>
      <ScreenHeader title="Modify Categories" size="secondary" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={listStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={listStyles.section}>
          <Text style={listStyles.sectionTitle} fontColor="strong">
            Categories
          </Text>
          <SettingsCard style={listStyles.card}>
            {entries.map((entry, index) => {
              const isDefault = entry.id === DEFAULT_CATEGORY_ID;
              return (
                <React.Fragment key={entry.id}>
                  <Pressable
                    style={listStyles.row}
                    onPress={() =>
                      router.push({
                        pathname: "/(tasks)/categoryCreateSheet",
                        params: { editId: String(entry.id) },
                      })
                    }
                  >
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
                      {!isDefault && (
                        <Pressable
                          onPress={() => handleDelete(entry.id, entry.label)}
                          hitSlop={8}
                          style={styles.deleteButton}
                        >
                          <AntDesign name="delete" size={16} color={palette.red} />
                        </Pressable>
                      )}
                      <AntDesign name="right" size={14} color={subtext0} />
                    </View>
                  </Pressable>
                  {index < entries.length - 1 ? (
                    <View style={[listStyles.divider, { backgroundColor: dividerColor }]} />
                  ) : null}
                </React.Fragment>
              );
            })}
            <View style={[listStyles.divider, { backgroundColor: dividerColor }]} />
            <Pressable
              style={listStyles.row}
              onPress={() => router.push("/(tasks)/categoryCreateSheet")}
            >
              <View style={listStyles.rowLeft}>
                <View
                  style={[
                    listStyles.iconBadge,
                    { backgroundColor: withOpacity(colors.accent, 0.14) },
                  ]}
                >
                  <AntDesign name="plus" size={16} color={colors.accent} />
                </View>
                <Text style={listStyles.rowLabel} fontColor="strong">
                  Add Category
                </Text>
              </View>
            </Pressable>
          </SettingsCard>
        </View>
      </ScrollView>
    </ScreenView>
  );
});

export default SettingsCategoriesScreen;

const styles = StyleSheet.create({
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
  },
  deleteButton: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
});
