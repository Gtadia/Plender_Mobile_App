import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, NativeSyntheticEvent, NativeScrollEvent, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text, ScreenView } from '@/components/Themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import moment, { Moment } from 'moment';
import Animated, { runOnUI, scrollTo, useAnimatedRef } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const VIEWPORT = width;
const DAY_WIDTH = VIEWPORT / 7;
const PANES = 5; // two prev, current, two next
const CENTER_INDEX = Math.floor(PANES / 2);

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

export default function TestWeekScroller() {
  const insets = useSafeAreaInsets();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const [selectedDate, setSelectedDate] = useState(moment());
  const [panes, setPanes] = useState<WeekPane[]>(() => generatePaneSet(moment()));
  const [isSnapping, setIsSnapping] = useState(false);
  const updateCenterFromDate = useCallback((next: Moment) => {
    const normalized = next.clone();
    setSelectedDate(normalized);
    setPanes(generatePaneSet(normalized));
  }, []);

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
  }, [scrollToCenter]);

  const finalizeSnap = useCallback(() => {
    requestAnimationFrame(() => {
      scrollToCenter();
      setTimeout(() => setIsSnapping(false), 300);
    });
  }, [scrollToCenter]);

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(event.nativeEvent.contentOffset.x / width);
      const direction = idx - CENTER_INDEX;
      if (direction !== 0) {
        setSelectedDate((prev) => {
          const nextDate = prev.clone().add(direction, 'week');
          setPanes(generatePaneSet(nextDate));
          return nextDate;
        });
        setIsSnapping(true);
        finalizeSnap();
      } else {
        finalizeSnap();
      }
    },
    [finalizeSnap],
  );

  const handleSelectDay = useCallback(
    (day: Moment) => {
      updateCenterFromDate(day);
      setIsSnapping(true);
      finalizeSnap();
    },
    [finalizeSnap, updateCenterFromDate],
  );

  const renderWeek = (pane: WeekPane) => {
    const days = Array.from({ length: 7 }).map((_, idx) => pane.start.clone().add(idx, 'day'));
    return (
      <View style={styles.weekRow}>
        {days.map((day) => {
          const isSelected = day.isSame(selectedDate, 'day');
          return (
            <TouchableOpacity key={day.toISOString()} style={styles.dayContainer} onPress={() => handleSelectDay(day)}>
              <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>{day.format('dd')}</Text>
              <View style={[styles.dayCircle, isSelected && styles.dayCircleActive]}>
                <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>{day.date()}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <ScreenView style={styles.container}>
      <View style={[styles.titleContainer, { paddingTop: insets.top }]}>
        <Text style={styles.title}>Week Scroller</Text>
        <Text style={styles.subtitle}>{selectedDate.format('MMMM D, YYYY')}</Text>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        bounces={false}
        scrollEnabled={!isSnapping}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}
        contentOffset={{ x: width * CENTER_INDEX, y: 0 }}
      >
        {panes.map((pane) => (
          <View key={pane.key} style={{ width }}>
            {renderWeek(pane)}
          </View>
        ))}
      </Animated.ScrollView>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  titleContainer: {
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 16,
    color: '#666',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  dayContainer: {
    alignItems: 'center',
    width: DAY_WIDTH,
  },
  dayLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  dayLabelActive: {
    color: '#000',
    fontWeight: '700',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
  },
  dayCircleActive: {
    backgroundColor: '#1e66f5',
  },
  dayText: {
    fontSize: 16,
    color: '#000',
  },
  dayTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});
