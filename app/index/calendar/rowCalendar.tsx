import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  InteractionManager,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import moment, { Moment } from 'moment';
import StackedProgressRing from '@/components/StackedProgressRing';
import { initializeDB } from '@/utils/database';
import { observable } from '@legendapp/state';
import { useRouter } from 'expo-router';
import { ScreenView } from '@/components/Themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { activeTimer$ } from '@/utils/activeTimerStore';
import { uiTick$ } from '@/utils/timerService';
import { getNow } from '@/utils/timeOverride';
import { globalTheme, horizontalPadding } from '@/constants/globalThemeVar';
import { colorTheme } from '@/constants/Colors';
import { loadDay, tasks$ } from '@/utils/stateManager';
import { ensureDirtyTasksHydrated, flushDirtyTasksToDB, getDirtySnapshot } from '@/utils/dirtyTaskStore';
import { TaskList } from '@/components/task-list/TaskList';

const { width } = Dimensions.get('window');
const PANES = 5;
const CENTER_INDEX = Math.floor(PANES / 2);
const WEEK_ROW_HEIGHT = 120;

export const selectedDate$ = observable(moment(getNow()));

type WeekPane = {
  key: string;
  start: Moment;
};


const buildPane = (start: Moment, offsetWeeks: number): WeekPane => {
  const paneStart = start.clone().add(offsetWeeks, 'week').startOf('week');
  return { key: paneStart.toISOString(), start: paneStart };
};

const generatePaneSet = (center: Moment): WeekPane[] => {
  const base = center.clone().startOf('week').subtract(CENTER_INDEX, 'week');
  return Array.from({ length: PANES }).map((_, idx) => buildPane(base, idx));
};

const palette = colorTheme.catppuccin.latte;


export default function FlatListSwiperExample() {
  const weekScrollRef = useRef<ScrollView>(null);
  const dayListRef = useRef<FlatList<Moment>>(null);
  const followTodayRef = useRef(true);
  const todayKeyRef = useRef(moment(getNow()).format('YYYY-MM-DD'));

  const [selectedDate, setSelectedDate] = useState(moment(getNow()));
  const [panes, setPanes] = useState<WeekPane[]>(() => generatePaneSet(moment(getNow())));
  const [isSnapping, setIsSnapping] = useState(false);
  const [isDaySnapping, setIsDaySnapping] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pendingLoadsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = selectedDate$.onChange(({ value }) => {
      setSelectedDate(value.clone());
      setPanes(generatePaneSet(value));
      followTodayRef.current = value.isSame(moment(getNow()), 'day');
    });
    const initial = selectedDate$.get().clone();
    setSelectedDate(initial);
    setPanes(generatePaneSet(initial));
    followTodayRef.current = initial.isSame(moment(getNow()), 'day');
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      } else {
        unsubscribe?.off?.();
      }
    };
  }, []);

  const days = useMemo(() => {
    const center = selectedDate.clone();
    return [
      center.clone().subtract(1, 'day'),
      center,
      center.clone().add(1, 'day'),
    ];
  }, [selectedDate]);

  const scrollDayListToCenter = useCallback(() => {
    dayListRef.current?.scrollToIndex({ index: 1, animated: false });
  }, []);

  useEffect(() => {
    scrollDayListToCenter();
  }, [days, scrollDayListToCenter]);

  // Ensure that the date is cache synced when...
  // 1. (JUST GOTTA LOOK AT THE IMPLEMENATION MORE CLOSELY LATER)
  const ensureDateCached = useCallback(
    async (date: Moment) => {
      const key = date.format('YYYY-MM-DD');
      const existing = tasks$.lists.byDate[key]?.get?.();
      if (existing && existing.length) {
        return existing;
      }
      if (pendingLoadsRef.current.has(key)) {
        return existing ?? [];
      }
      pendingLoadsRef.current.add(key);
      try {
        await loadDay(date.toDate());
        setDataVersion((v) => v + 1);
      } finally {
        pendingLoadsRef.current.delete(key);
      }
      return tasks$.lists.byDate[key]?.get?.() ?? [];
    },
    [setDataVersion],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const nextKey = moment(getNow()).format('YYYY-MM-DD');
      if (nextKey === todayKeyRef.current) return;
      todayKeyRef.current = nextKey;
      if (!followTodayRef.current) return;
      const next = moment(getNow()).startOf('day');
      selectedDate$.set(next);
      setSelectedDate(next);
      setPanes(generatePaneSet(next));
      followTodayRef.current = true;
      void ensureDateCached(next);
    }, 30000);
    return () => clearInterval(interval);
  }, [ensureDateCached]);

  // Only prefetch current week's days; debounce to avoid hammering JS thread
  useEffect(() => {
    let cancelled = false;
    const task = InteractionManager.runAfterInteractions(async () => {
      const loaders: Promise<any>[] = [];
      const centerStart = panes[CENTER_INDEX]?.start;
      if (centerStart) {
        for (let i = 0; i < 7; i++) {
          loaders.push(ensureDateCached(centerStart.clone().add(i, 'day')));
        }
      }
      await Promise.all(loaders);
    });
    return () => {
      cancelled = true;
      task.cancel();
    };
  }, [panes, ensureDateCached]);

  useEffect(() => {
    const t = InteractionManager.runAfterInteractions(() => {
      void ensureDirtyTasksHydrated().then(() => ensureDateCached(selectedDate));
    });
    return () => t.cancel();
  }, [ensureDateCached, selectedDate]);

  const scrollToCenter = useCallback((animated = false) => {
    weekScrollRef.current?.scrollTo({ x: width * CENTER_INDEX, animated });
  }, []);

  useEffect(() => {
    scrollToCenter();
  }, [panes, scrollToCenter]);

  useEffect(() => {
    setIsSnapping(false);
    setIsDaySnapping(false);
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      const now = moment(getNow()).startOf('day');
      const current = selectedDate$.get().clone();
      if (followTodayRef.current && !now.isSame(current, 'day')) {
        selectedDate$.set(now);
        setSelectedDate(now);
        setPanes(generatePaneSet(now));
        ensureDateCached(now);
      }
      return () => {};
    }, [ensureDateCached])
  );

  const finalizeSnap = useCallback(() => {
    requestAnimationFrame(() => {
      scrollToCenter();
      setTimeout(() => setIsSnapping(false), 300);
    });
  }, [scrollToCenter]);

  const handleWeekSwipe = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(event.nativeEvent.contentOffset.x / width);
      const direction = idx - CENTER_INDEX;
      if (direction !== 0) {
        setIsSnapping(true);
        setSelectedDate((prev) => {
          const nextDate = prev.clone().add(direction, 'week');
          setPanes(generatePaneSet(nextDate));
          selectedDate$.set(nextDate);
          followTodayRef.current = nextDate.isSame(moment(getNow()), 'day');
          return nextDate;
        });
        finalizeSnap();
      } else {
        finalizeSnap();
      }
    },
    [finalizeSnap],
  );

  const handleDaySwipe = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(event.nativeEvent.contentOffset.x / width);
      const direction = idx - 1;
      if (direction !== 0) {
        const nextDate = selectedDate.clone().add(direction, 'day');
        setSelectedDate(nextDate);
        setPanes(generatePaneSet(nextDate));
        selectedDate$.set(nextDate);
        followTodayRef.current = nextDate.isSame(moment(getNow()), 'day');
        setIsSnapping(true);
        finalizeSnap();
      }
      setIsDaySnapping(true);
      requestAnimationFrame(() => {
        scrollDayListToCenter();
        setTimeout(() => setIsDaySnapping(false), 150);
      });
    },
    [finalizeSnap, scrollDayListToCenter, selectedDate],
  );

  const handleSelectWeekDay = useCallback(
    (day: Moment) => {
      const normalized = day.clone();
      setSelectedDate(normalized);
      setPanes(generatePaneSet(normalized));
      selectedDate$.set(normalized);
      followTodayRef.current = normalized.isSame(moment(getNow()), 'day');
      setIsSnapping(true);
      finalizeSnap();
    },
    [finalizeSnap],
  );

  const getTasksForDate = useCallback(
    (date: Moment) => {
      const key = date.format('YYYY-MM-DD');
      // tracked read to respond to changes
      uiTick$.get();
      const ids = tasks$.lists.byDate[key]?.get?.() ?? [];
      if (!ids.length) return [];
      const dirty = getDirtySnapshot();
      const running = activeTimer$.get();
      return ids
        .map((id: number) => {
          const base = tasks$.entities[id]?.get?.();
          if (!base) return null;
          const dayKey = date.format("YYYY-MM-DD");
          const dirtyEntry = dirty[id];
          const dirtySpent = dirtyEntry?.byDate?.[dayKey] ?? dirtyEntry?.timeSpent;
          let timeSpent = dirtySpent ?? base.timeSpent ?? 0;
          if (running && running.taskId === id) {
            timeSpent = running.baseSeconds + Math.max(0, Math.floor((Date.now() - running.startedAt) / 1000));
          }
          return { ...base, timeSpent };
        })
        .filter(Boolean) as ReturnType<typeof tasks$.entities[number]['get']>[];
    },
    [ensureDateCached, dataVersion],
  );

  const getDayProgress = useCallback(
    (date: Moment) => {
      const tasksForDay = getTasksForDate(date);
      const taskCount = tasksForDay.length;
      const goalTasks = tasksForDay.filter((t) => (t.timeGoal ?? 0) > 0);
      const timeSpent = goalTasks.reduce((sum, t) => sum + (t.timeSpent ?? 0), 0);
      const timeGoal = goalTasks.reduce((sum, t) => sum + (t.timeGoal ?? 0), 0);

      return {
        taskCount,
        spentRatio: timeGoal > 0 ? Math.min(timeSpent / timeGoal, 1) : 0,
        hasGoal: timeGoal > 0,
      };
    },
    [getTasksForDate],
  );

  const renderWeek = useCallback(
    (pane: WeekPane) => {
      const weekDays = Array.from({ length: 7 }).map((_, idx) => pane.start.clone().add(idx, 'day'));
      return (
        <View style={styles.itemRowContainer}>
          <View style={styles.itemRow}>
            {weekDays.map((day) => {
              const isActive = day.isSame(selectedDate, 'day');
              const { taskCount, spentRatio, hasGoal } = getDayProgress(day);
              const inactiveGoalColor = `${palette.peach}66`;
              const hasTasks = hasGoal;
              const goalColor = isActive ? palette.peach : inactiveGoalColor;
              const trackColor = hasTasks ? goalColor : palette.surface1;
              const segments = [];
              if (taskCount > 0 && spentRatio > 0) {
                segments.push({ value: spentRatio, color: palette.green });
              }
              const taskLabel = taskCount > 99 ? "99+" : `${taskCount}`;
              return (
                <TouchableWithoutFeedback key={day.toISOString()} onPress={() => handleSelectWeekDay(day)}>
                  <View style={[styles.item, !isActive && styles.itemInactive]}>
                    <Text style={[styles.itemWeekday]}>{day.format('ddd')}</Text>
                    <StackedProgressRing
                      size={46}
                      strokeWidth={7}
                      trackColor={trackColor}
                      segments={segments}
                      centerLabel={taskLabel}
                      centerLabelStyle={{ color: isActive ? palette.text : palette.subtext1 }}
                    />
                    <Text style={styles.itemDate}>{day.date()}</Text>
                  </View>
                </TouchableWithoutFeedback>
              );
            })}
          </View>
        </View>
      );
    },
    [getDayProgress, handleSelectWeekDay, selectedDate],
  );

  const insets = useSafeAreaInsets();
  const tabBarHeight = 60 + insets.bottom;
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await flushDirtyTasksToDB();
      await ensureDirtyTasksHydrated();
      await loadDay(selectedDate.toDate());
    } finally {
      setRefreshing(false);
    }
  }, [selectedDate]);

  const handleJumpToday = useCallback(() => {
    const today = moment(getNow()).startOf('day');
    selectedDate$.set(today);
    setSelectedDate(today);
    setPanes(generatePaneSet(today));
    followTodayRef.current = true;
    void ensureDateCached(today);
  }, [ensureDateCached]);

  useFocusEffect(
    useCallback(() => {
      const run = async () => {
        await ensureDirtyTasksHydrated();
        await ensureDateCached(selectedDate);
      };
      void run();
      return () => {};
    }, [ensureDateCached, selectedDate])
  );

  // TODO — move database initialization to a more appropriate place
  initializeDB(); // TODO — what in the world? Why do we need this here? Can't we just delete it? Does initializing a database that already exists hurt anything?

  const router = useRouter();


  return (
    <ScreenView style={styles.container}>
      <View style={[styles.titleContainer, { paddingTop: insets.top }]}>
        <Text style={[styles.title]}>Calendar</Text>
        <TouchableOpacity style={styles.todayButton} onPress={handleJumpToday}>
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>
      {/* <SafeAreaView style={{ }}> */}
          <View style={styles.calContainer}>
            <View style={styles.weekRowWrapper}>
              <ScrollView
                ref={weekScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                bounces={false}
                scrollEnabled={!isSnapping}
                onMomentumScrollEnd={handleWeekSwipe}
                scrollEventThrottle={16}
                contentContainerStyle={styles.weekRowContent}
              >
                {panes.map((pane) => (
                  <View key={pane.key} style={{ width }}>
                    {renderWeek(pane)}
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.dayListWrapper}>
              <FlatList
                ref={dayListRef}
                data={days}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={1}
                getItemLayout={(_, index) => ({
                  length: width,
                  offset: width * index,
                  index,
                })}
                onMomentumScrollEnd={handleDaySwipe}
                scrollEnabled={!isDaySnapping}
                style={styles.dayList}
                contentContainerStyle={styles.dayListContent}
                keyExtractor={(item, index) => `day-${index}`}
                renderItem={({ item }) => {
                  const dateKey = item.format('YYYY-MM-DD');
                  return (
                    <View style={styles.dayPane}>
                    <TouchableOpacity
                      onPress={() => {
                        router.push('/calendarDateSheet');
                      }}
                    >
                      <View style={styles.dateHeaderRow}>
                        <Text style={styles.dateHeaderText}>
                          {item.toDate().toLocaleDateString('en-US', { dateStyle: 'full' })}
                        </Text>
                        <MaterialIcons name="edit" size={18} color={palette.subtext1} />
                      </View>
                    </TouchableOpacity>
                      <ScrollView
                        style={styles.placeholder}
                        contentContainerStyle={{ paddingBottom: tabBarHeight + 12, flexGrow: 1 }}
                        bounces
                        overScrollMode="always"
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                      >
                        <TaskList
                          key={dateKey}
                          dateKey={dateKey}
                          variant="calendar"
                          emptyText="No tasks for this day"
                          emptyContainerStyle={[
                            styles.placeholderInset,
                            { alignItems: 'center', justifyContent: 'center' },
                          ]}
                          containerStyle={{ padding: 0 }}
                        />
                      </ScrollView>
                    </View>
                  );
                }}
              />
            </View>
          </View>
      {/* </SafeAreaView> */}
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    titleContainer: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: horizontalPadding,
    },
    title: {
      color: '#000',
      fontSize: 28,
      fontWeight: 'bold',
    },
    todayButton: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: 'rgba(254,100,11,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(254,100,11,0.28)',
    },
    todayButtonText: {
      color: palette.peach,
      fontSize: 14,
      fontWeight: '700',
    },
  calContainer: { flex: 1, width: '100%', paddingTop: 8, paddingBottom: 0 },
  weekRowWrapper: {
    height: WEEK_ROW_HEIGHT,
    justifyContent: 'center',
  },
  weekRowContent: {
    paddingVertical: 6,
  },
  dayListWrapper: {
    flex: 1,
  },
  dayList: {
    flex: 1,
  },
  dayListContent: {
    height: '100%',
  },
  header: { paddingHorizontal: 16 },
  // title: {
  //   fontSize: 32,
  //   fontWeight: '700',
  //   color: '#1d1d1d',
  //   marginBottom: 12,
  // },
  itemRowContainer: {
    width,
    justifyContent: 'center',
    alignItems: 'center'
  },
  itemRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: horizontalPadding,
  },
  item: {
    // TODO: add regular item styles
    // flex: 1,
    // height: 50,
    // marginHorizontal: 4,
    // paddingVertical: 6,
    // paddingHorizontal: 4,
    // borderWidth: 1,
    // borderRadius: 8,
    // borderColor: '#e3e3e3',
    alignItems: 'center',

  },
  itemInactive: {
    opacity: 0.5,
  },
  itemWeekday: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
    marginBottom: 5,
  },
  itemDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginTop: 7,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dateHeaderText: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.text,
  },
  dayPane: {
    width,
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 0,
  },
  placeholder: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  placeholderInset: {
    flex: 1,
    borderWidth: 4,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 9,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#6b6d78',
  },
  card: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#fff',
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
  taskListContainer: {
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: '#f5f4fb',
    overflow: 'hidden',
  },
  taskRowWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    marginTop: 12,
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
  footer: {
    marginTop: 'auto',
    paddingHorizontal: 16,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007aff',
    borderColor: '#007aff',
    borderWidth: 1,
  },
  btnText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
