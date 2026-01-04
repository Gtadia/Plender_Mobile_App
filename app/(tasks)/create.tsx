// -------------------------------------------------------------
// Task Create Sheet
// -------------------------------------------------------------
// Purpose:
//   Modal-like screen for creating a task with title, description,
//   date/recurrence (RRule), time goal, and category selection.
//
// Key bits:
//   - Global observable state: `task$` (Legend State)
//   - CategoryPopup: floating selector that shifts with keyboard
//   - Actions row: date, time goal, category, and submit button
//
// Notes:
//   - Styling centralized in `styles` where possible to reduce inline clutter
//   - Kept all imports and logic exactly the same (no behavior changes)
//   - Added explanatory comments around non-obvious chunks
// -------------------------------------------------------------

import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React from "react";
import { useNavigation, useRouter } from "expo-router";
import { $TextInput } from "@legendapp/state/react-native";
import { observable } from "@legendapp/state";
import { ScrollView } from "react-native-gesture-handler";
import {
  AntDesign,
  Entypo,
  FontAwesome6,
  MaterialIcons,
} from "@expo/vector-icons";
import { Memo, Show } from "@legendapp/state/react";
import moment from "moment";
import { RRule } from "rrule";
import { Category$, loadDay, styling$, tasks$, themeTokens$ } from "@/utils/stateManager";
import { getListTheme } from "@/constants/listTheme";
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { time$ } from "./timeGoalSelectSheet";
import { Toast } from "@/components/animation-toast/components";
import { toastShow$ } from "@/components/animation-toast/toastStore";
import { clearEvents, createEvent, getEventsForDate } from "@/utils/database";
import { useFocusEffect } from "@react-navigation/native";
import { BlurView } from "expo-blur";

interface categoryItem {
  label: string;
  color: string;
  id: number;
}

const withOpacity = (hex: string, opacity: number) => {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// -------------------------------------------------------------
// Global observable state for the new task
// No defaults; we apply fallbacks on submit if fields are empty
// -------------------------------------------------------------
const todayRRule = () => {
  const dtstart = moment().startOf("day").toDate();
  return new RRule({
    freq: RRule.DAILY,
    count: 1,
    dtstart,
  });
};

export const task$ = observable({
  title: "",
  description: "",
  category: null as number | null,
  rrule: null as RRule | null,
  isRepeating: false,
  timeGoal: 0,
});

// Popup open/close flag for category selector
const categoryPopup$ = observable(false);

// -------------------------------------------------------------
// CategoryPopup
// - Absolute-positioned card that lists categories
// - Follows keyboard using Reanimated v3 `useAnimatedKeyboard`
// -------------------------------------------------------------
const CategoryPopup = ({
  width = 250,
  position = { bottom: 145, left: 25 },
}: {
  width?: number;
  position?: { bottom?: number; left?: number; right?: number; top?: number };
}) => {
  const router = useRouter();
  const { palette, colors, isDark } = themeTokens$.get();
  const listTheme = getListTheme(palette, isDark);
  const mutedText = colors.subtext0;
  const cardBorder = listTheme.colors.divider;

  // Localized styles for the popup card
  const categoryStyles = StyleSheet.create({
    card: {
      backgroundColor: listTheme.colors.card,
      borderRadius: 10,
      paddingHorizontal: 18,
      paddingVertical: 10,
      maxHeight: 320,
      borderWidth: 1,
      borderColor: cardBorder,
      // shadow
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 10,
    },
    list: { paddingVertical: 0 },
    row: {
      paddingVertical: 4,
      justifyContent: "flex-start",
      alignItems: 'center',
      flexDirection: 'row',
    },
    label: { fontSize: 16, color: colors.text },
    createCategory: {
      flexDirection: "row",
      alignContent: "center",
      justifyContent: "flex-start",
    },
  });

  // Keyboard-aware positioning
  const { height, state } = useAnimatedKeyboard(); // RNR v3
  const insets = useSafeAreaInsets();
  const baseBottom = position.bottom || 145;

  const style = useAnimatedStyle(() => {
    const kb = Math.max(0, height.value);
    return { bottom: withTiming(baseBottom + kb, { duration: 40 }) };
  });

  return (
    <Animated.View
      style={[style, { width, position: "absolute", ...position }]}
    >
      <Show if={categoryPopup$} else={<></>}>
        {() => (
          <View style={categoryStyles.card}>
            <ScrollView
              bounces={true}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={categoryStyles.list}
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps={"always"}
            >
              <Memo>
  {() => {
    type CategoryItem = { label: string; color: string };
    const entries = Object.entries(Category$.get()) as [string, CategoryItem][];

    return (
      <>
        {entries.map(([idStr, item]) => {
          const id = Number(idStr) as number;
          return (
            <View key={id} nativeID={`category-${id}`}>
              <TouchableOpacity
                style={categoryStyles.row}
                onPress={() => {
                  task$.category.set(Number(idStr))
                  categoryPopup$.set((prev) => !prev);
                }}
              >
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.color, marginRight: 8 }} />
                <Text style={categoryStyles.label}>{item.label}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </>
    );
  }}
</Memo>

              {/* Create new category entry */}
              <TouchableOpacity
                key={-1}
                style={[
                  categoryStyles.row,
                  categoryStyles.createCategory,
                  { marginTop: 1 },
                ]}
                onPress={() => {
                  console.log("Creating a new Cateogry");
                  router.push("/(tasks)/categoryCreateSheet");
                }}
              >
                {/* <View> */}
                <AntDesign
                  name="addfile"
                  size={16}
                  color={mutedText}
                />
                <Text style={[categoryStyles.label, { marginLeft: 5, color: mutedText }]}>
                  Add Category
                </Text>
                {/* </View> */}
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </Show>
    </Animated.View>
  );
};

// -------------------------------------------------------------
// Main "create" screen component
// - Overlay background dismisses via outside press
// - KeyboardAvoidingView to lift content on iOS
// - ScrollView is disabled (height is driven by content)
// -------------------------------------------------------------
const create = () => {
  const navigation = useNavigation();
  const router = useRouter();
  let { height } = Dimensions.get("window");
  const titleRef = React.useRef<any>(null);
  const { palette, colors, isDark } = themeTokens$.get();
  const listTheme = getListTheme(palette, isDark);
  const blurEnabled = styling$.tabBarBlurEnabled.get();
  const insets = useSafeAreaInsets();
  const blurMethod = Platform.OS === "android" ? "dimezisBlurView" : undefined;
  const overlayColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.35)";
  const actionBorder = withOpacity(palette.overlay0, isDark ? 0.5 : 0.35);
  const actionTextColor = colors.subtext0;
  const cardBackground = listTheme.colors.card;
  const sheetRadius = listTheme.layout.sheet.topRadius;
  const submitBackground = colors.accent;
  const submitIconColor = colors.textStrong;
  const dateAccent = palette.green;
  const timeAccent = palette.red;

  // Keep keyboard visible by refocusing the title when it hides
  React.useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidHide", () => {
      titleRef.current?.focus?.();
    });
    return () => sub.remove();
  }, []);

  return (
    <View style={styles.overlay}>
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
      <TouchableWithoutFeedback
        onPress={Keyboard.dismiss}
        accessible={false}
        style={styles.transparentFlex}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.background}
        />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "position"}
        keyboardVerticalOffset={Platform.OS === "android" ? insets.bottom + 24 : 0}
        style={styles.kav}
      >
        <ScrollView
          keyboardShouldPersistTaps={"always"}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Card container */}
          <View
            style={[
              styles.cardContainer,
              {
                backgroundColor: cardBackground,
                borderTopLeftRadius: sheetRadius,
                borderTopRightRadius: sheetRadius,
              },
            ]}
          >
            {/* Title */}
            <$TextInput
              $value={task$.title}
              style={[styles.textInput, { color: colors.text }]}
              autoFocus={true}
              multiline
              placeholder={"Task Name"}
              placeholderTextColor={colors.subtext1}
              ref={titleRef}
            />

            {/* Description */}
            <$TextInput
              $value={task$.description}
              style={[styles.textInput, styles.description, { color: colors.text }]}
              multiline
              placeholder="Description"
              placeholderTextColor={colors.subtext1}
            />

            {/* Actions row: date, time goal, category + submit */}
            <View style={styles.actionRow}>
              <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps={"always"}
              >
                <View style={styles.actions}>
                  {/* Date / Recurrence */}
                  <TouchableOpacity
                    style={[styles.actionButton, { borderColor: actionBorder }]}
                    onPress={() => {
                      router.push("/(tasks)/dateSelectSheet");
                    }}
                  >
                    <Memo>
                      {() => {
                        if (task$.rrule.get())
                          return (
                            <>
                              {/* Catppuccin Latte Green */}
                              <AntDesign
                                name="calendar"
                                size={15}
                                color={dateAccent}
                              />
                              <Text
                                style={[
                                  styles.actionText,
                                  { color: dateAccent },
                                ]}
                              >
                                {moment(task$.rrule.get().DTSTART).format(
                                  "MMM D YYYY"
                                )}
                              </Text>
                              {(() => {
                                return task$.isRepeating.get() ? (
                                  <AntDesign
                                    name="retweet"
                                    size={15}
                                    color={dateAccent}
                                  />
                                ) : null;
                              })()}
                            </>
                          );

                        // else (no date set)
                        return (
                          <>
                            <AntDesign
                              name="calendar"
                              size={15}
                              color={actionTextColor}
                            />
                            <Text style={[styles.actionText, { color: actionTextColor }]}>Date</Text>
                          </>
                        );
                      }}
                    </Memo>
                  </TouchableOpacity>

                  {/* Time Goal */}
                  <TouchableOpacity
                    style={[styles.actionButton, { borderColor: actionBorder }]}
                    onPress={() => {
                      router.push("/(tasks)/timeGoalSelectSheet");
                    }}
                  >
                    <Memo>
                      {() => {
                        if (task$.timeGoal.get())
                          return (
                            <>
                              <AntDesign
                                name="clockcircleo"
                                size={15}
                                color={timeAccent}
                              />
                              <Text
                                style={[
                                  styles.actionText,
                                  { color: timeAccent },
                                ]}
                              >{`${time$.hours.get()}:${
                                time$.minutes.get() < 10 ? "0" : ""
                              }${time$.minutes.get()}`}</Text>
                            </>
                          );
                        return (
                          <>
                            <AntDesign
                              name="clockcircleo"
                              size={15}
                              color={actionTextColor}
                            />
                            <Text style={[styles.actionText, { color: actionTextColor }]}>Time Goal</Text>
                          </>
                        );
                      }}
                    </Memo>
                  </TouchableOpacity>

                  {/* Category */}
                  <TouchableOpacity
                    style={[styles.actionButton, { borderColor: actionBorder }]}
                    onPress={() => {
                      categoryPopup$.set((prev) => !prev);
                      console.log(categoryPopup$.get());
                    }}
                  >
                    <Memo>
                      {() => {
                        if (task$.category.get()) {
                          return (
                            <>
                              <AntDesign
                                name="flag"
                                size={15}
                                color={Category$[task$.category.get()].color.get()}
                              />
                              <Text
                                style={[
                                  styles.actionText,
                                  {
                                    color: Category$[task$.category.get()].color.get(),
                                    maxWidth: 120,
                                  },
                                ]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {Category$[task$.category.get()].label.get()}
                              </Text>
                            </>
                          );
                        }
                        return (
                          <>
                            <AntDesign
                              name="flag"
                              size={15}
                              color={actionTextColor}
                            />
                            <Text style={[styles.actionText, { color: actionTextColor }]}>Category</Text>
                          </>
                        );
                      }}
                    </Memo>
                  </TouchableOpacity>

                  {/* Placeholder for "More" options in future */}
                  {/* <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
                    <MaterialIcons name="more-horiz" size={15} color={actionTextColor} />
                  </TouchableOpacity> */}
                </View>
              </ScrollView>

              {/* Submit button (currently logs; TODO hook to DB) */}
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: submitBackground }]}
                onPress={async () => {
                  const ok = await addToDatabase();
                  if (ok && toastShow$.whereToDisplay.get() === 0) {
                    navigation.goBack();
                  }
                }}
              >
                <Entypo name="arrow-up" size={20} color={submitIconColor} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Floating category selector */}
        <CategoryPopup />
      </KeyboardAvoidingView>
      {/* Toast Menu */}
      {/* { toastShow$.whereToDisplay.get() == 1 && <Toast />} */}
      <Toast />
    </View>
  );
};

const addToDatabase = async () => {
  // Apply defaults only when empty
  let rrule = task$.rrule.get();
  if (!rrule) {
    rrule = todayRRule();
    task$.rrule.set(rrule);
  }
  let timeGoal = task$.timeGoal.get();
  if (!timeGoal || timeGoal <= 0) {
    timeGoal = 3600;
    task$.timeGoal.set(3600);
  }
  let category = task$.category.get();
  if (category === undefined || category === null || category < 0) {
    category = 0;
    task$.category.set(0);
  }

  const title = task$.title.get()?.trim() ?? "";
  if (!title) {
    toastShow$.set(({ toggleFire }) => ({
      type: "error",
      title: "Name is missing",
      description: "Please enter a task name.",
      toggleFire: !toggleFire,
      whereToDisplay: 1,
    }));
    return;
  }

  const formatRemaining = (seconds: number) => {
    const safe = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    return parts.join(" ");
  };

  const isRepeatingRule = (rruleToCheck: RRule | null) => {
    if (!rruleToCheck) return false;
    const options = rruleToCheck.options;
    if (options.count && options.count > 1) return true;
    if (options.interval && options.interval > 1) return true;
    if (options.byweekday && options.byweekday.length) return true;
    if (options.until && options.dtstart && options.until.getTime() !== options.dtstart.getTime()) {
      return true;
    }
    return false;
  };

  const targetDate =
    rrule?.options?.dtstart instanceof Date
      ? rrule.options.dtstart
      : new Date();
  const existing = await getEventsForDate(targetDate);
  const existingGoal = existing.reduce((sum, task) => sum + (task.timeGoal ?? 0), 0);
  const daySeconds = 24 * 60 * 60;
  const remainingSeconds = daySeconds - existingGoal;
  if (timeGoal > remainingSeconds) {
    const remainingLabel = formatRemaining(remainingSeconds);
    toastShow$.set(({ toggleFire }) => ({
      type: "error",
      title: "Not enough time left",
      description: `Only ${remainingLabel} remaining on ${moment(targetDate).format("MMM D")}.`,
      toggleFire: !toggleFire,
      whereToDisplay: 1,
    }));
    return false;
  }
  if (!isRepeatingRule(rrule) && moment(targetDate).isSame(moment(), "day")) {
    const remainingLabel = formatRemaining(remainingSeconds);
    toastShow$.set(({ toggleFire }) => ({
      type: "warning",
      title: "Time left today",
      description: `${remainingLabel} remaining for today.`,
      toggleFire: !toggleFire,
      whereToDisplay: 1,
    }));
  }

  const submitTask = {
    title,
    description: task$.description.get(),
    category,
    rrule,
    timeGoal,
  };

  const task = {
    title: submitTask.title,
    rrule: submitTask.rrule.toString(),
    category: submitTask.category,
    timeGoal: submitTask.timeGoal,
    description: submitTask.description,
  };

  try {
    await createEvent(task);
    const target = new Date(submitTask.rrule.options.dtstart);
    await loadDay(target);
    task$.set({
      title: "",
      description: "",
      category: null,
      rrule: null,
      isRepeating: false,
      timeGoal: 0,
    });
    toastShow$.set(({ toggleFire }) => ({
      type: "success",
      title: "Task Created",
      description: "",
      toggleFire: !toggleFire,
      whereToDisplay: 0,
    }));
    return true;
  } catch (err) {
    console.error("Failed to create task: ", err);
    toastShow$.set(({ toggleFire }) => ({
      type: "error",
      title: "Create failed",
      description: "Could not save task.",
      toggleFire: !toggleFire,
      whereToDisplay: 1,
    }));
    return false;
  }
};

// title,
// rrule = '',
// category = 0,
// timeGoal = 3600, // 1 hour in seconds
// timeSpent = 0,
// percentComplete = 0,
// description = '',

//   title: string;
// startDate: string; // 'YYYY-MM-DDTHH:mm:ss'
// rrule?: string;     // e.g., 'FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=2025-12-31'
// category?: number;
// timeGoal?: number;
// timeSpent?: number;
// percentComplete?: number;
// description?: string;

export default create;

// -------------------------------------------------------------
// Styles
// -------------------------------------------------------------
const styles = StyleSheet.create({
  // Full-screen darkened overlay behind the sheet
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },

  // Transparent flex filler (used on TouchableWithoutFeedback wrapper)
  transparentFlex: {
    backgroundColor: "transparent",
    flex: 1,
  },

  // Click target to dismiss (routes back)
  background: {
    backgroundColor: "transparent",
    flex: 1,
  },

  // KeyboardAvoidingView container
  kav: {
    bottom: 0,
    position: "relative",
    backgroundColor: "transparent",
  },

  // The card body holding inputs and actions
  cardContainer: {
    height: "auto",
    maxWidth: 500,
    borderRadius: 0,
    padding: 15,
  },

  // (Unused here, but kept intentionally to avoid functional changes)
  blurView: {
    // height: 'auto',
    minHeight: 300,
    width: "100%",
    position: "absolute",
    bottom: 0,
    zIndex: 1000,
    elevation: 10,
    // borderTopLeftRadius: 30,
    // borderTopRightRadius: 30,
  },

  // Inputs
  textInput: {
    fontSize: 18,
    fontWeight: 500 as any, // keep as-is; typed constant as in original
  },
  fullTextInput: {
    maxWidth: 400,
    marginHorizontal: 20,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#343434",
  },
  description: {
    fontSize: 15,
    fontWeight: 400 as any,
    minHeight: 35,
    marginBottom: 15,
  },

  // Actions row (left scroll of chips + right submit button)
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignContent: "center",
    marginBottom: 0,
  },

  // Action chips container
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Single action chip
  actionButton: {
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    padding: 8,
    alignItems: "center",
    marginRight: 10,
  },

  // Chip text
  actionText: {
    fontSize: 13,
    fontWeight: 500 as any,
    paddingHorizontal: 5,
  },

  // Submit (arrow) button
  submitButton: {
    borderRadius: 100,
    aspectRatio: 1,
    width: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});
