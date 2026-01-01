import { StyleSheet, View, ScrollView, Button, RefreshControl, TouchableOpacity, Switch, Dimensions, TextInput } from "react-native";
import { Text, ScreenView } from "@/components/Themed";
import { globalTheme, horizontalPadding } from "@/constants/globalThemeVar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { observable } from "@legendapp/state";
import moment from "moment";
import { Category$, editTaskSheet$, loadDay, tasks$ } from "@/utils/stateManager";
import { Memo, Show, useObservable } from "@legendapp/state/react";
import { CurrentTaskView, TodayTaskView } from "@/components/HomeScreenTasks";
import { useCallback, useRef } from "react";
import { flushDirtyTasksToDB } from "@/utils/dirtyTaskStore";
import BottomSheet from "@/components/BottomSheet";
import { fmt } from "@/helpers/fmt";
import { uiTick$ } from "@/utils/timerService";
import { activeTimer$ } from "@/utils/activeTimerStore";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import AntDesign from "@expo/vector-icons/AntDesign";
import { colorTheme$ } from "@/utils/stateManager";
import HorizontalProgressBar from "@/components/custom_ui/HorizontalProgressBar";
import { updateEvent } from "@/utils/database";
import { useRouter } from "expo-router";

// TODO — for drag down to reload

export default function TabOneScreen() {
  const insets = useSafeAreaInsets();
  const homePageInfo$ = useObservable({
    reload: false
  })
  const taskSheetOpen$ = useObservable(false);
  const taskSheetClose$ = useObservable(0);
  const taskSheetId$ = useObservable<number | null>(null);

  const Refreshing = useCallback(async () => {
    // show spinner immediately
    homePageInfo$.reload.set(true);
    try {
      await flushDirtyTasksToDB();
      await loadDay(new Date());
    } finally {
      // hide spinner
      homePageInfo$.reload.set(false);
    }
  }, []);

  return (
    <ScreenView style={globalTheme.container}>
      <View
        style={[
          styles.titleContainer,
          { paddingTop: insets.top, marginBottom: 5 },
        ]}
      >
        <Text style={[styles.title, styles.mainTitle]}>Home</Text>
      </View>
      <ScrollView
        style={{ width: "100%" }}
        refreshControl={
          <RefreshControl
            refreshing={homePageInfo$.reload.get()}
            onRefresh={Refreshing}
          />
        }
      >
        {/* Current Task Progress */}
        {/* marginTop: 15  */}
        {/* Padding near bottom so users can scroll past UI components */}

        <CurrentTaskView
          onPressDetails={(id) => {
            taskSheetId$.set(id);
            taskSheetOpen$.set(true);
          }}
        />

        <View style={[styles.titleContainer, { marginBottom: 15 }]}>
          <Text style={[styles.title, styles.secondaryTitle]}>Today</Text>
        </View>
        <TodayTaskView
          onPressItem={(id) => {
            taskSheetId$.set(id);
            taskSheetOpen$.set(true);
          }}
        />

        {/* Padding Bottom */}
        <View style={globalTheme.tabBarAvoidingPadding} />
      </ScrollView>

      <BottomSheet open$={taskSheetOpen$} close={taskSheetClose$}>
        <TaskSheetContent
          taskSheetId$={taskSheetId$}
          onClose={() => {
            taskSheetOpen$.set(false);
            taskSheetClose$.set((v) => v + 1);
          }}
        />
      </BottomSheet>
    </ScreenView>
  );
}

const TaskSheetContent = ({
  taskSheetId$,
  onClose: _onClose,
}: {
  taskSheetId$: any;
  onClose: () => void;
}) => {
  const lastGoalRef = useRef<number>(3600);
  const local$ = useObservable({ editing: false, taskId: null as number | null });
  const categoryPopup$ = useObservable(false);
  const router = useRouter();
  const screenWidth = Dimensions.get("window").width;
  const barWidth = screenWidth - 60; // some padding inside sheet

  return (
    <Memo>
      {() => {
        uiTick$.get(); // keep live timer flowing
        const running = activeTimer$.get();

        const id = taskSheetId$.get();
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
            <ScrollView contentContainerStyle={sheetStyles.scrollContent} bounces keyboardShouldPersistTaps="handled">
              <View style={sheetStyles.card}>
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

              <View style={[sheetStyles.switchRow, { backgroundColor: colorTheme$.colors.surface1.get(), opacity: isEditing ? 1 : 0.5 }]}>
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
                        editTaskSheet$.taskId.set(id);
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
                  <HorizontalProgressBar
                    width={barWidth}
                    percentage={percent}
                    color={catColor}
                  />
                </View>
              )}

                <View style={[sheetStyles.descriptionCard, { backgroundColor: colorTheme$.colors.surface1.get() }]}>
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
              </View>
            </ScrollView>
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
  titleContainer: {
    width: "100%",
  },
  title: {
    left: horizontalPadding,
    color: "#000",
    marginLeft: 0,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },

  mainTitle: {
    fontSize: 28,
  },
  secondaryTitle: {
    fontSize: 24,
  },
});

const sheetStyles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
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
    color: "#6b7280",
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
    backgroundColor: "#f5f5f7",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
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
    backgroundColor: "#e5e7eb",
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
