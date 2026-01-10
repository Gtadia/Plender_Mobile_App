import React, { useEffect, useRef } from "react";
import {
  ActionSheetIOS,
  Alert,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation, useRouter } from "expo-router";
import { Memo, Show, observer, useObservable } from "@legendapp/state/react";
import moment from "moment";
import AntDesign from "@expo/vector-icons/AntDesign";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { BlurView } from "expo-blur";

import { Text } from "@/components/Themed";
import { fmt } from "@/helpers/fmt";
import { stopTaskTimer, uiTick$ } from "@/utils/timerService";
import { activeTimer$ } from "@/utils/activeTimerStore";
import { deleteEvent, updateEvent } from "@/utils/database";
import HorizontalProgressBar from "@/components/custom_ui/HorizontalProgressBar";
import {
  Category$,
  CurrentTaskID$,
  getCategoryMeta,
  taskDetailsSheet$,
  timeGoalEdit$,
  tasks$,
  styling$,
  themeTokens$,
} from "@/utils/stateManager";
import { clearDirtyTask } from "@/utils/dirtyTaskStore";
import { TASK_NAME_MAX_LENGTH } from "@/constants/limits";
import { getListTheme } from "@/constants/listTheme";
import ToastOverlay from "@/components/animation-toast/ToastOverlay";
import { createListSheetStyles } from "@/constants/listStyles";

export default function TaskDetailsSheet() {
  const navigation = useNavigation();
  const { height } = Dimensions.get("window");
  const translateY = useSharedValue(height);
  const isDark = themeTokens$.isDark.get();
  const blurEnabled = styling$.tabBarBlurEnabled.get();
  const overlayColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.35)";

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 260 });
  }, [translateY]);

  const finishClose = () => {
    taskDetailsSheet$.taskId.set(null);
    (navigation as any).goBack?.();
  };

  const closeSheet = () => {
    translateY.value = withTiming(height, { duration: 220 }, (finished) => {
      if (finished) {
        runOnJS(finishClose)();
      }
    });
  };

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.overlay}>
      {blurEnabled ? (
        <BlurView
          tint={isDark ? "dark" : "light"}
          intensity={40}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]}
      />
      <Pressable onPress={closeSheet} style={styles.background} />

      <View style={styles.kav}>
        <Animated.View style={[styles.container, { height: height * 6 / 8, minHeight: 500 }, sheetStyle]}>
          <TaskDetailsContent />
        </Animated.View>
        <ToastOverlay />
      </View>
    </View>
  );
}

const TaskDetailsContent = observer(() => {
  const lastGoalRef = useRef<number>(3600);
  const saveTimers = useRef<{
    title?: ReturnType<typeof setTimeout>;
    description?: ReturnType<typeof setTimeout>;
  }>({});
  const local$ = useObservable({ editing: false, taskId: null as number | null });
  const categoryPopup$ = useObservable(false);
  const router = useRouter();
  const screenWidth = Dimensions.get("window").width;
  const barWidth = screenWidth - 60;
  const { colors, palette, isDark } = themeTokens$.get();
  const sheetStyles = createSheetStyles(colors);
  const listTheme = getListTheme(palette, isDark);
  const sheetListStyles = createListSheetStyles(listTheme);

  return (
    <Memo>
      {() => {
        uiTick$.get();
        const running = activeTimer$.get();

        const id = taskDetailsSheet$.taskId.get();
        if (id == null) return <View />;
        const node = tasks$.entities[id];
        if (!node) return <View />;

        const titleValue = node.title.get() ?? "";
        const descriptionValue = node.description?.get?.() ?? "";
        const categoryValue = node.category?.get?.() ?? 0;
        const goal = node.timeGoal.get() ?? 0;
        const isQuick = !goal || goal <= 0;
        if (goal > 0) lastGoalRef.current = goal;
        const dateValue = node.date?.get?.();
        const dateLabel = dateValue ? moment(dateValue).format("MMMM D, YYYY") : "";
        const categoryMeta = getCategoryMeta(categoryValue);
        const catColor = categoryMeta.color ?? colors.accent;
        const spentBase = node.timeSpent.get() ?? 0;
        const liveSpent =
          running?.taskId === id
            ? running.baseSeconds + Math.max(0, Math.floor((Date.now() - running.startedAt) / 1000))
            : spentBase;
        const percent = goal > 0 ? Math.min(liveSpent / goal, 1) : 0;
        const showProgress = goal > 0 && !isQuick;
        const desc = descriptionValue.trim();

        if (local$.taskId.get() !== id) {
          local$.taskId.set(id);
        }

        const toggleQuick = async (value: boolean) => {
          const newGoal = value ? 0 : lastGoalRef.current || 3600;
          tasks$.entities[id].timeGoal.set(newGoal);
          await updateEvent({ id, timeGoal: newGoal });
        };

        const isEditing = local$.editing.get();
        const categories = Category$.get();

        const scheduleSave = (field: "title" | "description", value: string) => {
          const timers = saveTimers.current;
          if (timers[field]) {
            clearTimeout(timers[field]);
          }
          timers[field] = setTimeout(() => {
            if (field === "title") {
              void updateEvent({ id, title: value });
            } else {
              void updateEvent({ id, description: value });
            }
          }, 400);
        };

        const removeTaskFromCache = (taskId: number) => {
          tasks$.entities[taskId]?.delete?.();
          const lists = tasks$.lists.byDate.get();
          Object.keys(lists).forEach((key) => {
            const list = lists[key] ?? [];
            if (!list.includes(taskId)) return;
            tasks$.lists.byDate[key].set(list.filter((entry) => entry !== taskId));
          });
        };

        const handleDelete = async () => {
          const running = activeTimer$.get();
          if (running?.taskId === id) {
            await stopTaskTimer();
          }
          if (CurrentTaskID$.get() === id) {
            CurrentTaskID$.set(-1);
          }
          await deleteEvent(id);
          clearDirtyTask(id);
          removeTaskFromCache(id);
          taskDetailsSheet$.taskId.set(null);
          router.back();
        };

        const confirmDelete = () => {
          if (Platform.OS === "ios") {
            ActionSheetIOS.showActionSheetWithOptions(
              {
                title: "Delete Task",
                message: "Do you want to delete this task?",
                options: ["Delete Task", "Cancel"],
                destructiveButtonIndex: 0,
                cancelButtonIndex: 1,
              },
              (buttonIndex) => {
                if (buttonIndex === 0) void handleDelete();
              }
            );
            return;
          }
          Alert.alert("Delete Task", "Do you want to delete this task?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete Task", style: "destructive", onPress: () => void handleDelete() },
          ]);
        };

        return (
          <View style={{ flex: 1 }}>
            <View style={sheetStyles.card}>
              <KeyboardAwareScrollView
                style={sheetStyles.scroll}
                contentContainerStyle={sheetStyles.scrollContent}
                bounces
                enableOnAndroid
                extraScrollHeight={200}
                keyboardShouldPersistTaps="handled"
              >
                  <View style={sheetStyles.header}>
                    {isEditing ? (
                      <View style={sheetStyles.titleEdit}>
                        <TextInput
                          style={[sheetStyles.title, sheetStyles.titleInput, sheetStyles.titleInputInline]}
                          value={titleValue}
                          maxLength={TASK_NAME_MAX_LENGTH}
                          onChangeText={(text) => {
                            tasks$.entities[id].title.set(text);
                            scheduleSave("title", text.trim());
                          }}
                          onEndEditing={(e) => {
                            const next = e.nativeEvent.text.trim();
                            tasks$.entities[id].title.set(next);
                            if (saveTimers.current.title) {
                              clearTimeout(saveTimers.current.title);
                            }
                            void updateEvent({ id, title: next });
                          }}
                          placeholder="Task title"
                          placeholderTextColor={colors.subtext0}
                        />
                        <Text style={[sheetStyles.subtitle, { color: colors.subtext0 }]}>
                          {titleValue.length}/{TASK_NAME_MAX_LENGTH}
                        </Text>
                      </View>
                    ) : (
                      <Text style={sheetStyles.title} numberOfLines={2}>
                        {titleValue || "Untitled Task"}
                      </Text>
                    )}
                    {isEditing ? (
                      <TouchableOpacity
                        style={sheetStyles.categoryRow}
                        onPress={() => {
                          categoryPopup$.set(true);
                        }}
                      >
                        <Text style={[sheetStyles.categoryLabel, { color: catColor }]} numberOfLines={1}>
                          {categoryMeta.label}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={sheetStyles.categoryRow}>
                        <Text style={[sheetStyles.categoryLabel, { color: catColor }]} numberOfLines={1}>
                          {categoryMeta.label}
                        </Text>
                      </View>
                    )}
                    {dateLabel ? <Text style={sheetStyles.date}>{dateLabel}</Text> : null}
                  </View>

                <View style={[sheetStyles.switchRow, { opacity: isEditing ? 1 : 0.5 }]}>
                    <Text style={sheetStyles.switchLabel}>Quick Task</Text>
                    <Switch
                      value={isQuick}
                      onValueChange={toggleQuick}
                      thumbColor={isQuick ? catColor : colors.textStrong}
                      trackColor={{ true: `${catColor}55`, false: colors.subtext1 }}
                      disabled={!isEditing}
                    />
                  </View>

                  <View style={sheetStyles.metricRow}>
                    <View style={sheetStyles.metricCell}>
                      <Text style={sheetStyles.metricLabel}>Time Spent</Text>
                      <Text style={sheetStyles.metricValue}>{fmt(liveSpent)}</Text>
                    </View>
                    <View style={sheetStyles.dividerVertical} />
                    <View style={sheetStyles.metricCell}>
                      <Text style={sheetStyles.metricLabel}>Time Goal</Text>
                      {isEditing && !isQuick ? (
                        <TouchableOpacity
                          onPress={() => {
                            timeGoalEdit$.taskId.set(id);
                            router.push("/(tasks)/timeGoalSelectSheet");
                          }}
                          style={sheetStyles.goalButton}
                        >
                          <AntDesign name="clockcircleo" size={14} color={catColor} />
                          <Text style={[sheetStyles.goalButtonText, { color: catColor }]}>{fmt(goal)}</Text>
                        </TouchableOpacity>
                      ) : (
                        <Text
                          style={[
                            sheetStyles.metricValue,
                            { color: isQuick ? colors.subtext0 : colors.textStrong },
                          ]}
                        >
                          {goal ? fmt(goal) : "No goal"}
                        </Text>
                      )}
                    </View>
                  </View>

                  {showProgress && (
                    <View style={sheetStyles.progressBlock}>
                      <View style={sheetStyles.progressRow}>
                        <Text style={sheetStyles.progressLabel}>Percentage Complete</Text>
                        <Text style={sheetStyles.progressValue}>{Math.round(percent * 100)}%</Text>
                      </View>
                      <HorizontalProgressBar width={barWidth} percentage={percent} color={catColor} />
                    </View>
                  )}

                <View style={sheetStyles.descriptionCard}>
                    <Text style={sheetStyles.descriptionTitle}>Description</Text>
                    {isEditing ? (
                    <TextInput
                      style={sheetStyles.descriptionInput}
                      value={descriptionValue}
                      onChangeText={(text) => {
                        tasks$.entities[id].description.set(text);
                        scheduleSave("description", text);
                      }}
                      onEndEditing={(e) => {
                        if (saveTimers.current.description) {
                          clearTimeout(saveTimers.current.description);
                        }
                        void updateEvent({ id, description: e.nativeEvent.text });
                      }}
                      placeholder="Add a description"
                        placeholderTextColor={colors.subtext0}
                        multiline
                      />
                    ) : (
                      <Text style={sheetStyles.descriptionBody}>
                        {desc || "No description added."}
                      </Text>
                    )}
                  </View>
              </KeyboardAwareScrollView>
              <View style={sheetListStyles.bottomActionBar}>
                <Pressable
                  style={[
                    sheetListStyles.bottomActionButton,
                    {
                      backgroundColor: listTheme.colors.card,
                      borderColor: listTheme.colors.divider,
                    },
                  ]}
                  onPress={() => {
                    const next = !isEditing;
                    local$.editing.set(next);
                    if (!next) {
                      categoryPopup$.set(false);
                    }
                  }}
                >
                  <Text style={[sheetListStyles.bottomActionText, { color: colors.textStrong }]}>
                    {isEditing ? "Done" : "Edit"}
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    sheetListStyles.bottomActionButton,
                    {
                      backgroundColor: listTheme.colors.card,
                      borderColor: listTheme.colors.divider,
                    },
                  ]}
                  onPress={confirmDelete}
                >
                  <Text style={[sheetListStyles.bottomActionText, { color: palette.red }]}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            </View>

            <Show if={categoryPopup$} else={<></>}>
              {() => (
                <View style={sheetStyles.popupOverlay}>
                  <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    onPress={() => categoryPopup$.set(false)}
                  />
                  <View style={sheetStyles.categoryPopupCard}>
                    <ScrollView
                      bounces
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={sheetStyles.categoryPopupList}
                      keyboardShouldPersistTaps="handled"
                    >
                      {Object.entries(categories).map(([catId, item]) => {
                        const idNum = Number(catId);
                        return (
                          <TouchableOpacity
                            key={catId}
                            style={sheetStyles.categoryPopupRow}
                            onPress={() => {
                              tasks$.entities[id].category.set(idNum);
                              void updateEvent({ id, category: idNum });
                              categoryPopup$.set(false);
                            }}
                          >
                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.color, marginRight: 8 }} />
                            <Text style={sheetStyles.categoryPopupLabel}>{item.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                      <TouchableOpacity
                        style={[sheetStyles.categoryPopupRow, sheetStyles.categoryPopupCreate]}
                        onPress={() => {
                          categoryPopup$.set(false);
                          router.push("/(tasks)/categoryCreateSheet");
                        }}
                      >
                        <AntDesign name="addfile" size={16} color={colors.subtext0} />
                        <Text style={[sheetStyles.categoryPopupLabel, { marginLeft: 6, color: colors.subtext0 }]}>
                          Add Category
                        </Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>
                </View>
              )}
            </Show>
          </View>
        );
      }}
    </Memo>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  kav: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  container: {
    width: "100%",
    backgroundColor: "transparent",
  },
});

type ThemeTokens = ReturnType<typeof themeTokens$.get>;

const createSheetStyles = (colors: ThemeTokens["colors"]) => StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 130,
  },
  card: {
    backgroundColor: colors.background,
    flex: 1,
    overflow: "hidden",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    position: "relative",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    color: colors.textStrong,
  },
  titleInput: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surface0,
    paddingBottom: 6,
    minWidth: "80%",
  },
  titleEdit: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 8,
    marginTop: 2,
    minWidth: 42,
    textAlign: "right",
  },
  titleInputInline: {
    flex: 1,
    minWidth: 0,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  date: {
    color: colors.subtext0,
    fontWeight: "600",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: colors.surface0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textStrong,
  },
  metricRow: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.surface0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface1,
    marginBottom: 12,
  },
  metricCell: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 4,
  },
  metricLabel: {
    fontWeight: "700",
    color: colors.subtext1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textStrong,
  },
  goalButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  goalButtonText: {
    fontSize: 16,
    fontWeight: "800",
  },
  dividerVertical: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.surface1,
  },
  progressBlock: {
    paddingVertical: 14,
    gap: 8,
    alignItems: "center",
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  progressLabel: {
    fontWeight: "700",
    color: colors.textStrong,
  },
  progressValue: {
    fontWeight: "800",
    color: colors.textStrong,
  },
  descriptionCard: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
    backgroundColor: colors.surface0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface1,
  },
  descriptionTitle: {
    textAlign: "center",
    fontWeight: "800",
    color: colors.textStrong,
    marginBottom: 6,
  },
  descriptionBody: {
    textAlign: "center",
    color: colors.subtext1,
    lineHeight: 20,
  },
  descriptionInput: {
    minHeight: 70,
    textAlign: "center",
    color: colors.subtext1,
    lineHeight: 20,
  },
  popupOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
  },
  categoryPopupCard: {
    width: 260,
    maxHeight: 320,
    borderRadius: 12,
    backgroundColor: colors.surface0,
    paddingHorizontal: 18,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  categoryPopupList: {
    paddingVertical: 0,
  },
  categoryPopupRow: {
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  categoryPopupLabel: {
    fontSize: 16,
    color: colors.text,
  },
  categoryPopupCreate: {
    marginTop: 6,
  },
});
