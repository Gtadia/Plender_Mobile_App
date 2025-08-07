import { Button, Dimensions, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { Stack, useNavigation } from 'expo-router'
import { BlurView } from 'expo-blur';
import dayjs, { Dayjs } from 'dayjs';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { task$ } from './create'
import { RRule, RRuleSet } from 'rrule';
import { Memo, Show } from '@legendapp/state/react';
import { observable } from '@legendapp/state';
// import Picker from '@/components/TimeCarousel/Picker';
import { Picker } from 'react-native-wheel-pick';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNDateTimePicker from '@react-native-community/datetimepicker';


const repeat$ = observable({
  isRepeat: false,
  num: '',
  type: 'None',  // None, Day, Week, Month, Year
  weeks: [false, false, false, false, false, false, false],      // if weeks are active, then ['mon', 'tues', 'wed', ...]
  isWeeks: false,
  endsOn: dayjs(), //
  endsOnMode: true,  // false = Never, true = ends
  startsOn: dayjs(),
});

// TODO — move this somewhere so that it only renders ONCE!!!
const values: any[] = []
values.push('');
for (let i = 1; i < 999; i++)
  values.push(`${i}`)
const types: string[] = ['None', 'Day', 'Week', 'Month', 'Year']

const dayOfWeek = ['S', 'M', 'T', 'W', "T", "F", "S"]
const dayOfWeekRrule = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA]

const TimeGoalSelectSheet
 = () => {
  const navigation = useNavigation();
  let { width, height } = Dimensions.get("window");

  repeat$.weeks[dayjs().day()].set(true)  // repeats on the current day of the week

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen name='TimeGoalSelectSheet
      ' options={{
          headerShown: false,
          presentation: "transparentModal",
      }}/>

      <Pressable onPress={() => {navigation.goBack();}} style={styles.background} />
      <View style={[ styles.container, { height: height * 6 / 8, minHeight: 500 } ]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width:"100%", marginBottom: 15}}>
          <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
            <Text>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Select Goal</Text>
          <TouchableOpacity style={styles.button} onPress={() => {
            navigation.goBack()
          }}>
            <Text>Done</Text>
          </TouchableOpacity>
        </View>
        <ScrollView>
          <View style={{alignItems: 'center'}}>
          <View style={{ maxWidth: 400, paddingHorizontal: 0, alignSelf: 'center', }}>
              <Memo>
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
                          <View style={{ flexDirection: 'row' }}>
                            <Picker
                              style={{ backgroundColor: 'white', width: "50%", height: 215 }}
                              itemStyle={{ fontSize: 18 }}
                              selectedValue={repeat$.num.get()}
                              value={repeat$.num.get()}
                              pickerData={values}
                              onValueChange={(value: string) => {
                                repeat$.isRepeat.set(true)
                                if (value === '') {
                                  repeat$.isRepeat.set(false)
                                  console.log("1")
                                  repeat$.type.set('None');
                                  repeat$.num.set('')
                                } else if (repeat$.type.get() === 'None') {
                                  console.log("2")
                                  repeat$.type.set('Day')
                                  repeat$.num.set(value)
                                }
                                else {
                                  console.log("3")
                                  repeat$.num.set(value)
                                }

                                console.log("CHANGED: ", value, repeat$.num.get())
                              }}
                            />
                            <Picker
                              isShowSelectLine={false} // Default is true
                              selectLineColor='black'
                              selectLineSize={6} // Default is 4
                              style={{ backgroundColor: 'white', width: "50%", height: 215 }}
                              itemStyle={{ fontSize: 18 }}
                              selectedValue={repeat$.type.get()}
                              value={repeat$.type.get()}
                              pickerData={types}
                              onValueChange={(value: string) => {
                                repeat$.type.set(value)
                                repeat$.isRepeat.set(true)
                                if (value == 'None') {
                                  console.log('4')
                                  repeat$.num.set('')
                                  repeat$.isRepeat.set(false);
                                } else if (repeat$.num.get() === '') {
                                  console.log('5')
                                  repeat$.num.set('1')
                                }

                                if (value == 'Week') {
                                  repeat$.isWeeks.set(true)
                                } else {
                                  repeat$.isWeeks.set(false)
                                }

                                console.log("PINGING: ", value, repeat$.num.get())
                              }}
                            />
                          </View>
                        </View>

                        <Show
                          if={repeat$.isWeeks}
                          else={() => <></>}
                          // wrap={AnimatePresence} TODO — import { AnimatePresence } from "framer-motion";
                        >
                          {() => {
                            return (
                              <>
                                <Text>ON</Text>
                                <View style={[ styles.subMenuSquare, {flexDirection: 'row', overflow: 'hidden'} ]}>
                                {
                                  dayOfWeek.map((item, index) => (
                                    <TouchableOpacity
                                      key={index}
                                      style={{
                                        flex: 1,
                                        backgroundColor: repeat$.weeks[index].get()
                                          ? "rgba(200, 0, 0, 0.75)"
                                          : "transparent",
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: 10,
                                      }}
                                      onPress={() => {
                                        if (repeat$.weeks.get().filter(x => x === true).length > 1 || !repeat$.weeks[index].get())
                                          repeat$.weeks[index].set(prev => !prev);
                                      }}
                                    >
                                      <Text>{item}</Text>
                                    </TouchableOpacity>
                                  ))
                                }
                                </View>
                              </>
                            )
                          }}
                        </Show>

                      <Show
                        if={repeat$.isRepeat}
                        else={() => <></>}
                      >
                        {() =>
                          <>
                            <Text>ENDS</Text>
                            <View style={[ styles.subMenuSquare ]}>
                              <TouchableOpacity style={[styles.subMenuBar, styles.subMenuSquarePadding]} onPress={() => {
                                repeat$.endsOnMode.set(false)
                              }}>
                                <Text style={styles.menuText}>Never</Text>
                                <Memo>
                                  {() =>
                                      repeat$.endsOnMode.get() ?
                                        <></>:
                                        <AntDesign name="check" size={18} color="rgba(2000, 0, 0, 0.75)" />
                                  }
                                </Memo>
                              </TouchableOpacity>

                              {/* TODO — Line */}
                              <TouchableOpacity
                                style={[styles.subMenuBar, styles.subMenuSquarePadding, { alignItems: 'center' }]}
                                disabled={repeat$.endsOnMode.get()}
                                onPress={() => {
                                  repeat$.endsOnMode.set(true)
                              }}>
                                <Text style={[styles.menuText]}>On Date</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <View style={{ marginRight: 8 }}>
                                    <Show
                                      if={repeat$.endsOnMode}
                                      else={() => <></>}
                                    >
                                      <RNDateTimePicker mode="date" display="compact" design="material" value={repeat$.endsOn.get().toDate()} onChange={(event, selectedDate) => repeat$.endsOn.set(dayjs(selectedDate))}/>
                                    </Show>
                                  </View>
                                  <Memo>
                                    {() =>
                                        repeat$.endsOnMode.get() ?
                                          <AntDesign name="check" size={18} color="rgba(2000, 0, 0, 0.75)" /> :
                                          <></>
                                    }
                                  </Memo>
                                </View>
                              </TouchableOpacity>

                            </View>
                          </>
                        }
                      </Show>
                    </>
                  )
                }}
              </Memo>
            </View>
          </View>
        </ScrollView>

        </View>
    </View>
  )
}

export default TimeGoalSelectSheet


const styles = StyleSheet.create({
  background: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  title: {
    fontWeight: 500,
    fontSize: 15,
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
    paddingBottom: 10,
    marginTop: 10
  },
  subMenuText: {
    paddingLeft: 10,
  },
  subMenuTextEnd: {
    paddingLeft: 10,
    paddingRight: 8,
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