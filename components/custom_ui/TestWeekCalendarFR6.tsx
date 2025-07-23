// import { Dimensions, ScaledSize, StyleSheet, Text, View } from 'react-native'
// import React, { ReactElement, useEffect, useState } from 'react'
// import { calendarData, dayData, weekData } from '@/constants/types';

// const RowCalendar = (): ReactElement => {
//   const windowDimensions: ScaledSize = Dimensions.get('window');
//   const [dayItemWidth, setDayItemWidth] = useState<number>(windowDimensions.width / 7); // To make it responsive, divide by 7 days
//   const [dateData, setDateData] = useState<calendarData | undefined>(undefined);
//   const [todayIndex, setTodayIndex] = useState<number>(0);

//   /**
//    * calculate the item dimension for one day, we want the total width split by seven day
//    */
//   useEffect((): void => {
//     setDayItemWidth(windowDimensions.width / 7);
//     setDateData();
//   }, []);

//   /**
//    * calculate today index and set it up
//    */
//   useEffect((): void => {
//     if (dateData !== undefined) setTodayIndex(getTodayIndex(dateData));
//   }, [dateData]);

//   /**
//    * find the current date sub array into `calendarData`
//    * @param {calendarData} dateArray date array
//    * @returns {number} the index of the current week
//    */
//   function getTodayIndex(dateArray: calendarData): number {
//     return dateArray.findIndex(
//       (item: weekData): boolean => {
//         // if the checked sub object doesn't return -1 the object contain the today date
//         return item.findIndex((subItem: dayData): boolean => {
//           return subItem.isToday;
//         }) !== -1;
//       });
//   }

//   function



//   return (
//     <View>
//       <Text>RowCalendar</Text>
//     </View>
//   )
// }

// export default RowCalendar

// const styles = StyleSheet.create({})

import React, { useState, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SwiperFlatList } from 'react-native-swiper-flatlist';
import { MaterialIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

const { width } = Dimensions.get('window');

export default function Example() {
  const swiperRef = useRef(null);
  const contentSwiperRef = useRef(null);

  const [week, setWeek] = useState(0);
  const [value, setValue] = useState(new Date());

  const weeks = useMemo(() => {
    const start = dayjs().add(week, 'week').startOf('week');
    return [-1, 0, 1].map(adj => {
      return Array.from({ length: 7 }).map((_, index) => {
        const date = start.add(adj, 'week').add(index, 'day');
        return {
          weekday: date.format('ddd'),
          date: date.toDate(),
        };
      });
    });
  }, [week]);

  const days = useMemo(() => {
    const current = dayjs(value);
    return [
      current.subtract(1, 'day').toDate(),
      current.toDate(),
      current.add(1, 'day').toDate(),
    ];
  }, [value]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Schedule</Text>
        </View>

        <View style={styles.picker}>
          <SwiperFlatList
          decelerationRate="fast"
  scrollEventThrottle={16}
            index={1}
            ref={swiperRef}
            showPagination={false}
            data={weeks}
            horizontal
            onChangeIndex={({ index }) => {
              if (index === 1) return;
              const direction = index - 1;
              const newDate = dayjs(value).add(direction, 'week').toDate();
              setValue(newDate);
              setTimeout(() => {
                setWeek(week + direction);
                swiperRef.current?.scrollToIndex({ index: 1, animated: false });
              }, 10);
            }}
            renderItem={({ item: dates }) => (
              <View style={styles.itemRow}>
                {dates.map((item, index) => {
                  const isActive = value.toDateString() === item.date.toDateString();
                  return (
                    <TouchableWithoutFeedback
                      key={index}
                      onPress={() => setValue(item.date)}>
                      <View
                        style={[
                          styles.item,
                          isActive && {
                            backgroundColor: '#111',
                            borderColor: '#111',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.itemWeekday,
                            isActive && { color: '#fff' },
                          ]}>
                          {item.weekday}
                        </Text>
                        <Text
                          style={[
                            styles.itemDate,
                            isActive && { color: '#fff' },
                          ]}>
                          {item.date.getDate()}
                        </Text>
                      </View>
                    </TouchableWithoutFeedback>
                  );
                })}
              </View>
            )}
          />
        </View>

        <SwiperFlatList
        decelerationRate="fast"
      scrollEventThrottle={16}
          index={1}
          ref={contentSwiperRef}
          showPagination={false}
          data={days}
          onChangeIndex={({ index }) => {
            if (index === 1) return;
            const direction = index - 1;

            setTimeout(() => {
              const nextValue = dayjs(value).add(direction, 'day');
  
              if (dayjs(value).isoWeek() !== nextValue.isoWeek()) {
                setWeek(dayjs(value).isBefore(nextValue) ? week + 1 : week - 1);
              }

              setValue(nextValue.toDate());
              contentSwiperRef.current?.scrollToIndex({ index: 1, animated: false });
            }, 10);
          }}
          renderItem={({ item: day }) => (
            <View style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 24 }}>
              <Text style={styles.subtitle}>
                {day.toLocaleDateString('en-US', { dateStyle: 'full' })}
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
              <MaterialIcons
                name="add"
                size={22}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.btnText}>Add Event</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 24,
  },
  header: {
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1d1d1d',
    marginBottom: 12,
  },
  picker: {
    flex: 1,
    maxHeight: 74,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#999999',
    marginBottom: 12,
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: 16,
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
    flexDirection: 'column',
    alignItems: 'center',
  },
  itemRow: {
    width: width,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
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
  placeholder: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    height: 400,
    marginTop: 0,
    padding: 0,
    backgroundColor: 'transparent',
  },
  placeholderInset: {
    borderWidth: 4,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 9,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    backgroundColor: '#007aff',
    borderColor: '#007aff',
  },
  btnText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    color: '#fff',
  },
});