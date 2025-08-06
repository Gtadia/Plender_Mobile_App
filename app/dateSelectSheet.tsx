import { Button, Dimensions, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { Stack, useNavigation } from 'expo-router'
import { BlurView } from 'expo-blur';
import DateTimePicker, { useDefaultStyles } from 'react-native-ui-datepicker';
import dayjs, { Dayjs } from 'dayjs';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { task$ } from './create'
import { RRule } from 'rrule';
import { Memo, Show } from '@legendapp/state/react';
import { observable } from '@legendapp/state';
// import Picker from '@/components/TimeCarousel/Picker';
import { Picker } from 'react-native-wheel-pick';


const repeat$ = observable({
  pressed: false,
  num: 0,
  type: 'None',  // None, Day, Week, Month, Year
  weeks: []      // if weeks are active, then ['mon', 'tues', 'wed', ...]
});

// TODO — move this somewhere so that it only renders ONCE!!!
const values: any[] = []
values.push(' ');
for (let i = 1; i < 999; i++)
  values.push(i)
const types: string[] = ['None', 'Day', 'Week', 'Month', 'Year']

const DateSelectSheet = () => {
  const navigation = useNavigation();
  const [date, setDate] = useState<Dayjs>(task$.start_date.get() !== null ? dayjs(task$.start_date.get()) : dayjs());
  const [rrule, setRrule] = useState<string>(task$.rrule.get());
  let { width, height } = Dimensions.get("window");

  console.log("Today's Date: ", date);
  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen name='dateSelectSheet' options={{
          headerShown: false,
          presentation: "transparentModal",
      }}/>

      <Pressable onPress={() => {navigation.goBack();}} style={styles.background} />
        <View style={styles.container}>
          <Text style={styles.title}>Select Date</Text>
          <View style={{ maxWidth: 400, paddingHorizontal: 0, alignSelf: 'center', borderWidth: 1}}>
            {/* <DateTimePicker
              mode="single"
              date={date}
              onChange={(event) => {setDate(dayjs(event.date))}}
              // style={{  }}
              styles={{
                ...useDefaultStyles,
                today: { borderColor: 'black', borderRadius: 1000, borderWidth: 1, backgroundColor: 'transparent'},
                selected: { backgroundColor: 'black', borderRadius: 1000 },
                selected_label: { color: 'white' },  // selected date's text color
                // header: { borderRadius: 1000,  backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'space-evenly', alignItems: 'center', flexDirection: 'row' },
                month_selector: { borderRadius: 1000, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.4)', padding: 10, },
                year_selector: { borderRadius: 1000, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.4)', padding: 10, },
                button_prev: { borderRadius: 1000, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.4)', padding: 10, },
                button_next: { borderRadius: 1000, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.4)', padding: 10, },
              }}
            /> */}

            <View style={[ styles.subMenuSquare ]}>
              <View style={[styles.subMenuBar, styles.subMenuSquarePadding]}>
                <Text style={styles.menuText}>Start Date</Text>
                <Text style={styles.menuTextEnd}>Something</Text>
              </View>
            </View>


            <View style={styles.subMenuContainer}>
              <View>
                {/* TODO — LINE */}
              </View>
              <TouchableOpacity style={styles.subMenu} onPress={() => {
                repeat$.pressed.set((prev) => !prev)
                console.log("Button being pressd ", repeat$.pressed.get())
              }}>
                <View style={{ flexDirection: 'row'}}>
                  <AntDesign name="retweet" size={20} color={'rgba(0, 0, 0, 0.75)'} />
                  <Text style={[ styles.menuText, styles.subMenuText ]}>Repeat</Text>
                </View>

                <View style={{ flexDirection: 'row'}}>
                  {/* TODO — merge start_date into rrule */}
                  <Text ellipsizeMode="tail" style={[ styles.menuTextEnd, styles.subMenuTextEnd ]}>{RRule.fromString(`DTSTART:${dayjs().format('YYYYMMDD')}T000000Z\nRRULE:FREQ=DAILY;UNTIL=20250901T000000Z`).toText()}</Text>
                  <Ionicons name="chevron-forward-outline" size={20} color="rgba(0, 0, 0, 0.75)" />
                </View>
              </TouchableOpacity>

              {
                // TODO — Detect if repeat button is pressed
                // TODO — Detect if on "weeks" mode
              }

              <Show
                if={repeat$.pressed}
                else={() => <></>}
                // wrap={AnimatePresence} TODO — import { AnimatePresence } from "framer-motion";
              >
                {() => {
                  const repeatValue =
                        repeat$.type.get() === 'None'
                          ? "None"
                          : `${repeat$.num.get()} ${repeat$.type.get()}${repeat$.num.get() > 1 ? "s" : ""}`;

                  return (
                    <>
                      <View style={ [styles.subMenuSquare, styles.subMenuSquarePadding] }>
                        <View style={styles.subMenuBar}>
                          <Text style={styles.menuText}>Every</Text>
                          <Text style={styles.menuTextEnd}>{repeatValue}</Text>
                        </View>
                        <Memo>
                          {() => (
                              <View style={{ flexDirection: 'row' }}>
                                <Picker
                                  style={{ backgroundColor: 'white', width: "50%", height: 215 }}
                                  itemStyle={{ fontSize: 18 }}
                                  selectedValue={repeat$.num.get()}
                                  value={repeat$.num.get()}
                                  pickerData={values}
                                  onValueChange={(value: number | string) => {
                                    if (value === ' ') {
                                      repeat$.type.set('None');
                                      repeat$.num.set(0)
                                    } else if (repeat$.type.get() === 'None') {
                                      repeat$.type.set('Day')
                                      repeat$.num.set(value)
                                    }
                                    else {
                                      repeat$.num.set(value)
                                    }
                                  }}
                                />
                                <Picker
                                  style={{ backgroundColor: 'white', width: "50%", height: 215 }}
                                  itemStyle={{ fontSize: 18 }}
                                  selectedValue={repeat$.type.get()}
                                  value={repeat$.type.get()}
                                  pickerData={types}
                                  onValueChange={(value: string) => {
                                    repeat$.type.set(value)
                                    if (value === 'None') {
                                      repeat$.num.set(0)
                                    } else if (repeat$.num.get() === 0) (
                                      repeat$.num.set(1)
                                    )
                                  }}
                                />
                              </View>
                            )
                          }
                        </Memo>
                      </View>

                      <Show>
                        {() => {

                        }}
                      </Show>

                      <Text>ENDS</Text>
                      <View style={[ styles.subMenuSquare ]}>
                        <View style={[styles.subMenuBar, styles.subMenuSquarePadding]}>
                          <Text style={styles.menuText}>Never</Text>
                          <Text style={styles.menuTextEnd}>{repeatValue}</Text>
                        </View>

                        {/* TODO — Line */}
                        <View style={[styles.subMenuBar, styles.subMenuSquarePadding]}>
                          <Text style={styles.menuText}>On Date</Text>
                          <Text style={styles.menuTextEnd}>{repeatValue}</Text>
                        </View>

                      </View>
                    </>
                  )
                }}
              </Show>

              <TouchableOpacity style={styles.button} onPress={() => {
                // console.log("Selected Date: ", date$.get().toISOString());
                console.log("Selected Date: ", date?.toLocaleString());
                task$.start_date.set(date.toISOString());
                task$.rrule.set(rrule);
                navigation.goBack();
              }}>
                <Text>Done</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
    </View>
  )
}

export default DateSelectSheet

const styles = StyleSheet.create({
  background: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  title: {
    fontWeight: 500,
    fontSize: 15,
    marginBottom: 15
  },
  container: {
    backgroundColor: '#F2F2F7',
    padding: 15,
    alignItems: 'center',
  },
  subMenuContainer: {
    paddingHorizontal: 18,

  },
  subMenu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  subMenuText: {
    paddingLeft: 10,
  },
  subMenuTextEnd: {
    paddingLeft: 10,
    paddingRight: 5,
  },
  subMenuSquare: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
  },
  subMenuSquarePadding: {
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  subMenuBar: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  menuText: {
    fontWeight: 500,
    fontSize: 16,
  },
  menuTextEnd: {
    fontWeight: 300,
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.75)',
  },
  button: {

  }
})