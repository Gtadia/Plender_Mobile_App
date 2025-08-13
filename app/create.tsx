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
import dayjs from "dayjs";
import { RRule } from "rrule";
import { Category$ } from "@/utils/stateManager";
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

interface categoryItem {
  label: string;
  color: string;
  id: number;
}

// -------------------------------------------------------------
// Global observable state for the new task
// -------------------------------------------------------------
export const task$ = observable({
  title: "",
  description: "",
  category: { label: "", color: "rgba(255, 0, 0, 1)", id: 0 },
  rrule: null,
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

  // Localized styles for the popup card
  const categoryStyles = StyleSheet.create({
    card: {
      backgroundColor: "white",
      borderRadius: 10,
      paddingHorizontal: 18,
      paddingVertical: 10,
      maxHeight: 320,
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
      justifyContent: "center",
    },
    label: { fontSize: 16, color: "#111" },
    createCategory: {
      flexDirection: "row",
      alignItems: "center",
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
              {Category$.get().map((item, index) => (
                <View key={item.id}>
                  <TouchableOpacity
                    style={categoryStyles.row}
                    onPress={() => {
                      console.log("Un poco loco: ", item.label, item.id);
                      task$.category.set(item);
                    }}
                  >
                    <Text
                      style={[
                        categoryStyles.label,
                        item.color ? { color: item.color } : null,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <View
                      style={{
                        width: "100%",
                        height: 0,
                        borderWidth: 0.5,
                        borderColor: "rgba(0, 0, 0, 0.3)",
                        marginTop: 3,
                      }}
                    />
                  </TouchableOpacity>
                </View>
              ))}

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
                  router.push("/categoryCreateSheet");
                }}
              >
                {/* <View> */}
                <AntDesign
                  name="addfile"
                  size={16}
                  color={"rgba(0, 0, 0, 0.3)"}
                />
                <Text style={[categoryStyles.label, { marginLeft: 5 }]}>
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

  return (
    <View style={styles.overlay}>
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kav}
      >
        <ScrollView keyboardShouldPersistTaps={"always"} scrollEnabled={false}>
          {/* Card container */}
          <View style={styles.cardContainer}>
            {/* Title */}
            <$TextInput
              $value={task$.title}
              style={styles.textInput}
              autoFocus={true}
              multiline
              placeholder={"Task Name"}
              placeholderTextColor={"rgba(0, 0, 0, 0.5)"}
            />

            {/* Description */}
            <$TextInput
              $value={task$.description}
              style={[styles.textInput, styles.description]}
              multiline
              placeholder="Description"
              placeholderTextColor={"rgba(0, 0, 0, 0.4)"}
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
                    style={styles.actionButton}
                    onPress={() => {
                      router.push("/dateSelectSheet");
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
                                color="rgb(64, 160, 43)"
                              />
                              <Text
                                style={[
                                  styles.actionText,
                                  { color: "rgb(64, 160, 43)" },
                                ]}
                              >
                                {dayjs(task$.rrule.get().DTSTART).format(
                                  "MMM D YYYY"
                                )}
                              </Text>
                              {(() => {
                                return task$.isRepeating.get() ? (
                                  <AntDesign
                                    name="retweet"
                                    size={15}
                                    color="rgb(64, 160, 43)"
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
                              color="rgba(0, 0, 0, 0.75)"
                            />
                            <Text style={styles.actionText}>Date</Text>
                          </>
                        );
                      }}
                    </Memo>
                  </TouchableOpacity>

                  {/* Time Goal */}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      router.push("/timeGoalSelectSheet");
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
                                color="rgba(200, 0, 0, 0.75)"
                              />
                              <Text
                                style={[
                                  styles.actionText,
                                  { color: "rgba(200, 0, 0, 0.75)" },
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
                              color="rgba(0, 0, 0, 0.75)"
                            />
                            <Text style={styles.actionText}>Time Goal</Text>
                          </>
                        );
                      }}
                    </Memo>
                  </TouchableOpacity>

                  {/* Category */}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      categoryPopup$.set((prev) => !prev);
                      console.log(categoryPopup$.get());
                    }}
                  >
                    <Memo>
                      {() => {
                        if (task$.category.id.get() == 0)
                          return (
                            <>
                              <AntDesign
                                name="flag"
                                size={15}
                                color="rgba(0, 0, 0, 0.75)"
                              />
                              <Text style={styles.actionText}>Category</Text>
                            </>
                          );
                        return (
                          <>
                            <AntDesign
                              name="flag"
                              size={15}
                              color={task$.category.color.get()}
                            />
                            <Text
                              style={[
                                styles.actionText,
                                {
                                  color: task$.category.color.get(),
                                  maxWidth: 120,
                                },
                              ]}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {task$.category.label.get()}
                            </Text>
                          </>
                        );
                      }}
                    </Memo>
                  </TouchableOpacity>

                  {/* Placeholder for "More" options in future */}
                  {/* <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
                    <MaterialIcons name="more-horiz" size={15} color="rgba(0, 0, 0, 0.75)"/>
                  </TouchableOpacity> */}
                </View>
              </ScrollView>

              {/* Submit button (currently logs; TODO hook to DB) */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => {
                  addToDatabase();
                  toastShow$.whereToDisplay.get() === 0 && navigation.goBack();
                }}
              >
                <Entypo name="arrow-up" size={20} color="white" />
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

const addToDatabase = () => {
  const submitTask = {
    title: task$.title.get(),
    description: task$.description.get(),
    category: task$.category.id.get() === 0 ? 0 : task$.category.id.get(),
    rrule: task$.rrule.get(),
    timeGoal: task$.timeGoal.get(),
  };

  // TODO — Use logic to check if task is untitled (WHEN DISPLAYING). Saves memory in the long term.
  // console.log("Submit Task: ", submitTask)
  if (!submitTask.rrule)
    // No start date (or repeats)
    toastShow$.set(({ toggleFire }) => ({
      type: "error",
      title: "Missing Date",
      description: "You must include a start date",
      toggleFire: !toggleFire,
      whereToDisplay: 1,
    }));
  else if (submitTask.timeGoal === 0)
    // Time Goal set to 0 (no time goal set)
    toastShow$.set(({ toggleFire }) => ({
      type: "error",
      title: "Missing Time",
      description: "You must include a time goal",
      toggleFire: !toggleFire,
      whereToDisplay: 1,
    }));
  else {
    // add to database
    const task = {
      title: submitTask.title,
      rrule: submitTask.rrule.toString(),
      category: submitTask.category,
      timeGoal: submitTask.timeGoal,
      description: submitTask.description,
    };

    createEvent(task)
      .then((events) => {
        // // TODO — For testing purposes ONLY
        // getEventsForDate(new Date(submitTask.rrule.options.dtstart))
        //   .then((events) => {
        //     console.log("Event has successfully been submitted: ", events);
        //   })
        //   .catch((err) => {
        //     console.error("Error Fetching Events", err);
        //   });
      })
      .catch((err) => {
        console.error("Failed to create task: ", err);
      });


    // TODO — Add task to current day legendState cache if the startDate includes today.

    // TODO — Probably need to move <Toast /> to _layout
    toastShow$.set(({ toggleFire }) => ({
      type: "success",
      title: "Task Created",
      description: "",
      toggleFire: !toggleFire,
      whereToDisplay: 0,
    }));
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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

  // The white card body holding inputs and actions
  cardContainer: {
    height: "auto",
    maxWidth: 500,
    borderRadius: 0,
    backgroundColor: "white",
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
    color: "rgba(0, 0, 0)",
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
    borderColor: "rgba(0, 0, 0, 0.3)",
    flexDirection: "row",
    padding: 8,
    alignItems: "center",
    marginRight: 10,
  },

  // Chip text
  actionText: {
    color: "rgba(0, 0, 0, 0.75)",
    fontSize: 13,
    fontWeight: 500 as any,
    paddingHorizontal: 5,
  },

  // Submit (arrow) button
  submitButton: {
    borderRadius: 100,
    backgroundColor: "rgba(200, 0, 0, 0.75)",
    aspectRatio: 1,
    width: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});
