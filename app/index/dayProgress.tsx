import React, { useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Dimensions,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Text, ScreenView } from '@/components/Themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CurrentTaskID$,
  getCategoryGroupId,
  getCategoryMeta,
  NO_CATEGORY_ID,
  tasks$,
  themeTokens$,
} from '@/utils/stateManager';
import RadialProgressBar from '@/components/custom_ui/RadialProgressBar';
import HorizontalProgressBar from '@/components/custom_ui/HorizontalProgressBar';
import { globalTheme, horizontalPadding } from '@/constants/globalThemeVar';
import moment from 'moment';
import { loadDay } from '@/utils/stateManager';
import { observer } from '@legendapp/state/react';
import { activeTimer$ } from '@/utils/activeTimerStore';
import { stopTaskTimer, uiTick$ } from '@/utils/timerService';
import { settings$ } from '@/utils/stateManager';
import { getNow } from '@/utils/timeOverride';

type CatSummary = {
  id: number;
  label: string;
  color: string;
  spent: number;
  cappedSpent: number;
  goal: number;
};

const FULL_DAY_SECONDS = 24 * 3600;

const PieChartScreen = observer(() => {
  const insets = useSafeAreaInsets();
  const { colors, palette } = themeTokens$.get();
  const styles = createStyles(colors);
  const contentWidth = Math.max(
    0,
    Math.min(
      Dimensions.get('window').width - horizontalPadding * 2,
      500,
    ),
  );
  const [now, setNow] = useState(moment(getNow()));
  const todayRef = useRef(moment(getNow()).startOf('day'));
  const today = now.clone().startOf('day');
  const dateKey = today.format('YYYY-MM-DD');

  useEffect(() => {
    void loadDay(today.toDate());
  }, [dateKey, today]);

  useEffect(() => {
    const tick = setInterval(() => {
      setNow(moment(getNow()));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const sub = uiTick$?.onChange?.(({ value }) => setNow((prev) => prev.clone()));
    return () => sub?.();
  }, []);

  const byDate = tasks$.lists.byDate.get();
  const ids = byDate[dateKey] ?? [];
  const tasksForDay = ids
    .map((id: number) => tasks$.entities[id]?.get?.())
    .filter(Boolean) as { category: number; timeSpent: number; timeGoal: number; title: string }[];

  const totalsByCat: Record<number, CatSummary> = {};
  let totalSpent = 0;
  tasksForDay.forEach((t) => {
    const catId = getCategoryGroupId(t.category);
    const meta = getCategoryMeta(catId);
    const isUnknown = catId === NO_CATEGORY_ID;
    const timeSpent = t.timeSpent ?? 0;
    const timeGoal = t.timeGoal ?? 0;
    const cappedSpent = timeGoal > 0 ? Math.min(timeSpent, timeGoal) : timeSpent;
    if (!totalsByCat[catId]) {
      totalsByCat[catId] = {
        id: catId,
        label: isUnknown ? 'Unknown' : meta.label,
        color: isUnknown ? colors.subtext1 : meta.color,
        spent: 0,
        cappedSpent: 0,
        goal: 0,
      };
    }
    totalsByCat[catId].spent += timeSpent;
    totalsByCat[catId].cappedSpent += cappedSpent;
    totalsByCat[catId].goal += timeGoal;
    totalSpent += timeSpent;
  });

  const sortedCats = Object.values(totalsByCat).sort((a, b) => b.spent - a.spent);
  const top1 = sortedCats[0];
  const top2 = sortedCats[1];
  const othersSpent = Math.max(
    totalSpent - (top1?.spent ?? 0) - (top2?.spent ?? 0),
    0,
  );
  const totalGoal = sortedCats.reduce((sum, cat) => sum + (cat.goal ?? 0), 0);
  const totalCappedSpent = sortedCats.reduce((sum, cat) => sum + (cat.cappedSpent ?? 0), 0);
  const useCappedCompletion = settings$.productivity.capCategoryCompletion.get();
  const totalRemaining = sortedCats.reduce((sum, cat) => {
    const completionSpent = useCappedCompletion ? cat.cappedSpent : cat.spent;
    return sum + Math.max((cat.goal ?? 0) - completionSpent, 0);
  }, 0);
  const hasGoals = totalGoal > 0;
  const hideGoalRingOnComplete = settings$.productivity.hideGoalRingOnComplete.get();
  const shouldHideGoalRing = hideGoalRingOnComplete && hasGoals && totalRemaining <= 0;
  const top1Completion = useCappedCompletion ? (top1?.cappedSpent ?? 0) : (top1?.spent ?? 0);
  const top2Completion = useCappedCompletion ? (top2?.cappedSpent ?? 0) : (top2?.spent ?? 0);
  const top1Remaining = Math.max((top1?.goal ?? 0) - top1Completion, 0);
  const top2Remaining = Math.max((top2?.goal ?? 0) - top2Completion, 0);
  const othersGoal = Math.max(totalGoal - (top1?.goal ?? 0) - (top2?.goal ?? 0), 0);
  const othersCompletionSpent = Math.max(
    (useCappedCompletion ? totalCappedSpent : totalSpent) - top1Completion - top2Completion,
    0,
  );
  const othersRemaining = Math.max(othersGoal - othersCompletionSpent, 0);
  const othersColor = colors.subtext0;
  const primaryBars = (() => {
    const bars = [];
    if (sortedCats.length === 0) {
      return [];
    }
    if (sortedCats.length === 1) {
      bars.push({
        label: top1.label,
        color: top1.color,
        value: top1.goal > 0 ? Math.min(top1Completion / top1.goal, 1) : 0,
      });
      return bars;
    }
    if (sortedCats.length === 2) {
      bars.push(
        {
          label: top1.label,
          color: top1.color,
          value: top1.goal > 0 ? Math.min(top1Completion / top1.goal, 1) : 0,
        },
        {
          label: top2.label,
          color: top2.color,
          value: top2.goal > 0 ? Math.min(top2Completion / top2.goal, 1) : 0,
        },
      );
      return bars;
    }
    bars.push(
      {
        label: top1.label,
        color: top1.color,
        value: top1.goal > 0 ? Math.min(top1Completion / top1.goal, 1) : 0,
      },
      {
        label: top2.label,
        color: top2.color,
        value: top2.goal > 0 ? Math.min(top2Completion / top2.goal, 1) : 0,
      },
      {
        label: 'Others',
        color: othersColor,
        value: othersGoal > 0 ? Math.min(othersCompletionSpent / othersGoal, 1) : 0,
      },
    );
    return bars;
  })();
  const categorySegments = (
    hasGoals
      ? [
          top1Remaining > 0 ? { color: top1?.color ?? colors.primary, value: top1Remaining / FULL_DAY_SECONDS } : null,
          top2Remaining > 0 ? { color: top2?.color ?? colors.secondary, value: top2Remaining / FULL_DAY_SECONDS } : null,
          othersRemaining > 0 ? { color: othersColor, value: othersRemaining / FULL_DAY_SECONDS } : null,
        ]
      : [
          top1 ? { color: top1.color, value: (top1.spent ?? 0) / FULL_DAY_SECONDS } : null,
          top2 ? { color: top2.color, value: (top2.spent ?? 0) / FULL_DAY_SECONDS } : null,
          othersSpent > 0 ? { color: othersColor, value: othersSpent / FULL_DAY_SECONDS } : null,
        ]
  ).filter(Boolean) as { color: string; value: number }[];
  const visibleCategorySegments = shouldHideGoalRing ? [] : categorySegments;

  const runningTaskId = CurrentTaskID$.get();
  const runningTask =
    runningTaskId !== -1 ? tasks$.entities[runningTaskId]?.get?.() : undefined;
  const runningCatColor = runningTask
    ? getCategoryMeta(runningTask.category ?? 0).color || colors.secondary
    : colors.secondary;
  const runningGoal = runningTask?.timeGoal ?? 0;
  const runningSpent = runningTask?.timeSpent ?? 0;

  const runningPercent = runningGoal > 0 ? Math.min(runningSpent / runningGoal, 1) : 0;
  const dayProgressSeconds = Math.max(0, now.diff(today, 'seconds'));
  const dayPercent = Math.min(dayProgressSeconds / FULL_DAY_SECONDS, 1);
  const completionPercent = hasGoals ? Math.min(totalSpent / totalGoal, 1) : dayPercent;
  const headerPercentLabel = `${Math.round(completionPercent * 100)}%`;

  const stopCurrentWithSplitPrompt = () => {
    const running = activeTimer$.get();
    if (!running) {
      void stopTaskTimer();
      return;
    }
    const startKey = moment(running.startedAt).format('YYYY-MM-DD');
    const todayKey = moment().format('YYYY-MM-DD');
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
    const message = 'This task started yesterday. Split time between yesterday and today?';
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: message,
          options: ['Split across days', 'Keep on previous day', 'Cancel'],
          cancelButtonIndex: 2,
        },
        (index) => {
          if (index === 0) doStop(true);
          else if (index === 1) doStop(false);
        },
      );
    } else {
      Alert.alert(
        'Split time?',
        message,
        [
          { text: 'Split', onPress: () => doStop(true) },
          { text: 'Keep on previous day', onPress: () => doStop(false) },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true },
      );
    }
  };

  const confirmStop = () => {
    const title = 'Stop task?';
    const message = 'Do you want to stop the current task?';
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title,
          message,
          options: ['Stop', 'Cancel'],
          destructiveButtonIndex: 0,
          cancelButtonIndex: 1,
        },
        (index) => {
          if (index === 0) {
            stopCurrentWithSplitPrompt();
          }
        },
      );
    } else {
      Alert.alert(
        title,
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Stop', style: 'destructive', onPress: stopCurrentWithSplitPrompt },
        ],
        { cancelable: true },
      );
    }
  };

  return (
    <ScreenView style={styles.container}>
      <View style={[styles.titleContainer, { paddingTop: insets.top }]}>
        <Text style={[styles.title]}>Day Progress</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Text
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            ellipsizeMode="tail"
            style={styles.taskTitle}
          >
            {runningTask?.title ?? today.format('ddd, MMMM D')}
          </Text>
          {runningTask ? (
            <Text style={styles.titlePercent}>({headerPercentLabel})</Text>
          ) : null}
        </View>

        <RadialProgressBar
          dayPercent={dayPercent}
          categorySegments={visibleCategorySegments}
          currentPercent={runningPercent}
          showCurrentRing={!!runningTask}
          currentColor={runningTask ? runningCatColor : undefined}
          centerPercentLabel={`${Math.round(dayPercent * 100)}%`}
          centerPrimary={runningTask ? formatSeconds(runningSpent) : now.format('hh:mm')}
          centerSecondary={runningTask ? formatSeconds(runningGoal) : now.format('A')}
          showDayRing={true}
          showStopButton={!!runningTask}
          onStopPress={confirmStop}
          centerPercentOffset={runningTask ? -40 : 0}
          centerSecondaryOffset={runningTask ? 40 : 0}
        />

        <HorizontalProgressRow
          bars={primaryBars}
          styles={styles}
          width={contentWidth}
          trackColor={palette.surface1}
        />

        <View style={[styles.listHeader, { width: contentWidth }]}>
          <Text style={[styles.listHeaderText]}>Task</Text>
          <Text style={[styles.listHeaderText, styles.listHeaderRight]}>Total Time</Text>
        </View>
        <View style={[styles.listDivider, { width: contentWidth }]} />
        {sortedCats.map((cat) => {
          const percent = totalSpent > 0 ? Math.round((cat.spent / totalSpent) * 100) : 0;
          return (
            <View style={[styles.listRow, { width: contentWidth }]} key={cat.id}>
              <View style={styles.listRowLeft}>
                <View style={[styles.dot, { backgroundColor: cat.color }]} />
                <Text style={styles.listRowLabel} numberOfLines={1}>
                  {cat.label}
                </Text>
                <Text style={styles.listRowPercent}>({percent}%)</Text>
              </View>
              <Text style={styles.listRowValue}>{formatSeconds(cat.spent)}</Text>
            </View>
          );
        })}
        <View style={globalTheme.tabBarAvoidingPadding} />
      </ScrollView>
    </ScreenView>
  );
});

function HorizontalProgressRow({
  bars,
  styles,
  width,
  trackColor,
}: {
  bars: { label: string; color: string; value: number }[];
  styles: ReturnType<typeof createStyles>;
  width: number;
  trackColor: string;
}) {
  const gap = 12;
  const progressWidth = Math.max(0, width);
  const items = Math.max(bars.length, 1);
  const itemWidth = Math.max(0, (progressWidth - gap * (items - 1)) / items);
  const barWidth = Math.max(0, itemWidth - 8);

  return (
    <View style={[styles.progressRow, { width: progressWidth }]}>
      {bars.map((bar, idx) => (
        <View key={`${bar.label}-${idx}`} style={{ width: itemWidth }}>
          <Text style={styles.progressLabel} numberOfLines={1} ellipsizeMode="tail">
            {bar.label}
          </Text>
          <Text style={styles.progressPercent}>{Math.round(bar.value * 100)}%</Text>
          <HorizontalProgressBar
            width={barWidth}
            percentage={Math.min(bar.value, 1)}
            color={bar.color}
            trackColor={trackColor}
          />
        </View>
      ))}
    </View>
  );
}

export default PieChartScreen;

const formatSeconds = (value: number) => {
  const total = Math.max(0, Math.floor(value));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

type ThemeTokens = ReturnType<typeof themeTokens$.get>;

const createStyles = (colors: ThemeTokens["colors"]) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  titleContainer: {
    width: '100%',
  },
  title: {
    left: horizontalPadding,
    color: colors.textStrong,
    fontSize: 28,
    marginLeft: 0,
    fontWeight: 'bold',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '100%',
    paddingHorizontal: horizontalPadding,
    paddingTop: 15,
    gap: 6,
  },
  taskTitle: {
    fontSize: 20,
    color: colors.textStrong,
    fontWeight: '700',
    alignContent: 'flex-end',
    flexShrink: 1,
    maxWidth: '100%',
    textAlign: 'center',
  },
  titlePercent: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.subtext1,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
    alignSelf: 'center',
  },
  progressLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.subtext1,
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.subtext1,
    marginBottom: 6,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 8,
    alignSelf: 'center',
  },
  listDivider: {
    height: 1,
    backgroundColor: colors.surface1,
    alignSelf: 'center',
    marginBottom: 6,
  },
  listHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.subtext1,
  },
  listHeaderRight: {
    textAlign: 'right',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    alignSelf: 'center',
  },
  listRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listRowLabel: {
    fontSize: 16,
    color: colors.text,
    flexShrink: 1,
    fontWeight: '600',
  },
  listRowPercent: {
    fontSize: 16,
    color: colors.subtext1,
    fontWeight: '600',
  },
  listRowValue: {
    width: 64,
    textAlign: 'right',
    fontSize: 14,
    color: colors.text,
    fontWeight: '700',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
