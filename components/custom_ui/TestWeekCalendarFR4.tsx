import { Dimensions, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { observable, observe } from '@legendapp/state'
import dayjs from 'dayjs';
import { Memo } from '@legendapp/state/react';
import isoWeek from 'dayjs/plugin/isoWeek' // ES 2015
import PagerView from 'react-native-pager-view';

dayjs.extend(isoWeek);
const { width } = Dimensions.get('window')

const dates$ = observable(
  Array.from({ length: 5 }, (_, i) => Array.from({ length: 7 }, (_, j) => dayjs().subtract(2 - i, 'week').startOf('isoWeek').add(j, 'day')))
);

const TestWeekCalendarFR4 = () => {
  // return (
  //   <View style={styles.container}>

  //   </View>
  // )
  return (
    <View style={[styles.container]}>
      <Memo>
        {() =>
          <PagerView style={styles.container}>
            {dates$.get().map((week, index) => (
              <View key={index}>
                <View style={styles.row}>
                  {week.map((day, dayIndex) => {
                    // const date = dayjs(day);
                    return <View key={dayIndex} style={styles.day}>
                            <Text>{day.format('dd')[0]}</Text>
                            <Text>{day.format('D')}</Text>
                          </View>
                  })}
                </View>
              </View>
              ))}
          </PagerView>
        }
      </Memo>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width

    // // height: 200,
    // // width: 200,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  day: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default TestWeekCalendarFR4