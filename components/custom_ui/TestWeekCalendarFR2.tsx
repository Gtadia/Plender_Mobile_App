import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { observable, observe } from '@legendapp/state';
import { Memo } from '@legendapp/state/react';

dayjs.extend(isoWeek);

const { width } = Dimensions.get('window');
// const damping = 10;
const VELOCITY_THRESHOLD = 1000; // px/s, tweak as needed
const activeDate$ = observable({
  active: dayjs()
});
const isAnimating = useSharedValue(false);
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
  };

  const gesture = Gesture.Pan()
    .enabled(!isAnimating.value)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      // todo — prevent swiping while the animation is going on
    })
    .onEnd((e) => {
      const velocity = e.velocityX;
      const translation = e.translationX;
      const isFast = Math.abs(velocity) > VELOCITY_THRESHOLD;

      const snapLeft = () => {
        runOnJS(updateWeeks)('left');
        translateX.value = 0;
        isAnimating.value = false;
      };

      const snapRight = () => {
        runOnJS(updateWeeks)('right');
        translateX.value = 0;
        isAnimating.value = false;
      };

      if (translation < -50) {
        isAnimating.value = true;

        translateX.value = isFast
          ? withSpring(-width, { damping: 100, stiffness: 100, velocity }, snapLeft)
          : withTiming(-width, { duration: 150 }, () => {
              runOnJS(updateWeeks)('left');
              translateX.value = 0;
              isAnimating.value = false;
            });

      } else if (translation > 50) {
        isAnimating.value = true;

        translateX.value = isFast
          ? withSpring(width, { damping: 100, stiffness: 100, velocity }, snapRight)
          : withTiming(width, { duration: 150 }, () => {
              runOnJS(updateWeeks)('right');
              translateX.value = 0;
              isAnimating.value = false;
            });

      } else {
        // Not enough swipe distance: return to center
        translateX.value = withTiming(0, { duration: 150 });
      }
    });
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.carouselContainer, animatedStyle]}>
        <Memo>
          {() => {
            const active = activeDate$.active.get();
            const weeks = [
              getWeek(active.subtract(1, 'week')),
              getWeek(active),
              getWeek(active.add(1, 'week'))
            ];
            return (
              <>
                {weeks.map((week, i) => (
                  <View key={i} style={{ borderWidth: 1, borderColor: 'red', width, overflow: "hidden" }}>
                    <WeekView week={week} />
                  </View>
                ))}
              </>
            );
          }}
        </Memo>
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
