import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  InteractionManager,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import moment, { Moment } from 'moment';
import PagerView from 'react-native-pager-view';
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
import { dayKey$, loadDay, settings$, taskDetailsSheet$, tasks$ } from '@/utils/stateManager';
import { accentOpposites } from '@/constants/themes';
import { ensureDirtyTasksHydrated, flushDirtyTasksToDB, getDirtySnapshot } from '@/utils/dirtyTaskStore';
import { TaskList } from '@/components/task-list/TaskList';
import { observer } from '@legendapp/state/react';
import { themeTokens$ } from '@/utils/stateManager';

const { width } = Dimensions.get('window');
const PANES = 5;
const CENTER_INDEX = Math.floor(PANES / 2);
const DAY_PANES = 3;
const DAY_CENTER_INDEX = Math.floor(DAY_PANES / 2);
const WEEK_ROW_HEIGHT = 120;

export const selectedDate$ = observable(moment(getNow()).startOf('day'));

type WeekPane = {
  key: string;
  start: Moment;
};

const withOpacity = (hex: string, opacity: number) => {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

type ThemeTokens = ReturnType<typeof themeTokens$.get>;

const normalizeDate = (value: Moment) => value.clone().startOf('day');

const getWeekStart = (date: Moment, startWeekOn: string) => {
  const startIndex = startWeekOn === "Monday" ? 1 : 0;
  const dayIndex = date.day();
  const diff = (dayIndex - startIndex + 7) % 7;
  return date.clone().subtract(diff, "day").startOf("day");
};

const buildPane = (start: Moment, offsetWeeks: number, startWeekOn: string): WeekPane => {
  const paneStart = getWeekStart(start.clone().add(offsetWeeks, 'week'), startWeekOn);
  return { key: paneStart.toISOString(), start: paneStart };
};

const generatePaneSet = (center: Moment, startWeekOn: string): WeekPane[] => {
  const base = getWeekStart(center.clone(), startWeekOn).subtract(CENTER_INDEX, 'week');
  return Array.from({ length: PANES }).map((_, idx) => buildPane(base, idx, startWeekOn));
};

const shiftWeekPanes = (current: WeekPane[], direction: 1 | -1, startWeekOn: string): WeekPane[] => {
  if (!current.length) {
    return generatePaneSet(normalizeDate(moment(getNow())), startWeekOn);
  }
  if (direction > 0) {
    const shifted = current.slice(1);
    const last = current[current.length - 1].start;
    const nextStart = getWeekStart(last.clone().add(1, 'week'), startWeekOn);
    shifted.push({ key: nextStart.toISOString(), start: nextStart });
    return shifted;
  }
  const shifted = current.slice(0, -1);
  const first = current[0].start;
  const prevStart = getWeekStart(first.clone().subtract(1, 'week'), startWeekOn);
  shifted.unshift({ key: prevStart.toISOString(), start: prevStart });
  return shifted;
};

const shiftWeekPanesBy = (current: WeekPane[], step: number, startWeekOn: string): WeekPane[] => {
  if (!step) return current;
  const direction: 1 | -1 = step > 0 ? 1 : -1;
  let next = current;
  for (let i = 0; i < Math.abs(step); i += 1) {
    next = shiftWeekPanes(next, direction, startWeekOn);
  }
  return next;
};

export default observer(function FlatListSwiperExample() {
  const weekPagerRef = useRef<PagerView | null>(null);
  const dayPagerRef = useRef<PagerView | null>(null);
  const followTodayRef = useRef(true);
  const todayKeyRef = useRef(moment(getNow()).format('YYYY-MM-DD'));
  const { palette, colors } = themeTokens$.get();
  const accentKey = settings$.personalization.accent.get();
  const startWeekOn = settings$.general.startWeekOn.get();
  const capCategoryCompletion = settings$.productivity.capCategoryCompletion.get();
  const oppositeAccentKey = accentOpposites[accentKey];
  const oppositeAccent = (palette as Record<string, string>)[oppositeAccentKey] ?? palette.surface1;
  const accentSoft = withOpacity(colors.accent, 0.14);
  const accentBorder = withOpacity(colors.accent, 0.28);
  const styles = createStyles({ palette, colors, accentSoft, accentBorder });

  const [selectedDate, setSelectedDate] = useState(() => normalizeDate(moment(getNow())));
  const selectedDateRef = useRef(selectedDate);
  const [panes, setPanes] = useState<WeekPane[]>(() => generatePaneSet(normalizeDate(moment(getNow())), startWeekOn));
  const [dataVersion, setDataVersion] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isWeekSnapping, setIsWeekSnapping] = useState(false);
  const [isDaySnapping, setIsDaySnapping] = useState(false);
  const pendingLoadsRef = useRef<Set<string>>(new Set());
  const weekIgnoreSelectRef = useRef(false);
  const dayIgnoreSelectRef = useRef(false);
  const weekAllowSelectRef = useRef(false);
  const dayAllowSelectRef = useRef(false);
  const weekSnapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const daySnapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressWeekRebuildRef = useRef(false);
  const suppressWeekStartWeekOnRef = useRef(startWeekOn);
  const pendingWeekRecenterRef = useRef(false);

  useEffect(() => {
    const unsubscribe = selectedDate$.onChange(({ value }) => {
      const normalized = normalizeDate(value);
      setSelectedDate(normalized);
      selectedDateRef.current = normalized;
      followTodayRef.current = normalized.isSame(moment(getNow()), 'day');
    });
    const initial = normalizeDate(selectedDate$.get());
    setSelectedDate(initial);
    selectedDateRef.current = initial;
    followTodayRef.current = initial.isSame(moment(getNow()), 'day');
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      } else {
        unsubscribe?.off?.();
      }
    };
  }, [startWeekOn]);

  useEffect(() => {
    const dispose = dayKey$.onChange(async ({ value }) => {
      const nextToday = normalizeDate(moment(getNow()));
      todayKeyRef.current = value;
      if (followTodayRef.current) {
        selectedDate$.set(nextToday);
        await loadDay(nextToday.toDate());
      }
    });
    return () => dispose();
  }, []);

  useEffect(() => {
    if (suppressWeekRebuildRef.current && suppressWeekStartWeekOnRef.current === startWeekOn) {
      suppressWeekRebuildRef.current = false;
      return;
    }
    setPanes(generatePaneSet(selectedDate, startWeekOn));
  }, [selectedDate, startWeekOn]);

  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);

  useEffect(() => {
    return () => {
      if (weekSnapTimeoutRef.current) {
        clearTimeout(weekSnapTimeoutRef.current);
      }
      if (daySnapTimeoutRef.current) {
        clearTimeout(daySnapTimeoutRef.current);
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


  // Ensure that the date is cache synced when...
  // 1. (JUST GOTTA LOOK AT THE IMPLEMENATION MORE CLOSELY LATER)
  const ensureDateCached = useCallback(
    async (date: Moment) => {
      const key = date.format('YYYY-MM-DD');
      const existing = tasks$.lists.byDate[key]?.get?.();
      if (Array.isArray(existing)) {
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

  const ensureWeekCached = useCallback(
    (centerDate: Moment) => {
      const start = getWeekStart(centerDate, startWeekOn);
      for (let i = -14; i <= 14; i += 1) {
        void ensureDateCached(start.clone().add(i, 'day'));
      }
    },
    [ensureDateCached, startWeekOn],
  );

  const refreshDirtyDates = useCallback(async () => {
    const dirty = getDirtySnapshot();
    const keys = new Set<string>();
    Object.values(dirty).forEach((record) => {
      if (!record?.byDate) return;
      Object.keys(record.byDate).forEach((key) => keys.add(key));
    });
    if (!keys.size) return;
    await Promise.all(
      Array.from(keys).map((key) => loadDay(moment(key, 'YYYY-MM-DD').toDate())),
    );
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextKey = moment(getNow()).format('YYYY-MM-DD');
      if (nextKey === todayKeyRef.current) return;
      todayKeyRef.current = nextKey;
      if (!followTodayRef.current) return;
      const next = normalizeDate(moment(getNow()));
      selectedDate$.set(next);
      setSelectedDate(next);
      followTodayRef.current = true;
      void ensureDateCached(next);
    }, 30000);
    return () => clearInterval(interval);
  }, [ensureDateCached]);

  // Prefetch a 5-week window immediately to keep week swaps warm.
  useEffect(() => {
    ensureWeekCached(selectedDate);
  }, [ensureWeekCached, selectedDate]);

  useEffect(() => {
    const t = InteractionManager.runAfterInteractions(() => {
      void ensureDirtyTasksHydrated().then(() => ensureDateCached(selectedDate));
    });
    return () => t.cancel();
  }, [ensureDateCached, selectedDate]);


  useFocusEffect(
    useCallback(() => {
      const now = normalizeDate(moment(getNow()));
      const current = selectedDate$.get().clone();
      if (followTodayRef.current && !now.isSame(current, 'day')) {
        selectedDate$.set(now);
        setSelectedDate(now);
        ensureDateCached(now);
      }
      return () => {};
    }, [ensureDateCached])
  );

  const recenterWeekPager = useCallback((immediate = false) => {
    weekIgnoreSelectRef.current = true;
    weekAllowSelectRef.current = false;
    if (immediate) {
      weekPagerRef.current?.setPageWithoutAnimation(CENTER_INDEX);
      return;
    }
    requestAnimationFrame(() => {
      weekPagerRef.current?.setPageWithoutAnimation(CENTER_INDEX);
    });
  }, []);

  const recenterDayPager = useCallback((immediate = false) => {
    dayIgnoreSelectRef.current = true;
    dayAllowSelectRef.current = false;
    if (immediate) {
      dayPagerRef.current?.setPageWithoutAnimation(DAY_CENTER_INDEX);
      return;
    }
    requestAnimationFrame(() => {
      dayPagerRef.current?.setPageWithoutAnimation(DAY_CENTER_INDEX);
    });
  }, []);

  useLayoutEffect(() => {
    if (pendingWeekRecenterRef.current) {
      pendingWeekRecenterRef.current = false;
      recenterWeekPager(true);
      return;
    }
    recenterWeekPager();
  }, [panes, recenterWeekPager]);

  useEffect(() => {
    recenterDayPager(true);
  }, [days, recenterDayPager]);

  const handleWeekPageSelected = useCallback(
    (event: { nativeEvent: { position: number } }) => {
      const idx = event.nativeEvent.position;
      if (weekIgnoreSelectRef.current) {
        weekIgnoreSelectRef.current = false;
        weekAllowSelectRef.current = false;
        return;
      }
      if (!weekAllowSelectRef.current) return;
      weekAllowSelectRef.current = false;
      const step = idx - CENTER_INDEX;
      if (step === 0) return;
      if (weekSnapTimeoutRef.current) {
        clearTimeout(weekSnapTimeoutRef.current);
      }
      setIsWeekSnapping(true);
      const nextDate = normalizeDate(selectedDateRef.current.clone().add(step, 'week'));
      suppressWeekRebuildRef.current = true;
      suppressWeekStartWeekOnRef.current = startWeekOn;
      pendingWeekRecenterRef.current = true;
      setPanes((current) => shiftWeekPanesBy(current, step, startWeekOn));
      selectedDateRef.current = nextDate;
      setSelectedDate(nextDate);
      selectedDate$.set(nextDate);
      followTodayRef.current = nextDate.isSame(moment(getNow()), 'day');
      ensureWeekCached(nextDate);
      recenterDayPager(true);
      weekSnapTimeoutRef.current = setTimeout(() => {
        setIsWeekSnapping(false);
      }, 160);
    },
    [ensureWeekCached, recenterDayPager, startWeekOn],
  );

  const handleDayPageSelected = useCallback(
    (event: { nativeEvent: { position: number } }) => {
      const idx = event.nativeEvent.position;
      if (dayIgnoreSelectRef.current) {
        dayIgnoreSelectRef.current = false;
        dayAllowSelectRef.current = false;
        return;
      }
      if (!dayAllowSelectRef.current) return;
      dayAllowSelectRef.current = false;
      if (idx === DAY_CENTER_INDEX) return;
      if (daySnapTimeoutRef.current) {
        clearTimeout(daySnapTimeoutRef.current);
      }
      setIsDaySnapping(true);
      const step = idx > DAY_CENTER_INDEX ? 1 : -1;
      const nextDate = normalizeDate(selectedDateRef.current.clone().add(step, 'day'));
      selectedDateRef.current = nextDate;
      setSelectedDate(nextDate);
      selectedDate$.set(nextDate);
      followTodayRef.current = nextDate.isSame(moment(getNow()), 'day');
      void ensureDateCached(nextDate);
      recenterDayPager();
      daySnapTimeoutRef.current = setTimeout(() => {
        setIsDaySnapping(false);
      }, 120);
    },
    [ensureDateCached, recenterDayPager],
  );

  const handleWeekScrollStateChanged = useCallback(
    (event: { nativeEvent: { pageScrollState: string } }) => {
      const state = event.nativeEvent.pageScrollState;
      if (state === 'dragging') {
        weekAllowSelectRef.current = true;
        const base = selectedDateRef.current;
        ensureWeekCached(base);
        ensureWeekCached(base.clone().add(1, 'week'));
        ensureWeekCached(base.clone().subtract(1, 'week'));
      }
    },
    [ensureWeekCached],
  );

  const handleDayScrollStateChanged = useCallback(
    (event: { nativeEvent: { pageScrollState: string } }) => {
      const state = event.nativeEvent.pageScrollState;
      if (state === 'dragging') {
        dayAllowSelectRef.current = true;
      }
    },
    [],
  );

  const handleSelectWeekDay = useCallback(
    (day: Moment) => {
      const normalized = normalizeDate(day);
      selectedDateRef.current = normalized;
      setSelectedDate(normalized);
      selectedDate$.set(normalized);
      followTodayRef.current = normalized.isSame(moment(getNow()), 'day');
      void ensureDateCached(normalized);
      recenterWeekPager();
      recenterDayPager();
    },
    [ensureDateCached, recenterDayPager, recenterWeekPager],
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
      const timeSpent = goalTasks.reduce((sum, t) => {
        const spent = t.timeSpent ?? 0;
        const goal = t.timeGoal ?? 0;
        if (!capCategoryCompletion || goal <= 0) return sum + spent;
        return sum + Math.min(spent, goal);
      }, 0);
      const timeGoal = goalTasks.reduce((sum, t) => sum + (t.timeGoal ?? 0), 0);

      return {
        taskCount,
        spentRatio: timeGoal > 0 ? Math.min(timeSpent / timeGoal, 1) : 0,
        hasGoal: timeGoal > 0,
      };
    },
    [capCategoryCompletion, getTasksForDate],
  );

  const renderWeek = useCallback(
    (pane: WeekPane) => {
      const weekDays = Array.from({ length: 7 }).map((_, idx) => pane.start.clone().add(idx, 'day'));
      return (
        <View style={styles.itemRowContainer}>
          <View style={styles.itemRow}>
            {weekDays.map((day, index) => {
              const isToday = day.isSame(moment(getNow()), 'day');
              const isActive = day.isSame(selectedDate, 'day');
              const dayKey = day.format('YYYY-MM-DD');
              const cachedList = tasks$.lists.byDate[dayKey]?.get?.();
              const isLoading = !Array.isArray(cachedList);
              const { taskCount, spentRatio, hasGoal } = getDayProgress(day);
              const inactiveGoalColor = withOpacity(colors.accent, 0.4);
              const inactiveTrackColor = withOpacity(oppositeAccent, 0.4);
              const hasTasks = hasGoal;
              const goalColor = isActive ? colors.accent : inactiveGoalColor;
              const emptyTrackColor = withOpacity(colors.subtext1, 0.18);
              const trackColor = isLoading
                ? emptyTrackColor
                : (hasTasks
                  ? (isActive ? withOpacity(oppositeAccent, 0.5) : inactiveTrackColor)
                  : emptyTrackColor);
              const segments = [];
              if (!isLoading && taskCount > 0 && spentRatio > 0) {
                segments.push({ value: spentRatio, color: goalColor });
              }
              const taskLabel = taskCount > 99 ? "99+" : `${taskCount}`;
              const centerLabel = isLoading ? "" : taskLabel;
              return (
                <Pressable
                  key={`week-day-${index}`}
                  onPress={() => handleSelectWeekDay(day)}
                  hitSlop={8}
                >
                  <View style={[styles.item, !isActive && styles.itemInactive]}>
                    <Text style={[styles.itemWeekday, { color: isToday ? colors.accent : colors.text }]}>{day.format('ddd')}</Text>
                    <View pointerEvents="none">
                      <StackedProgressRing
                        size={46}
                        strokeWidth={7}
                        trackColor={trackColor}
                        segments={segments}
                        rotation={-90}
                        centerLabel={centerLabel}
                        centerLabelStyle={{ color: isActive ? colors.text : colors.subtext1 }}
                      />
                    </View>
                    <Text style={[styles.itemDate, { color: isToday ? colors.accent : colors.text }]}>
                      {day.date()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      );
    },
    [getDayProgress, handleSelectWeekDay, selectedDate, colors, oppositeAccent],
  );

  const insets = useSafeAreaInsets();
  const tabBarHeight = 60 + insets.bottom;
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const today = normalizeDate(moment(getNow()));
      dayKey$.set(today.format('YYYY-MM-DD'));
      selectedDate$.set(today);
      setSelectedDate(today);
      followTodayRef.current = true;
      todayKeyRef.current = today.format('YYYY-MM-DD');
      await loadDay(today.toDate());
      await flushDirtyTasksToDB();
      await ensureDirtyTasksHydrated();
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleJumpToday = useCallback(() => {
    const today = normalizeDate(moment(getNow()));
    selectedDate$.set(today);
    setSelectedDate(today);
    followTodayRef.current = true;
    selectedDateRef.current = today;
    void ensureDateCached(today);
    recenterWeekPager();
    recenterDayPager();
  }, [ensureDateCached, recenterDayPager, recenterWeekPager]);

  useFocusEffect(
    useCallback(() => {
      const run = async () => {
        await ensureDirtyTasksHydrated();
        await refreshDirtyDates();
        ensureWeekCached(selectedDate);
        await ensureDateCached(selectedDate);
      };
      void run();
      return () => {};
    }, [ensureDateCached, ensureWeekCached, refreshDirtyDates, selectedDate])
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
              <PagerView
                ref={weekPagerRef}
                style={styles.weekPager}
                initialPage={CENTER_INDEX}
                onPageSelected={handleWeekPageSelected}
                onPageScrollStateChanged={handleWeekScrollStateChanged}
                scrollEnabled={!isWeekSnapping}
              >
                {panes.map((pane, index) => (
                  <View key={`week-pane-${index}`} style={{ width }}>
                    {renderWeek(pane)}
                  </View>
                ))}
              </PagerView>
            </View>

            <View style={styles.dayListWrapper}>
              <PagerView
                ref={dayPagerRef}
                style={styles.dayPager}
                initialPage={DAY_CENTER_INDEX}
                onPageSelected={handleDayPageSelected}
                onPageScrollStateChanged={handleDayScrollStateChanged}
                scrollEnabled={!isDaySnapping}
              >
                {days.map((item) => {
                  const dateKey = item.format('YYYY-MM-DD');
                  return (
                    <View
                      key={dateKey}
                      style={styles.dayPane}
                    >
                    <TouchableOpacity
                      onPress={() => {
                        router.push('/calendarDateSheet');
                      }}
                    >
                      <View style={styles.dateHeaderRow}>
                        <Text style={styles.dateHeaderText}>
                          {item.toDate().toLocaleDateString('en-US', { dateStyle: 'full' })}
                        </Text>
                        <MaterialIcons name="edit" size={18} color={colors.subtext1} />
                      </View>
                    </TouchableOpacity>
                      <ScrollView
                        style={styles.placeholder}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ flexGrow: 1 }}
                        bounces
                        overScrollMode="always"
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                      >
                        <TaskList
                          key={dateKey}
                          dateKey={dateKey}
                          variant="calendar"
                          onPressItem={(id) => {
                            taskDetailsSheet$.taskId.set(id);
                            router.push("/taskDetailsSheet");
                          }}
                          emptyText="No tasks for this day"
                          emptyContainerStyle={[
                            styles.placeholderInset,
                            { alignItems: 'center', justifyContent: 'center' },
                          ]}
                          containerStyle={{ padding: 0 }}
                        />
                        <View style={globalTheme.tabBarAvoidingPadding} />
                      </ScrollView>
                    </View>
                  );
                })}
              </PagerView>
            </View>
          </View>
      {/* </SafeAreaView> */}
    </ScreenView>
  );
});

const createStyles = ({
  palette,
  colors,
  accentSoft,
  accentBorder,
}: {
  palette: ThemeTokens["palette"];
  colors: ThemeTokens["colors"];
  accentSoft: string;
  accentBorder: string;
}) => StyleSheet.create({
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
      color: colors.textStrong,
      fontSize: 28,
      fontWeight: 'bold',
    },
    todayButton: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: accentSoft,
      borderWidth: 1,
      borderColor: accentBorder,
    },
    todayButtonText: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: '700',
    },
  calContainer: { flex: 1, width: '100%', paddingTop: 8, paddingBottom: 0 },
  weekRowWrapper: {
    height: WEEK_ROW_HEIGHT,
    justifyContent: 'center',
  },
  weekPager: {
    width: '100%',
    height: WEEK_ROW_HEIGHT,
  },
  dayListWrapper: {
    flex: 1,
  },
  dayPager: {
    flex: 1,
    width: '100%',
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
    alignItems: 'center',
    paddingVertical: 6,
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
    color: colors.subtext1,
    marginBottom: 5,
  },
  itemDate: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
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
    color: colors.text,
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
    borderColor: colors.surface0,
    borderStyle: 'dashed',
    borderRadius: 9,
  },
  emptyStateText: {
    fontSize: 15,
    color: colors.subtext1,
  },
  card: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: palette.surface1,
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
    color: colors.subtext1,
    fontWeight: '600',
  },
  cardSpacer: {
    flex: 1,
  },
  cardTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.subtext1,
  },
  divider: {
    marginTop: 10,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: withOpacity(colors.subtext1, 0.1),
  },
  taskListContainer: {
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: palette.surface0,
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
    color: colors.textStrong,
  },
  taskDate: {
    fontSize: 13,
    color: colors.subtext1,
    marginTop: 2,
  },
  taskTime: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textStrong,
  },
  taskGoal: {
    fontSize: 14,
    color: colors.subtext0,
    fontWeight: '600',
  },
  taskPercent: {
    fontSize: 13,
    color: colors.subtext1,
    marginTop: 2,
    fontWeight: '600',
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: withOpacity(colors.subtext1, 0.12),
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
