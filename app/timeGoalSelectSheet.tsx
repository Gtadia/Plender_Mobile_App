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
import RNDateTimePicker from '@react-native-community/datetimepicker';

const time$ = observable({
  hours: 1,
  minutes: 0,
});

// TODO — move this somewhere so that it only renders ONCE!!!
const minutes = new Array(60).fill(0).map((_, index) => (index));
const hours = new Array(24).fill(0).map((_, index) => (index));

const TimeGoalSelectSheet
 = () => {
  const navigation = useNavigation();
  let { width, height } = Dimensions.get("window");

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
            task$.timeGoal.set(time$.hours.get() * 3600 + time$.minutes.get() * 60)
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
                  // TODO — Gray out DONE button if time is set to 0!!!!
                  const hourString = time$.hours.get() > 1 ? "hours" : "hour"
                  const minuteString = time$.minutes.get() > 1 ? "minutes" : "minute"

                  const goalString = `${time$.hours.get() < 1 ? '' : `${time$.hours.get()} ${hourString}`} ${time$.minutes.get() < 1 ? '' : `${time$.minutes.get()} ${minuteString}`}`
                  return (
                    <>
                      <View style={ [styles.subMenuSquare, styles.subMenuSquarePadding] }>
                        <View style={styles.subMenuBar}>
                          <Text style={styles.menuText}>Time Goal</Text>
                          <Text style={styles.menuTextEnd}>{goalString}</Text>
                        </View>
                          <View style={{ flexDirection: 'row' }}>
                            <Picker
                              style={{ backgroundColor: 'white', width: "50%", height: 215 }}
                              itemStyle={{ fontSize: 18 }}
                              selectedValue={time$.hours.get()}
                              value={time$.hours.get()}
                              pickerData={hours}
                              onValueChange={(value: number) => {time$.hours.set(value)}}
                            />
                            <Picker
                              isShowSelectLine={false} // Default is true
                              selectLineColor='black'
                              selectLineSize={6} // Default is 4
                              style={{ backgroundColor: 'white', width: "50%", height: 215 }}
                              itemStyle={{ fontSize: 18 }}
                              selectedValue={time$.minutes.get()}
                              value={time$.minutes.get()}
                              pickerData={minutes}
                              onValueChange={(value: number) => {time$.minutes.set(value)}}
                            />
                          </View>
                        </View>
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