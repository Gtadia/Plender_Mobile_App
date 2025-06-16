import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

const { width } = Dimensions.get('window');
// const width = 150;

const getWeek = (date) => {
  const start = dayjs(date).startOf('isoWeek');
  return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'));
};

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

export default function SwipeableCalendar() {
  const baseDateRef = useRef(dayjs());
  const [activeDate, setActiveDate] = useState(baseDateRef.current);
  const indexRef = useRef(1); // start on middle view (index = 1)
  const weeksRef = useRef([   // TODO — LegendApp
    getWeek(baseDateRef.current.subtract(1, 'week')),
    getWeek(baseDateRef.current),
    getWeek(baseDateRef.current.add(1, 'week')),
  ]);

  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    flexDirection: 'row',
    width: width * 3,
    transform: [{ translateX: translateX.value }],
  }));

  const updateWeeks = (direction: string) => {
    if (direction === 'left') {
      baseDateRef.current = baseDateRef.current.add(1, 'week');
      setActiveDate(baseDateRef.current);
      weeksRef.current = [
        getWeek(baseDateRef.current.subtract(1, 'week')),
        getWeek(baseDateRef.current),
        getWeek(baseDateRef.current.add(1, 'week')),
      ];
      console.log("left");
    } else if (direction === 'right') {
      baseDateRef.current = baseDateRef.current.subtract(1, 'week');
      setActiveDate(baseDateRef.current);
      weeksRef.current = [
        getWeek(baseDateRef.current.subtract(1, 'week')),
        getWeek(baseDateRef.current),
        getWeek(baseDateRef.current.add(1, 'week')),
      ];
      console.log("right");
    }

    // weeksRef.current = [
    //   getWeek(baseDateRef.current.subtract(1, 'week')),
    //   getWeek(baseDateRef.current),
    //   getWeek(baseDateRef.current.add(1, 'week')),
    // ];

    // translateX.value = withSpring(-width); // reset center
    translateX.value = (0);
  };

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX < -50) {
        translateX.value = withSpring(-width, {}, () => {
          translateX.value = width;
          runOnJS(updateWeeks)('left');
        });
      } else if (e.translationX > 50) {
        translateX.value = withSpring(0, {}, () => {
          translateX.value = -width;
          runOnJS(updateWeeks)('right');
          // moveViewComp('right');
        });
      } else {
        translateX.value = withSpring(0);
      }

      // console.log(weeksRef.current[1][0].format('YYYY-MM-DD'));
    });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.carouselContainer, animatedStyle]}>
        {weeksRef.current.map((week, i) => (
          <View key={i} style={{  borderWidth: 1, borderColor: 'red', width, overflow: "hidden" }}>

            <WeekView
              week={week}
              activeDate={activeDate}
              onDayPress={setActiveDate}
            />
          </View>
        ))}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  carouselContainer: {
    width: width * 3,
    height: 100,
    flexDirection: 'row',
  },
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
