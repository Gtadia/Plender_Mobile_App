import React, { Fragment, type ReactElement, useEffect, useRef, useState, } from 'react';
import { Box } from '@/components/ui/box';
import { Center } from '@/components/ui/center';
import { HStack } from '@/components/ui/hstack';

import { Dimensions, FlatList, Text, StyleSheet, type ScaledSize, ListRenderItemInfo, NativeSyntheticEvent, NativeScrollEvent, NativeScrollPoint } from 'react-native';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek' // ES 2015
dayjs.extend(isoWeek);
import { observable } from '@legendapp/state';
import { calendarData, dayData, weekData } from '@/constants/types';
import { DateServ } from '@/helpers/calendarHelpers';


const RowCalendar = (): ReactElement => {
  const windowDimensions: ScaledSize = Dimensions.get('window');
  const [dayItemWidth, setDayItemWidth] = useState<number>(0);
  const [dateData, setDateData] = useState<calendarData | undefined>(undefined);
  const [todayIndex, setTodayIndex] = useState<number>(0);
  const dateFlatList = useRef<FlatListType | undefined>(undefined);
  const [currentObjectInfo, setCurrentObjectInfo] = useState<onViewableItemsChangedInfo | undefined>(undefined);
  const onViewableItemsChanged = useRef((info: onViewableItemsChangedInfo): void => { setCurrentObjectInfo(info); });

  const [middleMonth, setMiddleMonth] = useState<number>(dayjs().month());
  const [yearOfMiddleMonth, setYearOfMiddleMonth] = useState<number>(dayjs().year());

  /**
   * calculate the item dimension for one day, we want the total width split by seven day
   */
  useEffect((): void => {
    setDayItemWidth(windowDimensions.width / 7);
    setDateData(getCurrentMonth());
  }, []);


  /**
   * calculate today index and set it up
   */
  useEffect((): void => {
    if (dateData !== undefined) setTodayIndex(getTodayIndex(dateData));
  }, [dateData]);

  /**
   * get an array of date for the current month, split by week
   * @returns {calendarData} array of array of Dayjs objects, each subh-array represents a week
   */
  function getCurrentMonth(): calendarData {
    const now: Dayjs = dayjs();
    return DateServ.getInstance().getDaysInMonthSplitByWeek(now.month(), now.year(), true);
  }

  /**
   * render the component for the day row for the `flatlist`
   * @param {weekData} week array luxon DateTime
   * @returns {ReactElement[]}  the Element itself
   */
  function dayComponent(week: weekData): ReactElement[] {
    return week.map((value: dayData, index: number) => {
      return (
        <Center key={value.date.toString()} style={[styles.dayComponent, {width: dayItemWidth, backgroundColor: value.isToday ? '#EF9A9A' : `pink`}]}>
          <Text>{value.date.format('D')}</Text>
        </Center>
      );
    });
  }

  /**
   * render the week day
   * @returns {ReactElement} the Element itself
   */
  function generateCurrentWeek(): ReactElement[] {
    return ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((value: string, index: number) => {
      return (
        <Center key={index} style={[styles.center, {width: dayItemWidth}]}>
          <Text>
            {value}
          </Text>
        </Center>
      );
    });
  }

  /**
   * find the current date sub array into `calendarData`
   * @param {calendarData} dateArray date array
   * @returns {number} the index of the current week
   */
  function getTodayIndex(dateArray: calendarData): number {
    return dateArray.findIndex(
      (item: weekData): boolean => {
        // if the checked sub object doesn't return -1 the object contain the today date
        return item.findIndex((subItem: dayData): boolean => {
          return subItem.isToday;
        }) !== -1;
      });
  }

  /**
   * get an array of date representing the month for the given date
   * @param {DateTime} date luxon date object for the month you want -- day is doesn't used
   * @returns {calendarData} array of array of luxon DateTime, each sub array is a week
   */
  function getAMonth(date: Dayjs): calendarData {
    return DateServ.getInstance().getDaysInMonthSplitByWeek(date.month(), date.year());
  }

  /**
   * append data to `dateData`
   * @returns {void}
   */
  function appendData(): void {
    // in this function I assume that the last week is completed (see `getDaysInMonthSplitByWeek` function)
    // get the last date show to the user, the [6] represent sunday

    // TODO — Have a middle date that keeps changing (and when we move onto the next month, it will be the new middle month)
    if (dateData === undefined) return;
    const lastDate: dayData = dateData[dateData?.length - 1][6];
    // get the size of the last date month
    const lastDateMonthSize: number | undefined = lastDate.date.daysInMonth();
    // if the last date show to the user is equal to the length of the month we need the next month
    // (that mean the date is the last date of the month) otherwise we need the same month
    let nextDateData;
    if (lastDateMonthSize === lastDate.date.day()) {
      // use a new object for working (luxon date are immutable, so I use a `let` for avoiding working with a lot of unuseful `const`)
      let d: Dayjs = dayjs().year(lastDate.date.year()).month(lastDate.date.month()).date(lastDate.date.day());
      d = d.add(1, 'month');
      // if the date is also the last of the year we need to add one year
      if (d.get('month') === 12 && d.get('day') === 31) {
        // set the date to 1 january d.year+1
        d = d.add(1, 'year');
        d = d.set('month', 1).set('day', 1);
      }
      nextDateData = getAMonth(d);
    } else {
      nextDateData = getAMonth(lastDate.date);
      // because `getDaysInMonthSplitByWeek` function add days into the first and last week for having a full first and last week (with 7 days)
      // we need to remove the first week of the new data because the data is already present into `dateData`
      nextDateData.shift();
    }
    setDateData([...dateData, ...nextDateData]);
  }

  /**
   * prepend data to `dateData`
   * @returns {void}
   */
  function prependData(): void {
    // in this function I assume that the first week is (maybe) completed (see `getDaysInMonthSplitByWeek` function)
    // get the first date show to the user
    // the first [0] represent the first week, the last [0] represent monday
    if (dateData === undefined) return;
    const firstDate: dayData = dateData[0][0];
    // if the first date show to the user is equal to 1 we need the previous month
    // (if 1 mean that monday is the first day of the current month, so we have a no completed week)
    // otherwise we need the same month
    let previousDateData;
    if (firstDate.date.day() === 1) {
      // use a new object for working (luxon date are immutable, so I use a `let` for avoiding working with a lot of unuseful `const`)
      let d: Dayjs = dayjs().year(firstDate.date.year()).month(firstDate.date.month()).date(firstDate.date.day());
      d = d.add(-1, 'month');
      // if the date is also the first of the year we need to remove one year
      if (d.month() === 1 && d.day() === 1) {
        // set the date to 1 december d.year-1
        d = d.add(-1, 'year');
        d = d.set('month', 12).set('day', 1);
      }
      previousDateData = getAMonth(d);
    } else {
      previousDateData = getAMonth(firstDate.date);
      // because `getDaysInMonthSplitByWeek` function add days into the first and last week for having a full first and last week (with 7 days)
      // we need to remove the last week of the new data because the data is already present into `dateData`
      previousDateData.pop();
    }
    setDateData([...previousDateData, ...dateData]);

    console.log("prependData");
    // save the current index before adding any data
    // and add the new array length for having the new index
    // let indexToMove: number = 0;
    // if (typeof currentObjectInfo?.viewableItems[0].index === 'number') {
    //   console.log("IS ACTUALLY RUNNING")
    //   indexToMove = currentObjectInfo?.viewableItems[0].index;
    //   indexToMove = indexToMove + previousDateData.length;
    // }

    // // add the new data
    // setDateData([...previousDateData, ...dateData]);
    // // set the user on the right index
    // if (dateFlatList.current !== undefined) {
    //   dateFlatList.current.scrollToIndex({ index: indexToMove, animated: false });
    // }
  }

  /**
   * check if the user is at the start of the scroll list and fetch data if so
   * @param {NativeSyntheticEvent<NativeScrollEvent>} event scroll event
   * @returns {void}
   */
  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>): void {
    // if distanceFromStart.x === 0 we reach the start of the list
    const distanceFromStart: NativeScrollPoint = event.nativeEvent.contentOffset;
    if (distanceFromStart.x === 0) prependData();
  }

  return (
    <Box>
      {(currentObjectInfo !== undefined) && <Text>
  {currentObjectInfo.viewableItems[0].item[0].date.format('MMMM')} - {currentObjectInfo.viewableItems[0].item[0].date.format('YYYY')}
</Text>}
      <HStack style={styles.hstack}>
        {generateCurrentWeek()}
      </HStack>
      {/* <FlatList horizontal={true} /> */}
      {(dateData !== undefined) && <FlatList
        ref={dateFlatList}
        horizontal={true}
        data={dateData}
        keyExtractor={(item: weekData, index: number): string => index.toString()}
        // for some reason the type accept only ReactElement and not ReactElement[] so I put the return into this ugly `Fragment`
        renderItem={(week: ListRenderItemInfo<weekData>): ReactElement => <Fragment>{dayComponent(week.item)}</Fragment>}
        snapToAlignment={'start'}
        snapToInterval={windowDimensions.width} // set the swap on the whole elem, like so the user switch week by week
        decelerationRate={'fast'} // better feedback for the user, the ui stop on the next/previous week and not later
        initialScrollIndex={todayIndex}
        // `getItemLayout` is needed by `initialScrollIndex` to work
        getItemLayout={(data: calendarData | null | undefined, index: number): { length: number, offset: number, index: number } => ({
          length: windowDimensions.width, offset: windowDimensions.width * index, index
        })}

        // Detect when the user reach the end of the list
        onEndReachedThreshold={0.5}
        onEndReached={(): void => { appendData(); }}

        // use `onScroll` to handle the data when the user reach the start
        // onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>): void => { handleScroll(event); }}
        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>): void => { handleScroll(event); }}

        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        onViewableItemsChanged={onViewableItemsChanged.current}
      />}
    </Box>
  );
};

export default RowCalendar;

const styles = StyleSheet.create({
  hstack: {
    justifyContent: 'center',
    flexDirection: 'row',
  },
  flatlist: {

  },
  center: {
    height: 50,
    backgroundColor: 'yellow',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayComponent: {
     height: 50,
  }
})