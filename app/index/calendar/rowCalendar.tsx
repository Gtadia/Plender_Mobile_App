import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FlatList,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Button,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import VerticalProgressBar from '@/components/custom_ui/VerticalProgressBar';
import { clearEvents, createEvent, getEventOccurrences, getEventsForDate, initializeDB } from '@/utils/database';
import { observable, observe } from '@legendapp/state';
import { Memo, observer, use$, useObservable } from '@legendapp/state/react';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';
import DateTimePicker, { DateType, useDefaultStyles } from 'react-native-ui-datepicker';
import BottomSheet, { openAddMenu$ } from '@/components/BottomSheet';
import { useNavigation } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { ScreenView } from '@/components/Themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { horizontalPadding } from '@/constants/globalThemeVar';

dayjs.extend(isoWeek);

const { width } = Dimensions.get('window');

export const selectedDate$ = observable(dayjs());

export default function FlatListSwiperExample() {
  const weekListRef = useRef(null);
  const dayListRef = useRef(null);

  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [weekOffset, setWeekOffset] = useState(0);
  const [prevWeekIndex, setPrevWeekIndex] = useState(1);
  const [prevDayIndex, setPrevDayIndex] = useState(1);

  const weeks = useMemo(() => {
    const base = selectedDate.add(weekOffset, 'week').startOf('week');
    // const base = dayjs().add(weekOffset, 'week').startOf('week');
    return [-1, 0, 1].map((offset) =>
      Array.from({ length: 7 }).map((_, i) => {
        const date = base.add(offset, 'week').add(i, 'day');
        return { weekday: date.format('ddd'), date };
      })
    );
  }, [selectedDate, weekOffset]);

  useEffect(() => {
    // selectedDate$.set(selectedDate)
    console.log("Date Selected: ", (selectedDate$.get()))
    setSelectedDate(selectedDate$.get())
  }, [selectedDate$]);

  selectedDate$.onChange(({ value }) => {
    setSelectedDate(value)
    console.log("DATE SELECTED: ", (selectedDate$.get()));
  })

  const week = observer(() => {
    setSelectedDate(use$(selectedDate$))
    console.log("DATE SELECTED: ", (selectedDate$.get()));

    const base = dayjs().add(weekOffset, 'week').startOf('week');
   return [-1, 0, 1].map((offset) =>
      Array.from({ length: 7 }).map((_, i) => {
        const date = base.add(offset, 'week').add(i, 'day');
        return { weekday: date.format('ddd'), date };
      })
    );
  })

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

  const insets = useSafeAreaInsets();

  // TODO — move database initialization to a more appropriate place
  initializeDB();

  const router = useRouter();


  return (
    <ScreenView style={styles.container}>
      <View style={[styles.titleContainer, { paddingTop: insets.top }]}>
        <Text style={[styles.title]}>Calendar</Text>
      </View>
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.calContainer}>
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
            <View style={styles.itemRowContainer}>
              <View style={styles.itemRow}>
                {week.map((item, index) => {
                  const isActive = item.date.isSame(selectedDate, 'day');

                  const [orange, green] = [isActive ? '#fe640b' : '#fab387', isActive ? '#40a02b' : '#a6e3a1'];
                  return (
                    <TouchableWithoutFeedback
                      key={index}
                      onPress={() => setSelectedDate(item.date)}
                    >
                      <View style={[styles.item, !isActive && styles.itemInactive]}>
                        <Text style={[styles.itemWeekday]}>{item.weekday}</Text>
                        <VerticalProgressBar height={125} width={30} progbar={[{percentage: 0.6, color: '#fe640b'}, {percentage: 0.35, color: '#40a02b'}]} />
                        <Text style={styles.itemDate}>{item.date.date()}</Text>
                      </View>
                    </TouchableWithoutFeedback>
                  );
                })}
              </View>
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
              <TouchableOpacity onPress={() => {
                router.push('/calendar/bottomSheet');
              }}>
                <View style={{ flexDirection: 'row', alignContent: 'center',  }}>
                  <Text style={styles.subtitle}>
                    {item.toDate().toLocaleDateString('en-US', { dateStyle: 'full' })}
                  </Text>
                  <MaterialIcons name="edit" size={20} color="#000" style={{paddingLeft: 5}}/>
                </View>
              </TouchableOpacity>
            <View style={styles.placeholder}>

              <Memo>
                {() =>
                  {
                    // console.log(getEventOccurrences(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
                    getEventsForDate(new Date()).then((data) => {
                      console.log("Events fetched:", data);

                      return (
                          data.map((event, index) => (
                            <Text key={index}>{event.title} - {dayjs(event.date).format('YYYY-MM-DD')}</Text>
                          ))
                      )
                    })
                  }
                }
              </Memo>

                <View style={styles.placeholderInset} />
              </View>
            </View>
          )}
        />

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => {
            const title = new Date().toLocaleDateString('en-US', { dateStyle: 'full' });
            const startDate = new Date('2025-08-01T00:00:00').toISOString();
            const rrule = 'FREQ=DAILY;UNTIL=2025-09-01';
            createEvent({ title, startDate, rrule }).then(() => {
              console.log("Event Created: ", { title, startDate, rrule });
            })

            // console.log("Event Created?>?>?")

            // getEventOccurrences(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).then((data) => {
            //   console.log("Events fetched:");
            //   events.data.set(data);
            //   console.log("Events after fetching: ", data);
            // })
  // clearEvents();
                    // getEventOccurrences(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).then((data) => {
                    // getEventOccurrences(new Date(), new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)).then((data) => {
                    // getEventOccurrences(dayjs().startOf('date').toDate(), dayjs().startOf('date').add(1, 'day').subtract(1, 'second').toDate()).then((data) => {
                    //   console.log("Events fetched:", data);
                    //   // events.data.set(data);
                    //   // console.log("Events after fetching: ", data);
                    // })
                    getEventsForDate(new Date()).then((data) => {
                      console.log("Events fetched:", data);
                      // events.data.set(data);
                      // console.log("Events after fetching: ", data);
                    }
                    );
          }}>
            <View style={styles.btn}>
              <MaterialIcons name="add" size={22} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.btnText}>Add Event</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
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
    },
    title: {
      left: horizontalPadding,
      color: '#000',
      fontSize: 28,
      marginLeft: 0,
      fontWeight: 'bold',
    },
  calContainer: { flex: 1, paddingVertical: 24 },
  header: { paddingHorizontal: 16 },
  // title: {
  //   fontSize: 32,
  //   fontWeight: '700',
  //   color: '#1d1d1d',
  //   marginBottom: 12,
  // },
  itemRowContainer: {
    width,
    justifyContent: 'center',
    alignItems: 'center'
  },
  itemRow: {
    maxWidth: 350,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  item: {
    // TODO: add regular item styles
    // flex: 1,
    // height: 50,
    // marginHorizontal: 4,
    // paddingVertical: 6,
    // paddingHorizontal: 4,
    // borderWidth: 1,
    // borderRadius: 8,
    // borderColor: '#e3e3e3',
    alignItems: 'center',

  },
  itemInactive: {
    opacity: 0.5,
  },
  itemWeekday: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
    marginBottom: 5,
  },
  itemDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginTop: 7,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
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