import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { observable, observe } from '@legendapp/state';
import { Memo } from '@legendapp/state/react';

dayjs.extend(isoWeek);

const { width } = Dimensions.get('window');
const damping = 10;
const activeDate$ = observable({
  active: dayjs(),
  weeks: () => [
    getWeek(activeDate$.active.get().subtract(1, 'week')),
    getWeek(activeDate$.active.get()),
    getWeek(activeDate$.active.get().add(1, 'week'))
  ]
});
// const width = 150;

const getWeek = (date) => {
  const start = dayjs(date).startOf('isoWeek');
  return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'));
};

const WeekView = ({ week }) => (
  <View style={styles.weekRow}>
    {week.map((day: Dayjs, index) =>
    {
          const isActive = day.format('YYYY-MM-DD') === activeDate$.active.get().format('YYYY-MM-DD');
          return (
            <TouchableOpacity
              key={index}
              onPress={() => activeDate$.active.set(day)}
              // onPress={() => activeDate$.assign({active: day})}
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
    // const baseDateRef = useRef(dayjs());
    // const [activeDate, setActiveDate] = useState(dayjs());
    // const weeksRef = useRef([   // TODO — LegendApp
    //   getWeek(activeDate$.get().subtract(1, 'week')),
    //   getWeek(activeDate$.get()),
    //   getWeek(activeDate$.get().add(1, 'week')),
    // ]);

    const translateX = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
      flexDirection: 'row',
      width: width * 3,
      transform: [{ translateX: translateX.value }],
    }));

    const updateWeeks = (direction: string) => {
      if (direction === 'left') {
        activeDate$.active.set((curr) => curr.add(1, 'week'));
        console.log("left");
        console.log(activeDate$.active.get().format("YYYY-MM-DD"))
      } else if (direction === 'right') {
        activeDate$.active.set((curr) => curr.subtract(1, 'week'));
        console.log("right");
        console.log(activeDate$.active.get().format("YYYY-MM-DD"))
      }

      // weeksRef.current = [
    //   getWeek(activeDate.subtract(1, 'week')),
    //   getWeek(activeDate),
    //   getWeek(activeDate.add(1, 'week')),
    // ];

    // weeksRef.current = [
    //   getWeek(baseDateRef.current.subtract(1, 'week')),
    //   getWeek(baseDateRef.current),
    //   getWeek(baseDateRef.current.add(1, 'week')),
    // ];

    // translateX.value = withSpring(-width); // reset center
    // translateX.value = (0);
  };

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      // todo — prevent swiping while the animation is going on
    })
    .onEnd((e) => {
      if (e.translationX < -50) {
        // TODO — update the active date (visually at least)
        translateX.value = withSpring(-width, {damping: damping}, () => {
          // todo — set withSpring animation to not actually have a spring and just snap.
          // todo — velocity based spring.

          translateX.value = 0;
          runOnJS(updateWeeks)('left');
          console.log('left-gesture');

        });
      } else if (e.translationX > 50) {
        translateX.value = withSpring(width, {damping: damping}, () => {
          translateX.value = 0;
          runOnJS(updateWeeks)('right');
          console.log('right-gesture');
          // console.log(activeDate$.active.get())
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
        {activeDate$.weeks.map((week, i) => (
          <View key={i} style={{  borderWidth: 1, borderColor: 'red', width, overflow: "hidden" }}>
            <Memo>
              {
                () =>
                  <WeekView
                    week={week}
                  />
              }
            </Memo>
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
