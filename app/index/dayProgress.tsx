import React, { useEffect, useRef } from 'react';
import { Dimensions, StyleSheet, View, ScrollView } from 'react-native';
import { Text, ScreenView } from '@/components/Themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colorTheme$, tasks$, Category$, CurrentTaskID$ } from '@/utils/stateManager';
import RadialProgressBar from '@/components/custom_ui/RadialProgressBar';
import HorizontalProgressBar from '@/components/custom_ui/HorizontalProgressBar';
import { horizontalPadding } from '@/constants/globalThemeVar';
import moment from 'moment';
import { loadDay } from '@/utils/stateManager';
import { observer } from '@legendapp/state/react';

type CatSummary = {
  id: number;
  label: string;
  color: string;
  spent: number;
  goal: number;
};

const FULL_DAY_SECONDS = 24 * 3600;

const PieChartScreen = observer(() => {
  const insets = useSafeAreaInsets();
  const todayRef = useRef(moment().startOf('day'));
  const today = todayRef.current;
  const dateKey = today.format('YYYY-MM-DD');

  useEffect(() => {
    void loadDay(today.toDate());
  }, [today]);

  const byDate = tasks$.lists.byDate.get();
  const ids = byDate[dateKey] ?? [];
  const entities = tasks$.entities.get();
  const tasksForDay = ids
    .map((id: number) => entities[id])
    .filter(Boolean) as { category: number; timeSpent: number; timeGoal: number; title: string }[];

  const totalsByCat: Record<number, CatSummary> = {};
  let totalSpent = 0;
  tasksForDay.forEach((t) => {
    const catId = t.category ?? 0;
    if (!totalsByCat[catId]) {
      const node = (Category$ as any)[catId];
      totalsByCat[catId] = {
        id: catId,
        label: node?.label?.get?.() ?? `Category ${catId}`,
        color: node?.color?.get?.() ?? colorTheme$.colors.subtext0.get(),
        spent: 0,
        goal: 0,
      };
    }
    totalsByCat[catId].spent += t.timeSpent ?? 0;
    totalsByCat[catId].goal += t.timeGoal ?? 0;
    totalSpent += t.timeSpent ?? 0;
  });

  const sortedCats = Object.values(totalsByCat).sort((a, b) => b.spent - a.spent);
  const top1 = sortedCats[0];
  const top2 = sortedCats[1];
  const othersSpent = Math.max(
    totalSpent - (top1?.spent ?? 0) - (top2?.spent ?? 0),
    0,
  );
  const othersColor = colorTheme$.colors.subtext0.get();
  const primaryBars = [
    top1
      ? { label: top1.label, color: top1.color, value: top1.spent / FULL_DAY_SECONDS }
      : { label: 'Top Category', color: colorTheme$.colors.primary.get(), value: 0 },
    top2
      ? { label: top2.label, color: top2.color, value: top2.spent / FULL_DAY_SECONDS }
      : { label: 'Second', color: colorTheme$.colors.secondary.get(), value: 0 },
    { label: 'Others', color: othersColor, value: othersSpent / FULL_DAY_SECONDS },
  ];
  const categorySegments = [
    top1 ? { color: top1.color, value: (top1.spent ?? 0) / FULL_DAY_SECONDS } : null,
    top2 ? { color: top2.color, value: (top2.spent ?? 0) / FULL_DAY_SECONDS } : null,
    othersSpent > 0 ? { color: othersColor, value: othersSpent / FULL_DAY_SECONDS } : null,
  ].filter(Boolean) as { color: string; value: number }[];

  const runningTaskId = CurrentTaskID$.get();
  const runningTask =
    runningTaskId !== -1 ? tasks$.entities[runningTaskId]?.get?.() : undefined;
  const runningCatColor =
    runningTask && (Category$ as any)[runningTask.category]?.color?.get?.()
      ? (Category$ as any)[runningTask.category].color.get()
      : colorTheme$.colors.secondary.get();
  const runningGoal = runningTask?.timeGoal ?? 0;
  const runningSpent = runningTask?.timeSpent ?? 0;

  const runningPercent = runningGoal > 0 ? Math.min(runningSpent / runningGoal, 1) : 0;
  const dayPercent = Math.min(totalSpent / FULL_DAY_SECONDS, 1);

  return (
    <ScreenView style={styles.container}>
      <View style={[styles.titleContainer, { paddingTop: insets.top }]}>
        <Text style={[styles.title]}>Day Progress</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.taskTitle]}
        >
          {runningTask?.title ?? today.format('ddd, MMMM D')}
        </Text>

        <RadialProgressBar
          dayPercent={dayPercent}
          categorySegments={categorySegments}
          currentPercent={runningPercent}
          showCurrentRing={!!runningTask}
          currentColor={runningTask ? runningCatColor : undefined}
          centerPercentLabel={`${Math.round(dayPercent * 100)}%`}
          centerPrimary={runningTask ? formatSeconds(runningSpent) : today.format('hh:mm')}
          centerSecondary={runningTask ? formatSeconds(runningGoal) : today.format('A')}
        />

        <HorizontalProgressRow bars={primaryBars} />

        <View style={styles.listHeader}>
          <Text style={[styles.listHeaderText]}>Task</Text>
          <Text style={[styles.listHeaderText]}>Total Time</Text>
          <Text style={[styles.listHeaderText]}>% of Day</Text>
        </View>
        {sortedCats.map((cat) => {
          const percent = totalSpent > 0 ? Math.round((cat.spent / totalSpent) * 100) : 0;
          return (
            <View style={styles.listRow} key={cat.id}>
              <View style={styles.listRowLeft}>
                <View style={[styles.dot, { backgroundColor: cat.color }]} />
                <Text style={styles.listRowLabel} numberOfLines={1}>
                  {cat.label}
                </Text>
              </View>
              <Text style={styles.listRowValue}>{formatSeconds(cat.spent)}</Text>
              <Text style={styles.listRowValue}>{percent}%</Text>
            </View>
          );
        })}
      </ScrollView>
    </ScreenView>
  );
});

function HorizontalProgressRow({ bars }: { bars: { label: string; color: string; value: number }[] }) {
  const windowWidth = Dimensions.get('window').width;
  const MAX_WIDTH = 500;
  const padding = 20;
  const progressWidth = windowWidth - padding * 2 > 800 ? MAX_WIDTH : windowWidth - padding * 2;
  const itemWidth = (progressWidth - padding * 2) / 3;

  return (
    <View style={[styles.progressRow, { width: progressWidth }]}>
      {bars.map((bar, idx) => (
        <View key={`${bar.label}-${idx}`} style={{ width: itemWidth }}>
          <Text style={styles.progressLabel} numberOfLines={1} ellipsizeMode="tail">
            {bar.label}
          </Text>
          <Text style={styles.progressPercent}>{Math.round(bar.value * 100)}%</Text>
          <HorizontalProgressBar width={itemWidth} percentage={Math.min(bar.value, 1)} color={bar.color} />
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

const styles = StyleSheet.create({
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
    color: '#000',
    fontSize: 28,
    marginLeft: 0,
    fontWeight: 'bold',
  },
  taskTitle: {
    paddingTop: 15,
    fontSize: 20,
    color: colorTheme$.nativeTheme.colors.text.get(),
    fontWeight: '700',
    alignContent: 'flex-end',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b6d78',
    marginBottom: 4,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: 20,
    marginBottom: 8,
  },
  listHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    paddingVertical: 8,
  },
  listRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listRowLabel: {
    fontSize: 14,
    color: '#000',
    flexShrink: 1,
  },
  listRowValue: {
    width: 80,
    textAlign: 'right',
    fontSize: 13,
    color: '#000',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
