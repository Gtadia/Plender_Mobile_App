import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { observable } from '@legendapp/state'
import dayjs from 'dayjs';
import { Memo } from '@legendapp/state/react';
import isoWeek from 'dayjs/plugin/isoWeek' // ES 2015
import PagerView from 'react-native-pager-view';

dayjs.extend(isoWeek);

const dates$ = observable(
  Array.from({ length: 5 }, (_, i) => Array.from({ length: 7 }, (_, j) => dayjs().subtract(2 - i, 'week').startOf('isoWeek').add(j, 'day')))
);

const TestWeekCalendarFR4 = () => {
  return (
    <View style={styles.container}>
      <Memo>{
          () =>
            <PagerView style={styles.container}>
              {dates$.get().map((week, index) => (
                <View key={index}>
                  <View style={styles.row}>
                    {week.map((day, dayIndex) => {
                      // const date = dayjs(day);
                      return <View key={dayIndex}>
                        {/* <Text style={{ fontSize: 24 }}>{day.format('YYYY-MM-DD')}</Text>
                         */}

                            </View>
                    })}
                  </View>
                  {/* <Text style={{ fontSize: 24 }}>{date.format('YYYY-MM-DD')}</Text>
                  <Text style={{ fontSize: 16 }}>{date.format('dddd')}</Text> */}
                </View>
              ))}
            </PagerView>
        }</Memo>
    </View>
  )
}

export default TestWeekCalendarFR4

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: 'red',
    // // height: 200,
    // // width: 200,
  },
  row: {
    flexDirection: 'row',
  }
})