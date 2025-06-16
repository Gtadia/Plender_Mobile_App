import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

dayjs.extend(isoWeek);
const { width } = Dimensions.get('window');

const getWeek = (date: dayjs.Dayjs) => {
  const start = date.startOf('isoWeek');
  return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'));
};

const WeekView = ({ week, onDayPress, activeDate }: any) => (
  <View style={styles.weekRow}>
    {week.map((day: any, index: any) => {
      const isActive = day.format('YYYY-MM-DD') === activeDate.format('YYYY-MM-DD');
      return (
        <TouchableOpacity
          key={index}
          onPress={() => onDayPress(day)}
          style={[styles.dayContainer, isActive && styles.activeDay]}
        >
          <Text style={[styles.dayText, isActive && styles.activeDayText]}>
            {day.format('ddd')}
          </Text>
          <Text style={[styles.dayText, isActive && styles.activeDayText]}>
            {day.format('D')}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export default function SwipeableCalendar() {
  const initialWeeks = [
    getWeek(dayjs().subtract(1, 'week')),
    getWeek(dayjs()),
    getWeek(dayjs().add(1, 'week')),
  ];

  const [weeks, setWeeks] = useState(initialWeeks);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [activeDate, setActiveDate] = useState(dayjs());

  const handleSnapToItem = (index: number) => {
    const direction = index - currentIndex;
    const base = weeks[currentIndex][3]; // middle of the week

    let newWeeks = [...weeks];
    if (direction === 1) {
      const nextWeek = getWeek(base.add(1, 'week'));
      newWeeks.push(nextWeek);
    } else if (direction === -1) {
      const prevWeek = getWeek(base.subtract(1, 'week'));
      newWeeks.unshift(prevWeek);
      index++; // shift index because we added to the start
    }

    setWeeks(newWeeks.slice(-5)); // limit stored history
    setCurrentIndex(index);
  };

  return (
    <View>
      <Carousel
        data={weeks}
        width={width}
        height={100}
        loop={false}
        mode="horizontal-stack"
        modeConfig={{ snapDirection: 'left', stackInterval: 30 }}
        defaultIndex={currentIndex}
        onSnapToItem={handleSnapToItem}
        renderItem={({ item }) => (
          <WeekView
            week={item}
            activeDate={activeDate}
            onDayPress={setActiveDate}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  dayContainer: {
    alignItems: 'center',
    padding: 6,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 16,
    color: 'black',
  },
  activeDay: {
    backgroundColor: 'black',
  },
  activeDayText: {
    color: 'white',
    fontWeight: 'bold',
  },
});