import React from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import { Text } from "@/components/Themed";
import { Memo, observer } from "@legendapp/state/react";
import { FontAwesome5 } from "@expo/vector-icons";
import moment from "moment";
import HorizontalProgressBarPercentage from "@/components/custom_ui/HorizontalProgressBarPercentage";
import { fmt } from "@/helpers/fmt";
import { getListTheme } from "@/constants/listTheme";
import { activeTimer$ } from "@/utils/activeTimerStore";
import { getDirtyEntry } from "@/utils/dirtyTaskStore";
import {
  CurrentTaskID$,
  getCategoryGroupId,
  getCategoryMeta,
  settings$,
  tasks$,
  themeTokens$,
} from "@/utils/stateManager";
import { startTaskTimer, stopTaskTimer, uiTick$ } from "@/utils/timerService";
import { getNow } from "@/utils/timeOverride";

type TaskListVariant = "home" | "calendar";

type TaskListProps = {
  dateKey: string;
  variant: TaskListVariant;
  onPressItem?: (id: number) => void;
  containerStyle?: ViewStyle;
  emptyContainerStyle?: ViewStyle;
  emptyText?: string;
};

const stopCurrentWithSplitPrompt = () => {
  const running = activeTimer$.get();
  if (!running) {
    void stopTaskTimer();
    return;
  }
  const startKey = moment(running.startedAt).format("YYYY-MM-DD");
  const todayKey = moment(getNow()).format("YYYY-MM-DD");
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
      (buttonIndex) => {
        if (buttonIndex === 0) doStop(true);
        if (buttonIndex === 1) doStop(false);
      }
    );
    return;
  }
  Alert.alert("Stop task", message, [
    { text: "Split across days", onPress: () => doStop(true) },
    { text: "Keep on previous day", onPress: () => doStop(false) },
    { text: "Cancel", style: "cancel" },
  ]);
};

const confirmStop = (onStop: () => void) => {
  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: "Pause Menu",
        message: "Do you want to stop this task?",
        options: ["Stop Task", "Cancel"],
        destructiveButtonIndex: 0,
        cancelButtonIndex: 1,
      },
      (buttonIndex) => {
        if (buttonIndex === 0) onStop();
      }
    );
    return;
  }
  Alert.alert("Stop task", "Do you want to stop this task?", [
    { text: "Stop Task", style: "destructive", onPress: onStop },
    { text: "Cancel", style: "cancel" },
  ]);
};

const confirmSwap = (onStart: () => void, onStop: () => void) => {
  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: "Pause Menu",
        message: "Do you want to stop the current task or start a new task?",
        options: ["Start New Task", "Stop Current Task", "Cancel"],
        destructiveButtonIndex: 1,
        cancelButtonIndex: 2,
      },
      (buttonIndex) => {
        if (buttonIndex === 0) onStart();
        if (buttonIndex === 1) onStop();
      }
    );
    return;
  }
  Alert.alert("Switch task", "Do you want to stop the current task or start a new task?", [
    { text: "Start New Task", onPress: onStart },
    { text: "Stop Current Task", style: "destructive", onPress: onStop },
    { text: "Cancel", style: "cancel" },
  ]);
};

type TaskListStyles = ReturnType<typeof createStyles>;

const TaskListSectionHeader = ({
  category,
  dateKey,
  variant,
  styles,
  listTheme,
}: {
  category: number;
  dateKey: string;
  variant: TaskListVariant;
  styles: TaskListStyles;
  listTheme: ReturnType<typeof getListTheme>;
}) => {
  return (
    <>
      {(() => {
        uiTick$.get();
        const running = activeTimer$.get();
        const idsForDay = tasks$.lists.byDate[dateKey]?.get?.() ?? [];
        const todayKey = moment(getNow()).format("YYYY-MM-DD");
        const isToday = dateKey === todayKey;
        const { spent, goal, cappedSpent } = idsForDay.reduce(
          (acc, id) => {
            const node = tasks$.entities[id]?.get?.();
            if (!node) return acc;
            const groupId = getCategoryGroupId(node.category ?? 0);
            if (groupId !== category) return acc;
            const baseSpent = node.timeSpent ?? 0;
            const goalVal = node.timeGoal ?? 0;
            if (!goalVal || goalVal <= 0) return acc;
            let spentValue = baseSpent;
            if (variant === "calendar") {
              const dirtyEntry = getDirtyEntry(id);
              const dayOverride = dirtyEntry?.byDate?.[dateKey];
              if (dayOverride !== undefined) {
                spentValue = dayOverride;
              } else if (isToday && running?.taskId === id) {
                spentValue =
                  running.baseSeconds + Math.max(0, Math.floor((Date.now() - running.startedAt) / 1000));
              } else if (node.date) {
                const nodeDateKey = moment(node.date).format("YYYY-MM-DD");
                if (nodeDateKey !== dateKey) {
                  spentValue = 0;
                }
              }
            } else if (running?.taskId === id) {
              spentValue =
                running.baseSeconds + Math.max(0, Math.floor((Date.now() - running.startedAt) / 1000));
            }
            acc.spent += spentValue;
            acc.cappedSpent += Math.min(spentValue, goalVal);
            acc.goal += goalVal;
            return acc;
          },
          { spent: 0, goal: 0, cappedSpent: 0 }
        );
        const useCappedCompletion = settings$.productivity.capCategoryCompletion.get();
        const percent = goal > 0
          ? Math.round(((useCappedCompletion ? cappedSpent : spent) / goal) * 100)
          : 0;
        const categoryMeta = getCategoryMeta(category);
        const color = categoryMeta.color || listTheme.colors.secondaryText;
        const label = categoryMeta.label;

        return (
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[styles.sectionTitle, { color }]} numberOfLines={1} ellipsizeMode="tail">
                {label}
              </Text>
              <Text style={styles.sectionPercent}> ({percent}%)</Text>
            </View>
            <Text style={styles.sectionTotals}>
              {fmt(spent)}{goal ? ` / ${fmt(goal)}` : ""}
            </Text>
          </View>
        );
      })()}
    </>
  );
};

const TaskListItem = observer(({
  id,
  showDivider,
  variant,
  onPressItem,
  dateKey,
  styles,
}: {
  id: number;
  showDivider: boolean;
  variant: TaskListVariant;
  onPressItem?: (id: number) => void;
  dateKey: string;
  styles: TaskListStyles;
}) => {
  const showControls = variant === "home";
  uiTick$.get();
  const node = tasks$.entities[id];
  if (!node) return null;

        const currentId = CurrentTaskID$.get();
        const isCurrent = currentId === id;

        const title = node.title.get()?.trim() || "Untitled";
        const timeSpent = node.timeSpent.get() ?? 0;
        const timeGoal = node.timeGoal.get() ?? 0;
        const isQuick = !timeGoal || timeGoal <= 0;
        const running = activeTimer$.get();
        const todayKey = moment(getNow()).format("YYYY-MM-DD");
        const isToday = dateKey === todayKey;
        const dirtyEntry = getDirtyEntry(id);
        const dayOverride = dirtyEntry?.byDate?.[dateKey];
        const nodeDate = node.date?.get?.();
        const nodeDateKey = nodeDate ? moment(nodeDate).format("YYYY-MM-DD") : null;
        let liveSpent = timeSpent;
        if (variant === "calendar") {
          if (dayOverride !== undefined) {
            liveSpent = dayOverride;
          } else if (isToday && running?.taskId === id) {
            liveSpent =
              running.baseSeconds + Math.max(0, Math.floor((Date.now() - running.startedAt) / 1000));
          } else if (nodeDateKey && nodeDateKey !== dateKey) {
            liveSpent = 0;
          }
        } else if (running?.taskId === id) {
          liveSpent =
            running.baseSeconds + Math.max(0, Math.floor((Date.now() - running.startedAt) / 1000));
        }
        const percent = timeGoal > 0 ? Math.min(liveSpent / timeGoal, 1) : 0;
        const date = variant === "calendar" ? moment(dateKey).toDate() : node.date?.get?.();

        const handlePress = () => {
          if (!showControls) return;
          const startTask = () => {
            void startTaskTimer(id);
          };
          const stopTask = () => {
            stopCurrentWithSplitPrompt();
          };
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

        const iconColor = isCurrent ? "#ef4444" : "#16a34a";
        const Divider = showDivider ? <View style={styles.sectionDivider} /> : null;
        const detailsContent = (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {title}
              </Text>
              {date && <Text style={styles.rowSub}>{moment(date).format("MMMM D, YYYY")}</Text>}
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowTime}>
                {fmt(liveSpent)}
                <Text style={styles.taskGoal}>
                  {timeGoal ? ` / ${fmt(timeGoal)}` : " / No goal"}
                </Text>
              </Text>
              {showControls ? (
                !isQuick && (
                  <HorizontalProgressBarPercentage
                    width={110}
                    height={28}
                    percentage={percent}
                    color={iconColor}
                    trackColor={themeTokens$.get().colors.surface1}
                  />
                )
              ) : (
                !isQuick && <Text style={styles.rowPercent}>{Math.round(percent * 100)}%</Text>
              )}
            </View>
          </View>
        );
        const rowDetails = onPressItem ? (
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85} onPress={() => onPressItem(id)}>
            {detailsContent}
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }}>{detailsContent}</View>
        );

  return (
    <>
      <View style={styles.row}>
        {showControls && (
          <TouchableOpacity onPress={handlePress} style={styles.iconButton}>
            <FontAwesome5 name={isCurrent ? "pause" : "play"} size={18} color={iconColor} />
          </TouchableOpacity>
        )}
        {rowDetails}
      </View>
      {Divider}
    </>
  );
});

export const TaskList = observer(({
  dateKey,
  variant,
  onPressItem,
  containerStyle,
  emptyContainerStyle,
  emptyText,
}: TaskListProps) => {
  const { palette, isDark } = themeTokens$.get();
  const themePalette = palette;
  const themeKey = themePalette.theme ?? "default";
  const listTheme = getListTheme(
    themePalette,
    isDark
  );
  const styles = createStyles(listTheme);
  return (
    <Memo key={`${themeKey}-${dateKey}`}>
      {() => {
        const ids = tasks$.lists.byDate[dateKey]?.get?.() ?? [];
        const grouped = ids.reduce((acc, id) => {
          const task = tasks$.entities[id]?.get?.();
          if (!task) return acc;
          const groupId = getCategoryGroupId(task.category ?? 0);
          (acc[groupId] ??= []).push(id);
          return acc;
        }, {} as Record<number, number[]>);
        const entries = Object.entries(grouped)
          .map(([cat, list]) => {
            const quick = (list as number[]).filter(
              (taskId) => (tasks$.entities[taskId]?.get?.()?.timeGoal ?? 0) <= 0
            );
            const normal = (list as number[]).filter(
              (taskId) => (tasks$.entities[taskId]?.get?.()?.timeGoal ?? 0) > 0
            );
            return [cat, [...quick, ...normal]] as [string, number[]];
          })
          .sort(([a], [b]) => +a - +b);

        if (!entries.length) {
          return (
            <View style={[styles.emptyView, emptyContainerStyle]}>
              <Text style={styles.emptyText}>{emptyText ?? "No tasks for this day"}</Text>
            </View>
          );
        }

        return (
          <View style={[styles.container, containerStyle]}>
            {entries.map(([catKey, listIds]) => (
              <View key={catKey} style={styles.sectionCard}>
                <TaskListSectionHeader
                  category={+catKey}
                  dateKey={dateKey}
                  variant={variant}
                  styles={styles}
                  listTheme={listTheme}
                />
                <View style={styles.categoryTaskList}>
                  {(listIds as number[]).map((taskId, idx, arr) => (
                    <TaskListItem
                      key={taskId}
                      id={taskId}
                      variant={variant}
                      showDivider={idx !== arr.length - 1}
                      onPressItem={onPressItem}
                      dateKey={dateKey}
                      styles={styles}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        );
      }}
    </Memo>
  );
});

const createStyles = (listTheme: ReturnType<typeof getListTheme>) =>
  StyleSheet.create({
    container: {
      padding: listTheme.spacing.containerPadding,
      gap: listTheme.spacing.sectionGap,
    },
    sectionCard: {
      backgroundColor: listTheme.colors.card,
      borderRadius: listTheme.radii.section,
      paddingVertical: listTheme.spacing.sectionPadding,
      paddingHorizontal: listTheme.spacing.sectionPadding,
      shadowOpacity: listTheme.shadow.shadowOpacity,
      shadowRadius: listTheme.shadow.shadowRadius,
      shadowOffset: listTheme.shadow.shadowOffset,
      elevation: listTheme.shadow.elevation,
      marginBottom: 18,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      paddingHorizontal: listTheme.spacing.headerHorizontal,
      paddingVertical: listTheme.spacing.headerVertical,
    },
    sectionTitle: {
      fontSize: listTheme.typography.sectionTitleSize,
      fontWeight: listTheme.typography.sectionTitleWeight as "700",
      flexShrink: 1,
      marginRight: 1,
    },
    sectionPercent: {
      fontSize: listTheme.typography.sectionPercentSize,
      fontWeight: listTheme.typography.sectionPercentWeight as "700",
      color: listTheme.colors.secondaryText,
    },
    sectionTotals: {
      fontSize: listTheme.typography.sectionTotalsSize,
      fontWeight: listTheme.typography.sectionTotalsWeight as "700",
      color: listTheme.colors.secondaryText,
    },
    categoryTaskList: {
      borderRadius: listTheme.radii.inner,
      overflow: "hidden",
      backgroundColor: listTheme.colors.row,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: listTheme.spacing.rowVertical,
      paddingHorizontal: listTheme.spacing.rowHorizontal,
      backgroundColor: listTheme.colors.row,
    },
    sectionDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: listTheme.colors.divider,
      marginHorizontal: listTheme.spacing.rowHorizontal,
    },
    rowTitle: {
      fontSize: listTheme.typography.rowTitleSize,
      fontWeight: listTheme.typography.rowTitleWeight as "700",
    },
    rowSub: {
      fontSize: listTheme.typography.rowSubSize,
      color: listTheme.colors.subtleText,
      marginTop: 2,
    },
    rowTime: {
      textAlign: "right",
      fontSize: listTheme.typography.rowTimeSize,
      fontWeight: listTheme.typography.rowTimeWeight as "700",
      color: listTheme.colors.text,
    },
    taskGoal: {
      fontSize: listTheme.typography.taskGoalSize,
      color: listTheme.colors.subtleText,
      fontWeight: listTheme.typography.taskGoalWeight as "600",
    },
    rowPercent: {
      fontSize: listTheme.typography.rowPercentSize,
      color: listTheme.colors.subtleText,
      marginTop: 2,
    },
    iconButton: {
      width: listTheme.sizes.iconButton,
      height: listTheme.sizes.iconButton,
      borderRadius: listTheme.radii.iconButton,
      marginRight: listTheme.spacing.iconGap,
      backgroundColor: listTheme.colors.iconButton,
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
      fontSize: listTheme.typography.emptySize,
      color: listTheme.colors.emptyText,
    },
  });
