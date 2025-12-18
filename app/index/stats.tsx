import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, ScrollView, StyleSheet, TouchableOpacity, View, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Text, ScreenView } from '@/components/Themed';
import { horizontalPadding } from '@/constants/globalThemeVar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import moment, { Moment } from 'moment';
import { loadDay, tasks$, Category$ } from '@/utils/stateManager';
import { colorTheme } from '@/constants/Colors';

type BarSegment = { value: number; color: string };
type DayBar = { label: string; date: number; segments: BarSegment[]; active?: boolean; moment: Moment };
type TaskRow = { title: string; date: string; time: string; goal: string; percent: string };
type CategoryBlock = { title: string; accent: string; percent: string; total: string; tasks: TaskRow[] };

const palette = colorTheme.catppuccin.latte;

const secondsToHms = (value: number) => {
  const total = Math.max(0, Math.floor(value));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const DayBarColumn = ({ item, onPress }: { item: DayBar; onPress: () => void }) => (
  <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.dayColumn}>
    <Text style={[styles.dayLabel, item.active && styles.dayLabelActive]}>{item.label}</Text>
    <View style={[styles.barShell, item.active && styles.barShellActive]}>
      {item.segments.map((seg, idx) => (
        <View key={idx} style={[styles.barSegment, { flex: seg.value, backgroundColor: seg.color }]} />
      ))}
    </View>
    <Text style={styles.dateLabel}>{item.date}</Text>
  </TouchableOpacity>
);

const TaskRowItem = ({ task }: { task: TaskRow }) => (
  <View style={styles.taskRow}>
    <View>
      <Text style={styles.taskTitle}>{task.title}</Text>
      <Text style={styles.taskDate}>{task.date}</Text>
    </View>
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={styles.taskTime}>
        {task.time} <Text style={styles.taskGoal}>/ {task.goal}</Text>
      </Text>
      <Text style={styles.taskPercent}>{task.percent}</Text>
    </View>
  </View>
);

const CategoryCard = ({ block }: { block: CategoryBlock }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={[styles.cardTitle, { color: block.accent }]}>{block.title}</Text>
      <Text style={styles.cardPercent}>({block.percent})</Text>
      <View style={styles.cardSpacer} />
      <Text style={styles.cardTotal}>{block.total}</Text>
    </View>
    <View style={styles.divider} />
    {block.tasks.map((task, idx) => (
      <React.Fragment key={`${block.title}-${idx}`}>
        <TaskRowItem task={task} />
        {idx !== block.tasks.length - 1 && <View style={styles.rowDivider} />}
      </React.Fragment>
    ))}
  </View>
);

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const weekListRef = useRef<FlatList<any>>(null);
  const { width } = Dimensions.get('window');

  const [selectedDate, setSelectedDate] = useState(moment());
  const [centerIndex] = useState(1); // constant center slot
  const [dataVersion, setDataVersion] = useState(0);

  const scrollToCenter = (ref: React.RefObject<FlatList<any>>) => {
    ref.current?.scrollToIndex({ index: 1, animated: false });
  };

  const ensureWeekLoaded = useCallback(async (anchor: Moment) => {
    const start = anchor.clone().startOf('week').subtract(7, 'day'); // previous, current, next weeks window
    const days: Date[] = [];
    for (let i = 0; i < 21; i++) {
      days.push(start.clone().add(i, 'day').toDate());
    }
    await Promise.all(days.map((d) => loadDay(d)));
    setDataVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    ensureWeekLoaded(selectedDate);
  }, [selectedDate, ensureWeekLoaded]);

  useEffect(() => {
    scrollToCenter(weekListRef);
  }, []);

  const getTasksForDate = useCallback((date: Moment) => {
    const key = date.format('YYYY-MM-DD');
    const ids = tasks$.lists.byDate[key]?.get?.() ?? [];
    return ids
      .map((id: number) => tasks$.entities[id]?.get?.())
      .filter(Boolean) as ReturnType<typeof tasks$.entities[number]['get']>[];
  }, []);

  const buildSegments = (date: Moment): BarSegment[] => {
    const fullDaySeconds = 24 * 3600;
    const tasksForDay = getTasksForDate(date);
    const timeSpent = tasksForDay.reduce((sum, t) => sum + (t.timeSpent ?? 0), 0);
    const timeGoal = tasksForDay.reduce((sum, t) => sum + (t.timeGoal ?? 0), 0);

    const spentRatio = Math.min(timeSpent / fullDaySeconds, 1);
    const goalRatio = Math.min(timeGoal / fullDaySeconds, 1);

    const active = date.isSame(selectedDate, 'day');
    const colors = {
      spent: active ? palette.green : '#9ad2b6',
      goal: active ? palette.peach : '#f2c2ae',
    };

    if (goalRatio === 0 && spentRatio === 0) {
      return [{ value: 0.35, color: active ? palette.overlay1 : palette.overlay0 }];
    }

    if (spentRatio >= goalRatio) {
      return [{ value: Math.max(spentRatio, goalRatio), color: colors.spent }];
    }

    return [
      { value: spentRatio, color: colors.spent },
      { value: Math.max(goalRatio - spentRatio, 0), color: colors.goal },
    ];
  };

  const weeks = useMemo(() => {
    // Build 3 panes relative to selectedDate: [prev week, current week, next week]
    const base = selectedDate.clone().startOf('week').subtract(1, 'week');
    return Array.from({ length: 3 }).map((_, paneIndex) => {
      const start = base.clone().add(paneIndex, 'week');
      return Array.from({ length: 7 }).map((__, i) => {
        const d = start.clone().add(i, 'day');
        return {
          label: d.format('dd')[0],
          date: d.date(),
          segments: buildSegments(d),
          active: d.isSame(selectedDate, 'day'),
          moment: d,
        } as DayBar;
      });
    });
  }, [selectedDate, dataVersion]);

  const handleWeekSwipe = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    const direction = index > centerIndex ? 1 : index < centerIndex ? -1 : 0;
    if (direction !== 0) {
      const next = selectedDate.clone().add(direction, 'week');
      setSelectedDate(next);
      requestAnimationFrame(() => scrollToCenter(weekListRef));
    } else {
      requestAnimationFrame(() => scrollToCenter(weekListRef));
    }
  };

  const handleDayPress = (d: Moment) => {
    setSelectedDate(d);
  };

  const categoryBlocks = useMemo(() => {
    const tasksForDay = getTasksForDate(selectedDate);
    const totalsByCategory = tasksForDay.reduce((acc, t) => {
      const cat = t.category ?? 0;
      if (!acc[cat]) acc[cat] = { spent: 0, goal: 0, tasks: [] as typeof tasksForDay };
      acc[cat].spent += t.timeSpent ?? 0;
      acc[cat].goal += t.timeGoal ?? 0;
      acc[cat].tasks.push(t);
      return acc;
    }, {} as Record<number, { spent: number; goal: number; tasks: typeof tasksForDay }>);

    const totalGoal = Object.values(totalsByCategory).reduce((sum, v) => sum + v.goal, 0);

    return Object.entries(totalsByCategory).map(([catId, data]) => {
      const node = (Category$ as any)[Number(catId)];
      const label = node?.label?.get?.() ?? `Category ${catId}`;
      const accent = node?.color?.get?.() ?? palette.peach;

      return {
        title: label,
        accent,
        percent: totalGoal > 0 ? `${Math.round((data.goal / totalGoal) * 100)}%` : '0%',
        total: secondsToHms(data.spent),
        tasks: data.tasks.map((task) => ({
          title: task.title,
          date: selectedDate.format('MMMM D, YYYY'),
          time: secondsToHms(task.timeSpent ?? 0),
          goal: secondsToHms(task.timeGoal ?? 0),
          percent: task.timeGoal ? `${Math.round(((task.timeSpent ?? 0) / task.timeGoal) * 100)}%` : '0%',
        })),
      } as CategoryBlock;
    });
  }, [getTasksForDate, selectedDate, dataVersion]);

  return (
    <ScreenView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.titleContainer, { paddingTop: insets.top }]}>
          <Text style={styles.title}>Calendar</Text>
        </View>

        <FlatList
          ref={weekListRef}
          data={weeks}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={1}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          onMomentumScrollEnd={handleWeekSwipe}
          keyExtractor={(_, index) => `week-${index}`}
          renderItem={({ item: week }) => (
            <View style={[styles.weekRow, { width }]}>
              {week.map((item) => (
                <DayBarColumn
                  key={item.label + item.date + item.moment.week()}
                  item={item}
                  onPress={() => handleDayPress(item.moment)}
                />
              ))}
            </View>
          )}
        />

        <View style={styles.dateHeading}>
          <Text style={styles.dateHeadingText}>{selectedDate.format('MMMM D, YYYY (ddd)')}</Text>
        </View>

        <View style={{ gap: 16 }}>
          {categoryBlocks.map((block) => (
            <CategoryCard key={block.title} block={block} />
          ))}
        </View>
      </ScrollView>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
  },
  titleContainer: {
    width: '100%',
    marginBottom: 12,
  },
  title: {
    left: horizontalPadding - 16,
    color: '#000',
    fontSize: 28,
    marginLeft: 0,
    fontWeight: 'bold',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
    paddingHorizontal: 4,
    marginBottom: 16,
    marginTop: 4,
  },
  dayColumn: {
    alignItems: 'center',
    width: '14%',
  },
  dayLabel: {
    fontSize: 13,
    color: '#7f8190',
    marginBottom: 6,
    fontWeight: '600',
  },
  dayLabelActive: {
    color: '#000',
    fontWeight: '700',
  },
  barShell: {
    width: 32,
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: palette.overlay0,
    justifyContent: 'flex-end',
  },
  barShellActive: {
    backgroundColor: palette.overlay2,
  },
  barSegment: {
    width: '100%',
  },
  dateLabel: {
    marginTop: 6,
    fontSize: 13,
    color: '#6b6d78',
  },
  dateHeading: {
    width: '100%',
    marginBottom: 12,
  },
  dateHeadingText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  card: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#f5f4fb',
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardPercent: {
    fontSize: 16,
    marginLeft: 6,
    color: '#6b6d78',
    fontWeight: '600',
  },
  cardSpacer: {
    flex: 1,
  },
  cardTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6b6d78',
  },
  divider: {
    marginTop: 10,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  taskDate: {
    fontSize: 13,
    color: '#6b6d78',
    marginTop: 2,
  },
  taskTime: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  taskGoal: {
    fontSize: 14,
    color: '#888ca0',
    fontWeight: '600',
  },
  taskPercent: {
    fontSize: 13,
    color: '#6b6d78',
    marginTop: 2,
    fontWeight: '600',
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.12)',
  },
});
