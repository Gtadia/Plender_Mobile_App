import React, { useRef } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Stack, useNavigation, useRouter } from "expo-router";
import { Memo, Show, useObservable } from "@legendapp/state/react";
import moment from "moment";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import AntDesign from "@expo/vector-icons/AntDesign";

import { Text } from "@/components/Themed";
import { fmt } from "@/helpers/fmt";
import { uiTick$ } from "@/utils/timerService";
import { activeTimer$ } from "@/utils/activeTimerStore";
import { updateEvent } from "@/utils/database";
import HorizontalProgressBar from "@/components/custom_ui/HorizontalProgressBar";
import {
  Category$,
  colorTheme$,
  taskDetailsSheet$,
  timeGoalEdit$,
  tasks$,
} from "@/utils/stateManager";

export default function TaskDetailsSheet() {
  const navigation = useNavigation();
  const { height } = Dimensions.get("window");

  const closeSheet = () => {
    taskDetailsSheet$.taskId.set(null);
    (navigation as any).goBack?.();
  };

  return (
    <View style={styles.overlay}>
      <Stack.Screen
        name="taskDetailsSheet"
        options={{ headerShown: false, presentation: "transparentModal", animation: "fade" }}
      />

      <Pressable onPress={closeSheet} style={styles.background} />

      <View style={styles.kav}>
        <View style={[styles.container, { height: height * 6 / 8, minHeight: 500 }]}>
          <TaskDetailsContent />
        </View>
      </View>
    </View>
  );
}

const TaskDetailsContent = () => {
  const lastGoalRef = useRef<number>(3600);
  const local$ = useObservable({ editing: false, taskId: null as number | null });
  const categoryPopup$ = useObservable(false);
  const router = useRouter();
  const screenWidth = Dimensions.get("window").width;
  const barWidth = screenWidth - 60;

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
        const cat = Category$[categoryValue];
        const catColor = cat?.color?.get?.() ?? colorTheme$.colors.accent.get();
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
                      <TextInput
                        style={[sheetStyles.title, sheetStyles.titleInput]}
                        value={titleValue}
                        onChangeText={(text) => {
                          tasks$.entities[id].title.set(text);
                        }}
                        onEndEditing={(e) => {
                          const next = e.nativeEvent.text.trim();
                          tasks$.entities[id].title.set(next);
                          void updateEvent({ id, title: next });
                        }}
                        placeholder="Task title"
                        placeholderTextColor={colorTheme$.colors.subtext0.get()}
                      />
                    ) : (
                      <Text style={sheetStyles.title} numberOfLines={2}>
                        {titleValue || "Untitled Task"}
                      </Text>
                    )}
                    <TouchableOpacity
                      onPress={() => {
                        const next = !isEditing;
                        local$.editing.set(next);
                        if (!next) {
                          categoryPopup$.set(false);
                        }
                      }}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      style={sheetStyles.editButton}
                    >
                      <FontAwesome5 name="edit" size={18} color={catColor} />
                    </TouchableOpacity>
                    {isEditing ? (
                      <TouchableOpacity
                        style={sheetStyles.categoryRow}
                        onPress={() => {
                          categoryPopup$.set(true);
                        }}
                      >
                        <Text style={[sheetStyles.categoryLabel, { color: catColor }]} numberOfLines={1}>
                          {cat?.label?.get?.() ?? "General"}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={sheetStyles.categoryRow}>
                        <Text style={[sheetStyles.categoryLabel, { color: catColor }]} numberOfLines={1}>
                          {cat?.label?.get?.() ?? "General"}
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
                      thumbColor={isQuick ? catColor : "#fff"}
                      trackColor={{ true: `${catColor}55`, false: "#ccc" }}
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
                            router.push("/timeGoalSelectSheet");
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
                            { color: isQuick ? colorTheme$.colors.subtext0.get() : "#111" },
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
                        }}
                        onEndEditing={(e) => {
                          void updateEvent({ id, description: e.nativeEvent.text });
                        }}
                        placeholder="Add a description"
                        placeholderTextColor={colorTheme$.colors.subtext0.get()}
                        multiline
                      />
                    ) : (
                      <Text style={sheetStyles.descriptionBody}>
                        {desc || "No description added."}
                      </Text>
                    )}
                  </View>
              </KeyboardAwareScrollView>
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
                          router.push("/categoryCreateSheet");
                        }}
                      >
                        <AntDesign name="addfile" size={16} color={colorTheme$.colors.subtext0.get()} />
                        <Text style={[sheetStyles.categoryPopupLabel, { marginLeft: 6, color: colorTheme$.colors.subtext0.get() }]}>
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
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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

const sheetStyles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colorTheme$.colors.background.get(),
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
  editButton: {
    position: "absolute",
    right: 0,
    top: 0,
    padding: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    color: "#111",
  },
  titleInput: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d1d5db",
    paddingBottom: 6,
    minWidth: "80%",
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
    color: colorTheme$.colors.subtext0.get(),
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
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colorTheme$.colors.surface0.get(),
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  metricRow: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colorTheme$.colors.surface0.get(),
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
    color: "#4b5563",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
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
    backgroundColor: colorTheme$.colors.surface0.get(),
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
    color: "#111",
  },
  progressValue: {
    fontWeight: "800",
    color: "#111",
  },
  descriptionCard: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colorTheme$.colors.surface0.get(),
  },
  descriptionTitle: {
    textAlign: "center",
    fontWeight: "800",
    color: "#111",
    marginBottom: 6,
  },
  descriptionBody: {
    textAlign: "center",
    color: "#4b5563",
    lineHeight: 20,
  },
  descriptionInput: {
    minHeight: 70,
    textAlign: "center",
    color: "#4b5563",
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
    backgroundColor: "#fff",
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
    color: "#111",
  },
  categoryPopupCreate: {
    marginTop: 6,
  },
});
