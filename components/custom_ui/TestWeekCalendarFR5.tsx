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

  /**
   * calculate the item dimension for one day, we want the total width split by seven day
   */
  useEffect((): void => {
    setDayItemWidth(windowDimensions.width / 7);
    setDateData(getCurrentMonth());
  }, []);

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
        <Center key={value.date.toString()} style={[styles.dayComponent, {width: dayItemWidth, backgroundColor: value.isToday ? 'red.200' : `primary.${index + 1}00`}]}>
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