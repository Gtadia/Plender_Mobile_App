import React, { useState, useMemo, useRef } from 'react';
import {
  FlatList,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

const { width } = Dimensions.get('window');

export default function FlatListSwiperExample() {
  const weekListRef = useRef(null);
  const dayListRef = useRef(null);

  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [weekOffset, setWeekOffset] = useState(0);
  const [prevWeekIndex, setPrevWeekIndex] = useState(1);
  const [prevDayIndex, setPrevDayIndex] = useState(1);

  const weeks = useMemo(() => {
    // const base = selectedDate.add(weekOffset, 'week').startOf('week');
    const base = dayjs().add(weekOffset, 'week').startOf('week');
    return [-1, 0, 1].map((offset) =>
      Array.from({ length: 7 }).map((_, i) => {
        const date = base.add(offset, 'week').add(i, 'day');
        return { weekday: date.format('ddd'), date };
      })
    );
  }, [selectedDate, weekOffset]);

  const days = useMemo(() => [
    selectedDate.subtract(1, 'day'),
    selectedDate,
    selectedDate.add(1, 'day'),
  ], [selectedDate]);

  const scrollToCenter = (ref) => {
    ref.current?.scrollToIndex({ index: 1, animated: false });
  };

  const handleWeekSwipe = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    const direction = index > prevWeekIndex ? 1 : index < prevWeekIndex ? -1 : 0;
    if (direction !== 0) {
      setSelectedDate((prev) => prev.add(direction, 'week'));
      setWeekOffset((prev) => prev + direction);
      setTimeout(() => scrollToCenter(weekListRef), 10);
    }
    setPrevWeekIndex(1);

    console.log("The Weeks: ", days)
  };

  const handleDaySwipe = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    const direction = index > prevDayIndex ? 1 : index < prevDayIndex ? -1 : 0;
    if (direction !== 0) {
      const nextDate = selectedDate.add(direction, 'day');
      setSelectedDate(nextDate);
      const nextDateWeekday = false ? nextDate.isoWeekday() : nextDate.day();
      // const selectedDateWeekday = false ? selectedDate.isoWeekday() : selectedDate.day();

      if (nextDateWeekday === 0 && direction === 1 || nextDateWeekday === 6 && direction === -1) {
        setWeekOffset((prev) => prev + direction);
      }
      setTimeout(() => scrollToCenter(dayListRef), 10);
    }
    setPrevDayIndex(1);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* <View style={styles.header}>
          <Text style={styles.title}>Your Schedule</Text>
        </View> */}

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
            <View style={styles.itemRow}>
              {week.map((item, index) => {
                const isActive = item.date.isSame(selectedDate, 'day');
                return (
                  <TouchableWithoutFeedback
                    key={index}
                    onPress={() => setSelectedDate(item.date)}
                  >
                    <View style={[styles.item, isActive && styles.itemActive]}>
                      <Text style={[styles.itemWeekday, isActive && styles.textActive]}>
                        {item.weekday}
                      </Text>
                      <Text style={[styles.itemDate, isActive && styles.textActive]}>
                        {item.date.date()}
                      </Text>
                    </View>
                  </TouchableWithoutFeedback>
                );
              })}
            </View>
          )}
        />

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
          keyExtractor={(item, index) => `day-${index}`}
          renderItem={({ item }) => (
            <View style={{ width, paddingHorizontal: 16, paddingVertical: 24 }}>
              <Text style={styles.subtitle}>
                {item.toDate().toLocaleDateString('en-US', { dateStyle: 'full' })}
              </Text>
              <View style={styles.placeholder}>
                <View style={styles.placeholderInset} />
              </View>
            </View>
          )}
        />

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => {}}>
            <View style={styles.btn}>
              <MaterialIcons name="add" size={22} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.btnText}>Add Event</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingVertical: 24 },
  header: { paddingHorizontal: 16 },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1d1d1d',
    marginBottom: 12,
  },
  itemRow: {
    width,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  item: {
    flex: 1,
    height: 50,
    marginHorizontal: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#e3e3e3',
    alignItems: 'center',
  },
  itemActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  itemWeekday: {
    fontSize: 13,
    fontWeight: '500',
    color: '#737373',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  textActive: {
    color: '#fff',
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#999999',
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