import React, { useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, ScreenView } from '@/components/Themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Moment } from 'moment';
import moment from 'moment';

const { width } = Dimensions.get('window');
const BOX_WIDTH = width; // show 3 boxes at once

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

export default function TestOverflow() {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<any>>(null);

  // TODO — Replace useState with LegendState
  const [selectedDate, setSelectedDate] = useState(moment());
  const [panes, setPanes] = useState<WeekPane[]>(() => {
    const start = moment().startOf('week').subtract(CENTER_INDEX, 'week');
    return Array.from({ length: PANES }).map((_, idx) => buildPane(start, idx));
  });

  const base = useMemo(() => [1, 2, 3, 4, 5], []);
  // repeat base so we can recenter without losing middle = 3
  const data = useMemo(() => [...base, ...base, ...base], [base]); // length 15
  const centerIndex = panes.length + 2; // middle of middle block points at value 3

  const scrollTo = (idx: number) => {
    listRef.current?.scrollToIndex({ index: idx, animated: false });
  };

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / BOX_WIDTH);
    const blockSize = base.length;
    // if near left edge of first block, jump forward a block
    if (idx < blockSize - 2) {
      centerIndex
      scrollTo(idx + blockSize);
    } else if (idx > data.length - blockSize + 1) {
      // near right edge of last block, jump back a block
      scrollTo(idx - blockSize);
    }
  };

  const renderWeek = (pane: WeekPane) => {
    const days = Array.from({ length: 7 }).map((_, idx) => pane.start.clone().add(idx, 'day'));
    return (
      <View style={styles.weekRow}>
        {days.map((day) => {
          const isSelected = day.isSame(selectedDate, 'day');
          return (
            <TouchableOpacity key={day.toISOString()} style={styles.dayContainer} onPress={() => setSelectedDate(day)}>
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
        <Text style={styles.title}>Overflow Test</Text>
        <Text style={styles.subtitle}>FlatList; middle value stays centered on recenter</Text>
      </View>

      <FlatList
        ref={listRef}
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={BOX_WIDTH}
        snapToAlignment="center"
        pagingEnabled
        decelerationRate="fast"
        bounces={false}
        initialScrollIndex={centerIndex}
        getItemLayout={(_, index) => ({
          length: BOX_WIDTH,
          offset: BOX_WIDTH * index,
          index,
        })}
        keyExtractor={(_, idx) => `box-${idx}`}
        onMomentumScrollEnd={handleMomentumEnd}
        renderItem={({ item }) => (
          <View style={[styles.box, { width: BOX_WIDTH }]}>
            <Text style={styles.boxText}>{item}</Text>
          </View>
          // <View style={{ width }}>{renderWeek(item)}</View>
        )}
        contentContainerStyle={styles.listContent}
      />
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
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    alignItems: 'center',
  },
  box: {
    height: 120,
    borderRadius: 12,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  boxText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
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




// import React, { useMemo, useRef, useState } from 'react';
// import { Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View, TouchableOpacity } from 'react-native';
// import { Text, ScreenView } from '@/components/Themed';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import moment, { Moment } from 'moment';

// const { width } = Dimensions.get('window');
// const DAY_WIDTH = width / 7;
// const PANES = 5; // prev2, prev1, current, next1, next2
// const CENTER_INDEX = Math.floor(PANES / 2);

// type WeekPane = {
//   key: string;
//   start: Moment;
// };

// const buildPane = (anchor: Moment, offsetWeeks: number): WeekPane => {
//   const start = anchor.clone().add(offsetWeeks, 'week').startOf('week');
//   return { key: start.toISOString(), start };
// };

// export default function TestWeekScroller() {
//   const insets = useSafeAreaInsets();
//   const listRef = useRef<FlatList<WeekPane>>(null);
//   const [selectedDate, setSelectedDate] = useState(moment());

//   const panes = useMemo(() => {
//     const anchor = moment().startOf('week').subtract(CENTER_INDEX, 'week');
//     return Array.from({ length: PANES }).map((_, idx) => buildPane(anchor, idx));
//   }, []);

//   const [paneState, setPaneState] = useState(panes);

//   const scrollToCenter = () => {
//     listRef.current?.scrollToIndex({ index: CENTER_INDEX, animated: false });
//   };

//   const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
//     const idx = Math.round(e.nativeEvent.contentOffset.x / width);
//     const direction = idx - CENTER_INDEX;
//     if (direction !== 0) {
//       setSelectedDate((prev) => prev.clone().add(direction, 'week'));
//       setPaneState((prev) => {
//         if (direction > 0) {
//           const last = prev[prev.length - 1].start;
//           const nextPane = buildPane(last, 1);
//           return [...prev.slice(direction), nextPane];
//         } else {
//           const first = prev[0].start;
//           const nextPane = buildPane(first, -1);
//           return [nextPane, ...prev.slice(0, prev.length + direction)];
//         }
//       });
//       requestAnimationFrame(scrollToCenter);
//     } else {
//       requestAnimationFrame(scrollToCenter);
//     }
//   };

//   const renderWeek = (pane: WeekPane) => {
//     const days = Array.from({ length: 7 }).map((_, idx) => pane.start.clone().add(idx, 'day'));
//     return (
//       <View style={styles.weekRow}>
//         {days.map((day) => {
//           const isSelected = day.isSame(selectedDate, 'day');
//           return (
//             <TouchableOpacity key={day.toISOString()} style={styles.dayContainer} onPress={() => setSelectedDate(day)}>
//               <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>{day.format('dd')}</Text>
//               <View style={[styles.dayCircle, isSelected && styles.dayCircleActive]}>
//                 <Text style={[styles.dayNumber, isSelected && styles.dayNumberActive]}>{day.date()}</Text>
//               </View>
//             </TouchableOpacity>
//           );
//         })}
//       </View>
//     );
//   };

//   return (
//     <ScreenView style={styles.container}>
//       <View style={[styles.titleContainer, { paddingTop: insets.top }]}>
//         <Text style={styles.title}>Week Scroller</Text>
//         <Text style={styles.subtitle}>{selectedDate.format('MMMM D, YYYY')}</Text>
//       </View>

//       <FlatList
//         ref={listRef}
//         data={paneState}
//         horizontal
//         pagingEnabled
//         showsHorizontalScrollIndicator={false}
//         snapToInterval={width}
//         decelerationRate="fast"
//         bounces={false}
//         initialScrollIndex={CENTER_INDEX}
//         onMomentumScrollEnd={handleMomentumEnd}
//         getItemLayout={(_, index) => ({
//           length: width,
//           offset: width * index,
//           index,
//         })}
//         keyExtractor={(item) => item.key}
//         renderItem={({ item }) => <View style={{ width }}>{renderWeek(item)}</View>}
//       />
//     </ScreenView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: 'stretch',
//     justifyContent: 'flex-start',
//   },
//   titleContainer: {
//     width: '100%',
//     paddingHorizontal: 16,
//     marginBottom: 12,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#000',
//   },
//   subtitle: {
//     marginTop: 4,
//     fontSize: 16,
//     color: '#666',
//   },
//   weekRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 20,
//   },
//   dayContainer: {
//     alignItems: 'center',
//     width: DAY_WIDTH,
//   },
//   dayLabel: {
//     fontSize: 12,
//     color: '#666',
//     marginBottom: 6,
//   },
//   dayLabelActive: {
//     color: '#000',
//     fontWeight: '700',
//   },
//   dayCircle: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#eee',
//   },
//   dayCircleActive: {
//     backgroundColor: '#1e66f5',
//   },
//   dayNumber: {
//     fontSize: 16,
//     color: '#000',
//   },
//   dayNumberActive: {
//     color: '#fff',
//     fontWeight: '700',
//   },
// });