import React, { Fragment, type ReactElement, useEffect, useState, } from 'react';
import { Box } from '@/components/ui/box';
import { Center } from '@/components/ui/center';
import { HStack } from '@/components/ui/hstack';

import { Dimensions, FlatList, Text, StyleSheet, type ScaledSize, ListRenderItemInfo } from 'react-native';
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

  return (
    <Box>
      <HStack style={styles.hstack}>
        {generateCurrentWeek()}
      </HStack>
      {/* <FlatList horizontal={true} /> */}
      {(dateData !== undefined) && <FlatList
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

        onEndReachedThreshold={0.5}
        onEndReached={(): void => { appendData(); }}
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