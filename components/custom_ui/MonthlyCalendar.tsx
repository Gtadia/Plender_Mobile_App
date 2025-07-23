import { Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import dayjs from 'dayjs'
import { Calendar, CalendarProps, CalendarTheme, toDateId, useCalendar } from "@marceloterreiro/flash-calendar"
import Feather from '@expo/vector-icons/Feather';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';

const today = toDateId(new Date());

const WEEK_DAY_HEIGHT = 26;
const DAY_HEIGHT = 50;
const DAY_SPACING = 4;

interface CalendarWithControlsProps extends CalendarProps {
  onPreviousMonthPress: () => void;
  onNextMonthPress: () => void;
}

const path = Skia.Path.Make();
path.lineTo(0, 0);
path.lineTo(20, 0);
path.close();

const MonthlyCalendar = (props: CalendarWithControlsProps) => {
  const [selectedDate, setSelectedDate] = useState(today);
  const { calendarRowMonth, weekDaysList, weeksList } = useCalendar(props);

  return (
    <View style={styles.container}>
      <Calendar.VStack spacing={props.calendarRowVerticalSpacing}>
        <Calendar.HStack
          alignItems="center"
          justifyContent='space-between'
          style={calendarTheme.rowMonth?.container}
          width="100%"
        >
          <Pressable onPress={props.onPreviousMonthPress}>
            <Feather name="chevron-left" size={24} color="black"/>
          </Pressable>
          <Text>{calendarRowMonth}</Text>
          <Pressable onPress={props.onNextMonthPress}>
            <Feather name="chevron-right" size={24} color="black"/>
          </Pressable>
        </Calendar.HStack>

        <Calendar.Row.Week spacing={DAY_SPACING}>
          {weekDaysList.map((day, i) => (
            <Calendar.Item.WeekName
              height={WEEK_DAY_HEIGHT}
              key={i}
              theme={calendarTheme.itemWeekName}
            >
              <View><Text>{day}</Text></View>
            </Calendar.Item.WeekName>
          ))}
        </Calendar.Row.Week>

        {weeksList.map((week, i) => (
          <Calendar.Row.Week key={i}>
            {week.map((day) => (
              <Calendar.Item.Day.Container
                dayHeight={DAY_HEIGHT}
                daySpacing={DAY_SPACING}
                isStartOfWeek={day.isStartOfWeek}
                key={day.id}
              >
                <Calendar.Item.Day
                  height={DAY_HEIGHT}
                  metadata={day}
                  onPress={props.onCalendarDayPress}
                  theme={calendarTheme.itemDay}
                >
                  <View style={styles.calendarItemDayView}>
                    <Text>{day.displayLabel}</Text>
{/*
                    <Canvas style={styles.skiaCanvas}>
                      <Path
                        path={path}
                        color="gray"
                      />
                    </Canvas> */}
                  </View>
                </Calendar.Item.Day>
              </Calendar.Item.Day.Container>
            ))}
          </Calendar.Row.Week>))}
      </Calendar.VStack>
    </View>
  )
}

export default MonthlyCalendar

const styles = StyleSheet.create({
  container: {
    height: 'auto',
    width: 325,
  },
  monthTitleContainer: {
    width: '100%',
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'space-between',
  },
  skiaCanvas: {
    height: 8,
    width: 20,
  },
  calendarItemDayView: {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'red',
  },
})

const calendarTheme: CalendarTheme = {
  rowMonth: {
    content: {
      textAlign: 'center',
      fontWeight: '700',
    }
  },
  itemDay: {

  }
}