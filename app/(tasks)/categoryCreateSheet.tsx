// -------------------------------------------------------------
// CategoryCreateSheet
// -------------------------------------------------------------
// Purpose:
//   Modal sheet for creating a new category type and assigning it
//   immediately to the current task.
//
// Key points:
//   - Uses a local observable `newCategory$` for name, color, and ID
//   - Color is selected using `reanimated-color-picker` (Panel3)
//   - Name is entered via `$TextInput` (Legend state binding)
//   - On "Done":
//       • Adds new category to global `Category$`
//       • Sets task$.category to the new category
//       • Increments global `CategoryIDCount$`
//   - Modal is presented as a transparent overlay via Expo Router
//
// Notes:
//   - Color picker uses initialHex ref to avoid frame-by-frame re-renders
//   - Category ID is generated from `CategoryIDCount$`
//   - Minimum height for container is 500px, max height ~6/8 screen
// -------------------------------------------------------------

import React, { useEffect } from 'react';
import {
  Alert,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { task$ } from './create';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Memo, useObservable } from '@legendapp/state/react';
import { $TextInput } from '@legendapp/state/react-native';
import { updateEvent } from '@/utils/database';
import { accentKeys, accentOpposites } from '@/constants/themes';
import { getListTheme } from '@/constants/listTheme';
import { createListSheetStyles } from '@/constants/listStyles';
import {
  Category$,
  CategoryIDCount$,
  DEFAULT_CATEGORY_ID,
  DeletedCategories$,
  ensureCategoriesHydrated,
  taskDetailsSheet$,
  styling$,
  themeTokens$,
} from '@/utils/stateManager';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { AntDesign } from "@expo/vector-icons";

export default function CategoryCreateSheet() {
  const router = useRouter();
  const params = useLocalSearchParams<{ editId?: string | string[] }>();
  const editIdRaw = params.editId;
  const editId =
    typeof editIdRaw === "string" && editIdRaw.trim() !== "" ? Number(editIdRaw) : null;
  const isEditing = Number.isFinite(editId);
  const { height } = Dimensions.get("window");
  const translateY = useSharedValue(height);
  const { palette, colors, isDark } = themeTokens$.get();
  const listTheme = getListTheme(palette, isDark);
  const sheetStyles = createListSheetStyles(listTheme);
  const blurEnabled = styling$.tabBarBlurEnabled.get();
  const blurMethod = Platform.OS === "android" ? "dimezisBlurView" : undefined;
  const overlayColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.35)";
  const containerBackground = listTheme.colors.row;
  const rowBackground = listTheme.colors.card;
  const dividerColor = listTheme.colors.divider;
  const textColor = colors.text;
  const subtextColor = colors.subtext0;
  const cardStyle = { backgroundColor: rowBackground, borderColor: dividerColor, borderWidth: 1 };
  const defaultAccentKey = "peach";
  const defaultContrastKey = accentOpposites[defaultAccentKey];
  const paletteOptions = accentKeys.map((accentKey) => {
    const baseColor = (palette as Record<string, string>)[accentKey] ?? colors.accent;
    const contrastKey = accentOpposites[accentKey];
    const contrastColor = (palette as Record<string, string>)[contrastKey] ?? colors.textStrong;
    return { accentKey, baseColor, contrastKey, contrastColor };
  });
  const newCategory$ = useObservable({
    label: '',
    color: (palette as Record<string, string>)[defaultAccentKey] ?? colors.accent,
    contrastColor:
      (palette as Record<string, string>)[defaultContrastKey] ?? colors.textStrong,
    accentKey: defaultAccentKey,
    contrastKey: defaultContrastKey,
  });

  useEffect(() => {
    void ensureCategoriesHydrated();
  }, []);

  useEffect(() => {
    if (!isEditing || editId == null) return;
    const entry = Category$.get()[editId];
    if (!entry) return;
    newCategory$.assign({
      label: entry.label ?? "",
      color: entry.color ?? newCategory$.color.get(),
      accentKey: entry.accentKey ?? defaultAccentKey,
      contrastKey: entry.contrastKey ?? defaultContrastKey,
      contrastColor: entry.contrastColor ?? newCategory$.contrastColor.get(),
    });
  }, [editId, isEditing, newCategory$, defaultAccentKey, defaultContrastKey]);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 260 });
  }, [translateY]);

  const closingRef = React.useRef(false);

  const closeSheet = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    translateY.value = withTiming(height, { duration: 220 });
    setTimeout(() => {
      try {
        if (typeof (router as any).canGoBack === "function") {
          if ((router as any).canGoBack()) {
            router.back();
            return;
          }
        }
        (router as any).back?.();
      } catch (err) {
        console.warn("Failed to close category sheet", err);
        closingRef.current = false;
      }
    }, 230);
  };

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={sheetStyles.overlay}>
      {blurEnabled ? (
        <BlurView
          tint={isDark ? "dark" : "light"}
          intensity={40}
          experimentalBlurMethod={blurMethod}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]}
      />
      <Pressable onPress={closeSheet} style={sheetStyles.background} />
      <Animated.View
        style={[
          sheetStyles.container,
          { height: height * 0.7, minHeight: 460, backgroundColor: containerBackground },
          sheetStyle,
        ]}
      >
        <View style={sheetStyles.header}>
          <TouchableOpacity
            style={[
              sheetStyles.headerIconButton,
              { backgroundColor: listTheme.colors.card, borderColor: dividerColor },
            ]}
            onPress={closeSheet}
          >
            <AntDesign name="close" size={22} color={textColor} />
          </TouchableOpacity>
          <Text style={[sheetStyles.title, { color: textColor }]}>
            {isEditing ? "Edit Category" : "New Category"}
          </Text>
          <TouchableOpacity
            style={[
              sheetStyles.headerIconButton,
              { backgroundColor: colors.accent, borderColor: colors.accent },
            ]}
            onPress={async () => {
              try {
                await ensureCategoriesHydrated();
                const cat = newCategory$.get(); // { label, color, accentKey, contrastColor }

                // (optional) basic validation
                const label = cat.label.trim();
                if (!label) {
                  console.warn("Category name required");
                  return;
                }

                if (isEditing && editId != null) {
                  Category$.assign({
                    [editId]: {
                      label,
                      color: cat.color,
                      accentKey: cat.accentKey,
                      contrastKey: cat.contrastKey,
                      contrastColor: cat.contrastColor,
                    },
                  });
                  closeSheet();
                  return;
                }

                let id = Date.now() * 1000 + Math.floor(Math.random() * 1000);
                while (Object.prototype.hasOwnProperty.call(Category$.get(), id)) {
                  id = Date.now() * 1000 + Math.floor(Math.random() * 1000);
                }

                // 1) Save to global categories (Record<number, {label,color}>)
                Category$.assign({
                  [id]: {
                    label,
                    color: cat.color,
                    accentKey: cat.accentKey,
                    contrastKey: cat.contrastKey,
                    contrastColor: cat.contrastColor,
                  },
                });

                // 2) Assign to current task
                const activeTaskId = taskDetailsSheet$.taskId.get();
                if (activeTaskId != null) {
                  const node = tasks$.entities[activeTaskId];
                  if (node?.category) {
                    node.category.set(id);
                    await updateEvent({ id: activeTaskId, category: id });
                  } else {
                    task$.category.set(id);
                  }
                } else {
                  task$.category.set(id);
                }

                // 3) Increment the ID counter for the next category
                CategoryIDCount$.set(Math.max(CategoryIDCount$.get(), id + 1));

                // close
                closeSheet();
              } catch (err) {
                console.warn("Failed to create category", err);
              }
            }}
          >
            <AntDesign name="check" size={22} color={colors.textStrong} />
          </TouchableOpacity>
        </View>


        <View style={{ maxWidth: 400, paddingHorizontal: 0, alignSelf: 'center', paddingBottom: 72 }}>
          {/* TEXT */}
          <View style={[sheetStyles.subMenuSquare, sheetStyles.subMenuSquarePadding, cardStyle]}>
            <View style={[sheetStyles.subMenuBar, { alignItems: 'center' }]}>
              <Text style={[sheetStyles.menuText, { color: textColor }]}>Name</Text>
            </View>
            <View style={{ paddingVertical: 15}}>
               <$TextInput
                $value={newCategory$.label}
                style={[sheetStyles.textInput, { color: textColor }]}
                autoFocus={true}
                multiline
                placeholder={"Category Name"}
                placeholderTextColor={subtextColor}
              />
            </View>
          </View>
          {/* TEXT */}

          {/* COLOR */}
          <View style={[sheetStyles.subMenuSquare, cardStyle]}>
            <View style={[sheetStyles.subMenuBar, sheetStyles.subMenuSquarePadding, { alignItems: 'center' }]}>
              <Text style={[sheetStyles.menuText, { color: textColor }]}>Color</Text>
              <Memo>
                {() => (
                  <View
                    style={{
                      height: 20,
                      aspectRatio: 1,
                      borderRadius: 100,
                      backgroundColor: newCategory$.color.get(),
                      borderWidth: 1,
                      borderColor: dividerColor,
                    }}
                  />
                )}
              </Memo>
            </View>
            <View style={{ paddingVertical: 12 }}>
              <Memo>
                {() => {
                  const selectedAccent = newCategory$.accentKey.get();
                  return (
                    <View style={styles.paletteGrid}>
                      {paletteOptions.map((option) => (
                        <Pressable
                          key={option.accentKey}
                          onPress={() => {
                            newCategory$.accentKey.set(option.accentKey);
                            newCategory$.contrastKey.set(option.contrastKey);
                            newCategory$.color.set(option.baseColor);
                            newCategory$.contrastColor.set(option.contrastColor);
                          }}
                          style={[
                            sheetStyles.paletteSwatch,
                            {
                              backgroundColor: option.baseColor,
                              borderColor:
                                option.accentKey === selectedAccent
                                  ? colors.accent
                                  : dividerColor,
                              borderWidth: option.accentKey === selectedAccent ? 2 : 1,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  );
                }}
              </Memo>
            </View>
          </View>
          {/* COLOR */}
        </View>

        {isEditing && editId != null && editId !== DEFAULT_CATEGORY_ID ? (
          <Pressable
            onPress={() => {
              Alert.alert(
                "Delete category?",
                "Delete this category? You can reassign its tasks later.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                      DeletedCategories$.assign({ [editId]: { label: newCategory$.label.get() } });
                      Category$.set((prev) => {
                        const next = { ...prev };
                        delete next[editId];
                        return next;
                      });
                      closeSheet();
                    },
                  },
                ],
                { cancelable: true },
              );
            }}
            style={[
              styles.deleteBar,
              { backgroundColor: listTheme.colors.card, borderColor: dividerColor },
            ]}
          >
            <Text style={[sheetStyles.menuText, { color: palette.red }]}>Delete Category</Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  paletteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 18,
  },
  deleteBar: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
});
