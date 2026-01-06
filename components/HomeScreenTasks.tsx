import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActionSheetIOS,
  Alert,
  Platform,
  Dimensions,
  AppState,
} from "react-native";
import { Text } from "@/components/Themed";
import {
  CurrentTaskID$,
  tasks$,
  getCategoryContrastColor,
  getCategoryMeta,
  themeTokens$,
} from "@/utils/stateManager";
import moment from "moment";
import { observable } from "@legendapp/state";
import { Memo } from "@legendapp/state/react";
import { FontAwesome5 } from "@expo/vector-icons";
import HorizontalProgressBarPercentage from "./custom_ui/HorizontalProgressBarPercentage";
import { fmt } from "@/helpers/fmt";
import { initTimerService, stopTaskTimer, syncRunningTimer, uiTick$ } from "@/utils/timerService";
import React, { useEffect, useCallback, useState } from "react";
import { activeTimer$ } from "@/utils/activeTimerStore";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { TaskList } from "@/components/task-list/TaskList";

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
  const [nowTick, setNowTick] = useState(0);
  useEffect(() => {
    void initTimerService();
    const tick = setInterval(() => syncRunningTimer(), 1000);
    const unsub = uiTick$.onChange?.(({ value }) => setNowTick(value));
    const localTick = setInterval(() => setNowTick((v) => v + 1), 1000);
    return () => {
      clearInterval(tick);
      unsub?.();
      clearInterval(localTick);
    };
  }, []);
  useFocusEffect(
    useCallback(() => {
      syncRunningTimer();
      const tick = setInterval(() => syncRunningTimer(), 1000);
      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          syncRunningTimer();
        }
      });
      return () => {
        sub?.remove?.();
        clearInterval(tick);
      };
    }, [])
  );

  return (
    <Memo>
      {() => {
      // consume tick to force re-render when timerService heartbeat updates
      void nowTick;
      const { colors, palette } = themeTokens$.get();
      const currentId = CurrentTaskID$.get();
      if (currentId === -1) {
        return (
          <View
            style={[
              taskStyles.container,
              taskStyles.noTaskContainer,
              { backgroundColor: colors.surface0 },
            ]}
          >
            <Text style={[taskStyles.noTaskTitle, { color: colors.subtext1 }]}>
              No tasks currently running
            </Text>
            <Text style={[taskStyles.noTaskSubtitle, { color: colors.subtext0 }]}>
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
              { backgroundColor: colors.surface0 },
            ]}
          >
            <Text style={[taskStyles.noTaskTitle, { color: colors.subtext1 }]}>
              No tasks currently running
            </Text>
          </View>
        );
      }

      const title = node.title.get()?.trim() || "Untitled Task";
      const spent = node.timeSpent.get() ?? 0;
      const goal = node.timeGoal.get() ?? 0;
      const active = activeTimer$.get();
      const liveSpent =
        active?.taskId === currentId
          ? active.baseSeconds + Math.max(0, Math.floor((Date.now() - active.startedAt) / 1000))
          : spent;
      const percent = goal > 0 ? Math.min(liveSpent / goal, 1) : 0;
      const catId = node.category?.get?.() ?? 0;
      const categoryMeta = getCategoryMeta(catId);
      const color = categoryMeta.color || colors.primary;
      const opposite = getCategoryContrastColor(catId, colors.textStrong);
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
            <Text
              style={taskStyles.currentTitle}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
            <View style={taskStyles.headerRight}>
              <Text style={taskStyles.cardPercent}>{Math.round(percent * 100)}%</Text>
              <TouchableOpacity onPress={stopCurrentWithSplitPrompt} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <FontAwesome5 name="stop" size={18} color={opposite} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={taskStyles.currentTime}>{fmt(liveSpent)}</Text>
          {!!goal && <Text style={taskStyles.currentGoal}>{fmt(goal)}</Text>}
          <View style={taskStyles.progressWrapper}>
            <HorizontalProgressBarPercentage
              width={progressWidth}
              percentage={percent}
              color={opposite}
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

export const TodayTaskView = ({ onPressItem }: { onPressItem?: (id: number) => void }) => {
  const key = moment().format("YYYY-MM-DD");
  return <TaskList dateKey={key} variant="home" onPressItem={onPressItem} emptyText="No tasks for today!" />;
};

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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 0,
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
    color: "#fff",
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
    textAlign: "center",
  },
  noTaskSubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  currentTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    flex: 1,
    marginRight: 12,
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
