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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import moment, { Moment } from 'moment';
import VerticalProgressBar from '@/components/custom_ui/VerticalProgressBar';
import { createEvent, initializeDB } from '@/utils/database';
import { observable } from '@legendapp/state';
import { useRouter } from 'expo-router';
import { ScreenView } from '@/components/Themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { globalTheme, horizontalPadding } from '@/constants/globalThemeVar';
import Animated, { runOnUI, scrollTo, useAnimatedRef } from 'react-native-reanimated';
import { colorTheme } from '@/constants/Colors';
import { loadDay, Category$, tasks$ } from '@/utils/stateManager';

const { width } = Dimensions.get('window');
const PANES = 5;
const CENTER_INDEX = Math.floor(PANES / 2);

export const selectedDate$ = observable(moment());

type WeekPane = {
  key: string;
  start: Moment;
};

type ProgressSegment = { percentage: number; color: string };
type TaskRow = { title: string; date: string; time: string; goal: string; percent: string };
type CategoryBlock = { title: string; accent: string; percent: string; total: string; tasks: TaskRow[] };

const buildPane = (start: Moment, offsetWeeks: number): WeekPane => {
  const paneStart = start.clone().add(offsetWeeks, 'week').startOf('week');
  return { key: paneStart.toISOString(), start: paneStart };
};

const generatePaneSet = (center: Moment): WeekPane[] => {
  const base = center.clone().startOf('week').subtract(CENTER_INDEX, 'week');
  return Array.from({ length: PANES }).map((_, idx) => buildPane(base, idx));
};

const palette = colorTheme.catppuccin.latte;

const secondsToHms = (value: number) => {
  const total = Math.max(0, Math.floor(value));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

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

export default function FlatListSwiperExample() {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const dayListRef = useRef<FlatList<Moment>>(null);

  const [selectedDate, setSelectedDate] = useState(moment());
  const [panes, setPanes] = useState<WeekPane[]>(() => generatePaneSet(moment()));
  const [isSnapping, setIsSnapping] = useState(false);
  const [isDaySnapping, setIsDaySnapping] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const pendingLoadsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = selectedDate$.onChange(({ value }) => {
      setSelectedDate(value.clone());
      setPanes(generatePaneSet(value));
    });
    const initial = selectedDate$.get().clone();
    setSelectedDate(initial);
    setPanes(generatePaneSet(initial));
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
    let cancelled = false;
    const task = InteractionManager.runAfterInteractions(() => {
      const loadVisibleWeeks = async () => {
        const loaders: Promise<any>[] = [];
        for (const pane of panes) {
          for (let i = 0; i < 7; i++) {
            loaders.push(ensureDateCached(pane.start.clone().add(i, 'day')));
          }
        }
        await Promise.all(loaders);
      };
      if (!cancelled) {
        loadVisibleWeeks();
      }
    });
    return () => {
      cancelled = true;
      task.cancel();
    };
  }, [panes, ensureDateCached]);

  useEffect(() => {
    let cancelled = false;
    const task = InteractionManager.runAfterInteractions(() => {
      if (!cancelled) {
        ensureDateCached(selectedDate);
      }
    });
    return () => {
      cancelled = true;
      task.cancel();
    };
  }, [selectedDate, ensureDateCached]);

  const scrollToCenter = useCallback(
    (animated = false) => {
      runOnUI(() => {
        'worklet';
        scrollTo(scrollRef, width * CENTER_INDEX, 0, animated);
      })();
    },
    [scrollRef],
  );

  useEffect(() => {
    scrollToCenter();
  }, [panes, scrollToCenter]);

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
      setIsSnapping(true);
      finalizeSnap();
    },
    [finalizeSnap],
  );

  const getTasksForDate = useCallback(
    (date: Moment) => {
      const key = date.format('YYYY-MM-DD');
      const ids = tasks$.lists.byDate[key]?.get?.();
      if (!ids || ids.length === 0) {
        void ensureDateCached(date);
        return [];
      }
      return ids
        .map((id: number) => tasks$.entities[id]?.get?.())
        .filter(Boolean) as ReturnType<typeof tasks$.entities[number]['get']>[];
    },
    [ensureDateCached, dataVersion],
  );

  const buildProgressSegments = useCallback(
    (date: Moment): ProgressSegment[] => {
      const tasksForDay = getTasksForDate(date);
      const fullDaySeconds = 24 * 3600;
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
        return [{ percentage: 0.35, color: active ? palette.overlay1 : palette.overlay0 }];
      }

      if (spentRatio >= goalRatio) {
        return [{ percentage: Math.max(spentRatio, goalRatio), color: colors.spent }];
      }

      return [
        { percentage: spentRatio, color: colors.spent },
        { percentage: Math.max(goalRatio - spentRatio, 0), color: colors.goal },
      ];
    },
    [getTasksForDate, selectedDate],
  );

  const buildCategoryBlocks = useCallback(
    (date: Moment): CategoryBlock[] => {
      const tasksForDay = getTasksForDate(date);
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
            date: date.format('MMMM D, YYYY'),
            time: secondsToHms(task.timeSpent ?? 0),
            goal: secondsToHms(task.timeGoal ?? 0),
            percent: task.timeGoal ? `${Math.round(((task.timeSpent ?? 0) / task.timeGoal) * 100)}%` : '0%',
          })),
        };
      });
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
              const progbar = buildProgressSegments(day);
              return (
                <TouchableWithoutFeedback key={day.toISOString()} onPress={() => handleSelectWeekDay(day)}>
                  <View style={[styles.item, !isActive && styles.itemInactive]}>
                    <Text style={[styles.itemWeekday]}>{day.format('ddd')}</Text>
                    <VerticalProgressBar
                      height={125}
                      width={30}
                      progbar={progbar}
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
    [buildProgressSegments, handleSelectWeekDay, selectedDate],
  );

  const insets = useSafeAreaInsets();

  // TODO — move database initialization to a more appropriate place
  initializeDB();

  const router = useRouter();


  return (
    <ScreenView style={styles.container}>
      <View style={[styles.titleContainer, { paddingTop: insets.top }]}>
        <Text style={[styles.title]}>Calendar</Text>
      </View>
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.calContainer}>
        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          bounces={false}
          scrollEnabled={!isSnapping}
          onMomentumScrollEnd={handleWeekSwipe}
          scrollEventThrottle={16}
          contentOffset={{ x: width * CENTER_INDEX, y: 0 }}
        >
          {panes.map((pane) => (
            <View key={pane.key} style={{ width }}>
              {renderWeek(pane)}
            </View>
          ))}
        </Animated.ScrollView>

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
          keyExtractor={(item, index) => `day-${index}`}
          renderItem={({ item }) => {
            const blocks = buildCategoryBlocks(item);
            return (
              <View style={{ width, paddingHorizontal: 16, paddingVertical: 24 }}>
                <TouchableOpacity
                  onPress={() => {
                    router.push('/calendar/bottomSheet');
                  }}
                >
                  <View style={{ flexDirection: 'row', alignContent: 'center' }}>
                    <Text style={styles.subtitle}>
                      {item.toDate().toLocaleDateString('en-US', { dateStyle: 'full' })}
                    </Text>
                    <MaterialIcons name="edit" size={20} color="#000" style={{ paddingLeft: 5 }} />
                  </View>
                </TouchableOpacity>
                <ScrollView style={styles.placeholder}>
                  {blocks.length === 0 ? (
                    <View style={[styles.placeholderInset, { alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={styles.emptyStateText}>No tasks for this day</Text>
                    </View>
                  ) : (
                    <View style={{ gap: 16 }}>
                      {blocks.map((block) => (
                        <CategoryCard key={`${item.format('YYYY-MM-DD')}-${block.title}`} block={block} />
                      ))}

                      {/* Padding Bottom */}
                      <View style={globalTheme.tabBarAvoidingPadding} />
                    </View>
                  )}
                </ScrollView>
              </View>
            );
          }}
        />

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => {
            const title = new Date().toLocaleDateString('en-US', { dateStyle: 'full' });
            const startDate = new Date('2025-08-01T00:00:00').toISOString();
            const rrule = 'FREQ=DAILY;UNTIL=2025-09-01';
            createEvent({ title, startDate, rrule }).then(() => {
              console.log("Event Created: ", { title, startDate, rrule });
            })

            // console.log("Event Created?>?>?")

            // getEventOccurrences(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).then((data) => {
            //   console.log("Events fetched:");
            //   events.data.set(data);
            //   console.log("Events after fetching: ", data);
            // })
  // clearEvents();
                    // getEventOccurrences(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).then((data) => {
                    // getEventOccurrences(new Date(), new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)).then((data) => {
                    // getEventOccurrences(dayjs().startOf('date').toDate(), dayjs().startOf('date').add(1, 'day').subtract(1, 'second').toDate()).then((data) => {
                    //   console.log("Events fetched:", data);
                    //   // events.data.set(data);
                    //   // console.log("Events after fetching: ", data);
                    // })
                    getEventsForDate(new Date()).then((data) => {
                      console.log("Events fetched:", data);
                      // events.data.set(data);
                      // console.log("Events after fetching: ", data);
                    }
                    );
          }}>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
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
    },
    title: {
      left: horizontalPadding,
      color: '#000',
      fontSize: 28,
      marginLeft: 0,
      fontWeight: 'bold',
    },
  calContainer: { flex: 1, paddingVertical: 24 },
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
    maxWidth: 350,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
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
  subtitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  placeholder: {
    flexGrow: 1,
    height: 400,
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
