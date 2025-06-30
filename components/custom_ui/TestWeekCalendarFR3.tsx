import { observable } from '@legendapp/state';
import { Memo } from '@legendapp/state/react';
import dayjs, { Dayjs } from 'dayjs';
import React, { useState } from 'react';
import { Dimensions, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const ELEMENT_WIDTH = 150;
const activeDate$ = observable({
  active: dayjs()
});


const getWeek = (date) => {
  const start = dayjs(date).startOf('isoWeek');
  return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'));
};

const initialItems = ['A', 'B', 'C'];
const active = activeDate$.active.get();
// const initialItems: any = [
//                             getWeek(active.subtract(1, 'week')),
//                             getWeek(active),
//                             getWeek(active.add(1, 'week')),
//                           ];

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

export default function InfiniteCarousel() {
  const [items, setItems] = useState(initialItems);
  const translateX = useSharedValue(0);

  const reorder = (direction: 'left' | 'right') => {
    setItems((prev) => {
      if (direction === 'left') {
        activeDate$.active.set((curr) => curr.add(1, 'week'));
        return [...prev.slice(1), prev[0]]; // B C A
      } else {
        activeDate$.active.set((curr) => curr.subtract(1, 'week'));
        return [prev[prev.length - 1], ...prev.slice(0, prev.length - 1)]; // C A B
      }
    });
  };

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX > 50) {
        // swipe right
        translateX.value = withTiming(ELEMENT_WIDTH, { duration: 150 }, () => {
          runOnJS(reorder)('right');
          translateX.value = 0;
        });
      } else if (e.translationX < -50) {
        // swipe left
        translateX.value = withTiming(-ELEMENT_WIDTH, { duration: 150 }, () => {
          runOnJS(reorder)('left');
          translateX.value = 0;
        });
      } else {
        // not enough: snap back
        translateX.value = withTiming(0, { duration: 150 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    flexDirection: 'row',
    width: ELEMENT_WIDTH * 3,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        {items.map((item, i) => (
          <View
            key={i}
            style={[styles.item, { backgroundColor: i % 2 === 0 ? '#ddd' : '#bbb' }]}
          >
            <Text style={styles.text}>{item}</Text>
          </View>
        ))}
        {/* <Memo>
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
                  <View key={i} style={{ borderWidth: 1, borderColor: 'red', width: ELEMENT_WIDTH, overflow: "hidden" }}>
                    <WeekView week={week} />
                  </View>
                ))}
              </>
            );
          }}
        </Memo> */}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    width: ELEMENT_WIDTH * 3,
    height: 200,
    flexDirection: 'row',
  },
  item: {
    width: ELEMENT_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: 'black',
  },
  text: {
    fontSize: 40,
    fontWeight: 'bold',
  },

  carouselContainer: {
    width: ELEMENT_WIDTH * 3,
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