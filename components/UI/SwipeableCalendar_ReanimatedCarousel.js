import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

const { width } = Dimensions.get('window');

// Returns an array of 7 dayjs() objects for a week starting on Monday
const getWeek = (date) => {
  const start = dayjs(date).startOf('isoWeek');
  return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'));
};

// Calculate week for a given virtual index
const getWeekForIndex = (index, centerIndex) => {
  // TODO — Instead of checking the index against centerIndex,
  // TODO — we can try to figure out if the user swiped left or right
  const offset = index - centerIndex;
  return getWeek(dayjs().add(offset, 'week'));
};

// Component to render a row of 7 days
const WeekView = ({ week, activeDate, onDayPress }) => (
  <View style={styles.weekRow}>
    {week.map((day, index) => {
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

// Main swipeable weekly calendar
export default function SwipeableCalendar() {
  const totalWeeks = 3;
  const centerIndex = Math.floor(totalWeeks / 2);

  const [activeDate, setActiveDate] = useState(dayjs());

  return (
    <View style={{ flex: 1, backgroundColor: 'red' }}>
      <Carousel
        width={width}
        height={100}
        style={{ backgroundColor: 'blue' }}
        loop
        autoPlay={false}
        data={Array.from({ length: totalWeeks }, (_, i) => i)}
        defaultIndex={centerIndex}
        mode="horizontal-stack"
        modeConfig={{ snapDirection: 'left', stackInterval: 30 }}
        renderItem={({ index }) => {
          const week = getWeekForIndex(index, centerIndex);
          return (
            <WeekView
              week={week}
              activeDate={activeDate}
              onDayPress={setActiveDate}
            />
          );
        }}
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
    backgroundColor: 'pink',
    // width: 100
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
