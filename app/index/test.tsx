import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, TouchableOpacity, View, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Text, ScreenView } from '@/components/Themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import moment, { Moment } from 'moment';
import { colorTheme } from '@/constants/Colors';

const palette = colorTheme.catppuccin.latte;
const { width } = Dimensions.get('window');

type Day = { label: string; date: number; full: Moment; active: boolean };

const buildWeek = (start: Moment, selected: Moment): Day[] =>
  Array.from({ length: 7 }).map((_, i) => {
    const d = start.clone().add(i, 'day');
    return {
      label: d.format('dd')[0],
      date: d.date(),
      full: d,
      active: d.isSame(selected, 'day'),
    };
  });

export default function TestCalendar() {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<any>>(null);
  const [selectedDate, setSelectedDate] = useState(moment());

  // Build 5 panes (2 prev, current, 2 next) around the selected date
  const panes = useMemo(() => {
    const anchor = selectedDate.clone().startOf('week');
    const starts = [
      anchor.clone().subtract(2, 'week'),
      anchor.clone().subtract(1, 'week'),
      anchor.clone(),
      anchor.clone().add(1, 'week'),
      anchor.clone().add(2, 'week'),
    ];
    return starts.map((start) => buildWeek(start, selectedDate));
  }, [selectedDate]);

  const scrollToCenter = () => {
    listRef.current?.scrollToIndex({ index: 2, animated: false });
  };

  useEffect(() => {
    scrollToCenter();
  }, []);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    const direction = page - 2; // center is index 2
    if (direction !== 0) {
      setSelectedDate((prev) => prev.clone().add(direction, 'week'));
      requestAnimationFrame(scrollToCenter);
    } else {
      requestAnimationFrame(scrollToCenter);
    }
  };

  return (
    <ScreenView style={styles.container}>
      <View style={[styles.titleContainer, { paddingTop: insets.top }]}>
        <Text style={styles.title}>{selectedDate.format('MMMM YYYY')}</Text>
        <Text style={styles.subtitle}>{selectedDate.format('dddd, MMM D')}</Text>
      </View>

      <FlatList
        ref={listRef}
        data={panes}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        bounces={false}
        removeClippedSubviews
        windowSize={5}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        scrollEventThrottle={16}
        keyExtractor={(_, idx) => `pane-${idx}`}
        initialScrollIndex={1}
        onMomentumScrollEnd={handleMomentumEnd}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        renderItem={({ item }) => (
          <View style={[styles.weekRow, { width }]}>
            {item.map((day: any) => {
              const active = day.active;
              return (
                <TouchableOpacity
                  key={`${day.label}-${day.date}-${day.full.week()}`}
                  style={styles.dayContainer}
                  activeOpacity={0.8}
                  onPress={() => setSelectedDate(day.full)}
                >
                  <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>{day.label}</Text>
                  <View style={[styles.dayCircle, active && styles.dayCircleActive]}>
                    <Text style={[styles.dayNumber, active && styles.dayNumberActive]}>{day.date}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      />
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
    color: palette.subtext0,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  dayContainer: {
    alignItems: 'center',
    width: width / 7,
  },
  dayLabel: {
    fontSize: 12,
    color: palette.subtext0,
    marginBottom: 6,
    fontWeight: '600',
  },
  dayLabelActive: {
    color: palette.text,
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.surface0,
  },
  dayCircleActive: {
    backgroundColor: palette.blue,
  },
  dayNumber: {
    fontSize: 15,
    color: palette.subtext1,
    fontWeight: '600',
  },
  dayNumberActive: {
    color: '#fff',
    fontWeight: '700',
  },
});