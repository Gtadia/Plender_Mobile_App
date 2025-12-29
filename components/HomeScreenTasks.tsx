import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActionSheetIOS,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { Text } from "@/components/Themed";
import {
  Category$,
  CurrentTaskID$,
  tasks$,
  colorTheme$,
} from "@/utils/stateManager";
import { colorTheme } from "@/constants/Colors";
import moment from "moment";
import { observable } from "@legendapp/state";
import { Memo } from "@legendapp/state/react";
import { FontAwesome5 } from "@expo/vector-icons";
import HorizontalProgressBarPercentage from "./custom_ui/HorizontalProgressBarPercentage";
import { fmt } from "@/helpers/fmt";
import { initTimerService, startTaskTimer, stopTaskTimer } from "@/utils/timerService";
import { useEffect } from "react";
import { activeTimer$ } from "@/utils/activeTimerStore";
import { useRouter } from "expo-router";

export const homePageInfo$ = observable({
  reload: false,
});

const stopCurrentWithSplitPrompt = () => {
  const running = activeTimer$.get();
  if (!running) {
    void stopTaskTimer();
    return;
  }
  const startKey = moment(running.startedAt).format("YYYY-MM-DD");
  const todayKey = moment().format("YYYY-MM-DD");
  const spans = startKey !== todayKey;
  const todayIds = tasks$.lists.byDate[todayKey]?.get?.() ?? [];
  const appearsToday = todayIds.includes(running.taskId);
  const doStop = (splitAcrossDays: boolean) => {
    void stopTaskTimer({ splitAcrossDays });
  };
  if (!spans || !appearsToday) {
    doStop(false);
    return;
  }
  const message = "This task started yesterday. Split time between yesterday and today?";
  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: message,
        options: ["Split across days", "Keep on previous day", "Cancel"],
        cancelButtonIndex: 2,
      },
      (index) => {
        if (index === 0) doStop(true);
        else if (index === 1) doStop(false);
      }
    );
  } else {
    Alert.alert(
      "Split time?",
      message,
      [
        { text: "Split", onPress: () => doStop(true) },
        { text: "Keep on previous day", onPress: () => doStop(false) },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  }
};

export const CurrentTaskView = ({ onPressDetails }: { onPressDetails?: (id: number) => void }) => {
  const router = useRouter();
  useEffect(() => {
    void initTimerService();
  }, []);

  return (
    <Memo>
      {() => {
      const currentId = CurrentTaskID$.get();
      if (currentId === -1) {
        return (
          <View
            style={[
              taskStyles.container,
              taskStyles.noTaskContainer,
              { backgroundColor: colorTheme$.colors.surface0.get() },
            ]}
          >
            <Text style={taskStyles.noTaskTitle}>No tasks currently running</Text>
            <Text style={taskStyles.noTaskSubtitle}>
              Start a task to begin tracking time.
            </Text>
          </View>
        );
      }

      const node = tasks$.entities[currentId];
      if (!node) {
        return (
          <View
            style={[
              taskStyles.container,
              taskStyles.noTaskContainer,
              { backgroundColor: colorTheme$.colors.surface0.get() },
            ]}
          >
            <Text style={taskStyles.noTaskTitle}>No tasks currently running</Text>
          </View>
        );
      }

      const title = node.title.get()?.trim() || "Untitled Task";
      const spent = node.timeSpent.get() ?? 0;
      const goal = node.timeGoal.get() ?? 0;
      const percent = goal > 0 ? Math.min(spent / goal, 1) : 0;
      const catId = node.category?.get?.() ?? 0;
      const color = (Category$[catId]?.color?.get?.()) || colorTheme$.colors.primary.get();
      const progressWidth = Math.min(
        Dimensions.get("window").width - 140,
        360,
      );

      return (
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => {
            if (onPressDetails) {
              onPressDetails(currentId);
            } else {
              router.push({
                pathname: "/index/taskDetails",
                params: { id: String(currentId) },
              });
            }
          }}
        >
        <View style={[taskStyles.container, { backgroundColor: color }]}> 
          <View style={taskStyles.cardHeader}>
            <Text style={taskStyles.currentTitle}>{title}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Text style={taskStyles.cardPercent}>{Math.round(percent * 100)}%</Text>
              <TouchableOpacity onPress={stopCurrentWithSplitPrompt} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <FontAwesome5 name="stop" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={taskStyles.currentTime}>{fmt(spent)}</Text>
          {!!goal && <Text style={taskStyles.currentGoal}>{fmt(goal)}</Text>}
          <View style={taskStyles.progressWrapper}>
            <HorizontalProgressBarPercentage
              width={progressWidth}
              percentage={percent}
              color={colorTheme$.colors.accent.get()}
              trackColor="rgba(255,255,255,0.35)"
              textColor="#fff"
            />
          </View>
        </View>
        </TouchableOpacity>
      );
      }}
    </Memo>
  );
};

const SectionHeader = ({
  category,
  ids,
}: {
  category: number;
  ids: number[];
}) => {
  return (
    <Memo>
      {() => {
        let spent = 0, goal = 0;
        for (const id of ids) {
          const n = tasks$.entities[id];
          if (!n) continue;
          spent += n.timeSpent.get() ?? 0;  // tracked read
          goal  += n.timeGoal.get()  ?? 0;  // tracked read
        }
        const percent = goal > 0 ? Math.round((spent / goal) * 100) : 0;
        const catNode = Category$[category];
        const color = catNode?.color?.get?.() ?? colorTheme$.colors.primary.get();
        const label = catNode?.label?.get?.() ?? "General";

        return (
          <View style={taskListStyles.sectionHeader}>
            <Text
              style={[
                taskListStyles.sectionTitle,
                { color },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {label} ({percent}%)
            </Text>
            <Text style={taskListStyles.sectionTotals}>
              {fmt(spent)}{goal ? ` / ${fmt(goal)}` : ""}
            </Text>
          </View>
        );
      }}
    </Memo>
  )
};

const TaskRow = ({ id, showDivider }: { id: number; showDivider: boolean }) => {
  const confirmStop = (onStop: () => void) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Pause Menu',
          message: 'Do you want to stop this task?',
          options: ['Stop Task', 'Cancel'],
          destructiveButtonIndex: 0,
          cancelButtonIndex: 1,
        },
        (index) => {
          if (index === 0) onStop();
        },
      );
    } else {
      Alert.alert('Pause Menu', 'Do you want to stop this task?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Stop Task', style: 'destructive', onPress: onStop },
      ]);
    }
  };

  const confirmSwap = (onStart: () => void, onStop: () => void) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Start New Task?',
          message: 'Another task is running.',
          options: ['Start New Task', 'Stop Current Task', 'Cancel'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 2,
        },
        (index) => {
          if (index === 0) {
            onStart();
          } else if (index === 1) {
            onStop();
          }
        },
      );
    } else {
      Alert.alert('Start New Task?', 'Another task is running.', [
        { text: 'Start New Task', onPress: onStart },
        { text: 'Stop Current Task', style: 'destructive', onPress: onStop },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <Memo>
      {() => {
        const node = tasks$.entities[id];
        if (!node) return null;

        const currentId = CurrentTaskID$.get();
        const isCurrent = currentId === id;

        const title = node.title.get()?.trim() || "Untitled";
        const timeSpent = node.timeSpent.get() ?? 0;
        const timeGoal = node.timeGoal.get() ?? 0;
        const percent = timeGoal > 0 ? timeSpent / timeGoal : 0;
        const date = node.date?.get?.();

        const startTask = () => {
          void startTaskTimer(id);
        };
        const stopTask = () => {
          stopCurrentWithSplitPrompt();
        };

        const handlePress = () => {
          if (isCurrent) {
            confirmStop(stopTask);
            return;
          }
          if (currentId !== -1) {
            confirmSwap(startTask, stopTask);
            return;
          }
          startTask();
        };

        const iconColor = isCurrent ? '#ef4444' : '#16a34a';
        const dividerColor = colorTheme$.colors.surface0.get();

        return (
          <View
            style={[
              taskListStyles.row,
              {
                borderBottomColor: dividerColor,
                borderBottomWidth: showDivider ? StyleSheet.hairlineWidth : 0,
              },
            ]}
          >
            <TouchableOpacity onPress={handlePress} style={taskListStyles.iconButton}>
              <FontAwesome5 name={isCurrent ? 'pause' : 'play'} size={18} color={iconColor} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={taskListStyles.rowTitle}>{title}</Text>
              {date && (
                <Text style={taskListStyles.rowSub}>{moment(date).format("MMMM D, YYYY")}</Text>
              )}
            </View>
            <View style={taskListStyles.rowRight}>
              <Text style={taskListStyles.rowTime}>
                {fmt(timeSpent)}{timeGoal ? ` / ${fmt(timeGoal)}` : ""}
              </Text>
              <HorizontalProgressBarPercentage
                width={110}
                height={28}
                percentage={percent}
                color={iconColor}
                trackColor={colorTheme$.colors.surface1.get()}
              />
            </View>
          </View>
        );
      }}
    </Memo>
  );
};

// TODO — Implement Tomorrow task views as well...

export const TodayTaskView = () => {
  const key = moment().format("YYYY-MM-DD");
  return (
    <Memo>
      {() => {
        const ids = tasks$.lists.byDate[key]?.get?.() ?? [];
        const grouped = ids.reduce((acc, id) => {
          const task = tasks$.entities[id]?.get?.();
          if (!task) return acc;
          const cat = task.category ?? 0;
          (acc[cat] ??= []).push(id);
          return acc;
        }, {} as Record<number, number[]>);
        const entries = Object.entries(grouped).sort(([a], [b]) => +a - +b);

        return (
          <ScrollView contentContainerStyle={taskListStyles.container} scrollEnabled={false}>
            {entries.length ? (
              entries.map(([catKey, ids]) => (
                <View key={catKey} style={taskListStyles.section}>
                  <SectionHeader category={+catKey} ids={ids as number[]} />
                  {(ids as number[]).map((id, idx, arr) => (
                    <TaskRow key={id} id={id} showDivider={idx !== arr.length - 1} />
                  ))}
                </View>
              ))
            ) : (
              <View style={taskListStyles.emptyView}>
                <Text style={taskListStyles.emptyText}>No tasks for today!</Text>
              </View>
            )}
          </ScrollView>
        );
      }}
    </Memo>
  );
};

const SectionView = () => {

}

const taskStyles = StyleSheet.create({
  container: {
    maxWidth: 500,
    flex: 1,
    marginHorizontal: 30,
    borderRadius: 20,
    justifyContent: "center",
    alignContent: "center",
    paddingVertical: 15,
    minHeight: 170,
    marginTop: 10,
    marginBottom: 30,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardPercent: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  taskText: {
    fontSize: 16,
    fontWeight: 700,
    color: "white",
    textAlign: "center",
  },
  taskSubText: {
    fontSize: 14,
    fontWeight: 500,
    color: "white",
    textAlign: "center",
  },
  taskTimeSpent: {
    fontSize: 28,
    fontWeight: 700,
    textAlign: "center",
    color: colorTheme.catppuccin.latte.crust
  },
  taskTimeGoal: {
    fontSize: 24,
    fontWeight: 700,
    color: 'white',
    textAlign: "center",
  },
  taskPercentage: {
    fontSize: 16,
    fontWeight: 500,
    color: 'white',
  },
  pad: {
    margin: 3,
    // backgroundColor: 'aqua'
  },
  noTaskContainer: {
    backgroundColor: "#ececec",
  },
  noTaskTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colorTheme$.colors.subtext1.get(),
    textAlign: "center",
  },
  noTaskSubtitle: {
    fontSize: 14,
    color: colorTheme$.colors.subtext0.get(),
    marginTop: 8,
    textAlign: "center",
  },
  currentTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  currentTime: {
    fontSize: 38,
    fontWeight: "800",
    color: "#fff",
    marginTop: 18,
    textAlign: "center",
  },
  currentGoal: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
  progressWrapper: {
    marginTop: 20,
    alignItems: "center",
  },
});

// ---- styles (tweak to match your UI) ----
const taskListStyles = StyleSheet.create({
  container: {
    padding: 12,
    gap: 16,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    flexShrink: 1,
    marginRight: 8,
  },
  sectionTotals: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A4A4A",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  bullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2ecc71",
    marginRight: 10,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  rowSub: {
    fontSize: 12,
    color: "#7A7A7A",
    marginTop: 2,
  },
  rowTime: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  rowPercent: {
    fontSize: 12,
    color: "#7A7A7A",
    marginTop: 2,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  emptyView: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: colorTheme$.colors.subtext0.get(),
  },
});
