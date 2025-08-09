import { Dimensions, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { Stack, useNavigation } from 'expo-router'
import { task$ } from './create'
import { Memo } from '@legendapp/state/react';
import { observable } from '@legendapp/state';
// import Picker from '@/components/TimeCarousel/Picker';
// import { Picker } from 'react-native-wheel-pick';
import Picker from '@/components/TimeCarousel/Picker';

const time$ = observable({
  hours: 1,
  minutes: 0,
});

const ITEM_HEIGHT = 34;
const VISIBLE_ITEMS = 5;
const pillOffsetX = 0;
const pillOffsetY = 0;
const pillColor = "rgba(0, 0, 0, 0.22)";
// const pillBorderColor = "rgba(0, 0, 0, 0.22)";
const pickerPadding = 70

// TODO — move this somewhere so that it only renders ONCE!!!
const minutes = new Array(60).fill(0).map((_, index) => (index));
const hours = new Array(24).fill(0).map((_, index) => (index));

const CategorySelectSheet = () => {
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
            console.log("The time has been sent: ", time$.hours.get(), time$.minutes.get(), task$.timeGoal.get())
            navigation.goBack()
          }}>
            <Text>Done</Text>
          </TouchableOpacity>
        </View>

        <View>
          <View style={{alignItems: 'center'}}>
          <View style={{ maxWidth: 400 | width, paddingHorizontal: 0, alignSelf: 'center', }}>
              <Memo>
                {() => {
                  // TODO — Gray out DONE button if time is set to 0!!!!
                  const hourString = time$.hours.get() > 1 ? "hours" : "hour"
                  const minuteString = time$.minutes.get() > 1 ? "minutes" : "minute"

                  const goalString = `${time$.hours.get() < 1 ? '' : `${time$.hours.get()} ${hourString}`} ${time$.minutes.get() < 1 ? '' : `${time$.minutes.get()} ${minuteString}`}`
                  return (
                    <>
                      <View style={ [styles.subMenuSquare, styles.subMenuSquarePadding] }>
                        <View style={[ ]}>

                        </View>
                        <View style={styles.subMenuBar}>
                          <Text style={styles.menuText}>Time Goal</Text>
                          <Text style={styles.menuTextEnd}>{goalString}</Text>
                        </View>

                        <View style={{ maxWidth: 380 }}>
                          <View style={{ flexDirection: "row", gap: 12, alignItems: "center", justifyContent: 'center', backgroundColor: 'transparent', paddingVertical: 14, paddingHorizontal: pickerPadding }}>
                            <Picker values={hours} legendState={time$.hours} defaultValue={time$.hours} unit="hours" enableSelectBox={true} ITEM_HEIGHT={34} VISIBLE_ITEMS={5}/>
                            <Picker values={minutes} legendState={time$.minutes} defaultValue={time$.minutes} unit="min" enableSelectBox={true} ITEM_HEIGHT={34} VISIBLE_ITEMS={5}/>
                            {/* <View style={styles.pill} /> */}
                          </View>
                        </View>
                      </View>
                    </>
                  )
                }}
              </Memo>
            </View>
          </View>
        </View>

        </View>
    </View>
  )
}

export default CategorySelectSheet


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
    width: '100%',
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
  },
  pill: {
    position: "absolute",
    right: pickerPadding, // was missing before
    // top: (ITEM_HEIGHT * VISIBLE_ITEMS - ITEM_HEIGHT) / 2,
    height: ITEM_HEIGHT,
    width: '100%',
    backgroundColor: pillColor,
    borderRadius: 12,
    zIndex: 20,
    elevation: 20,
    pointerEvents: "none",
    // transform: [{ translateX: pillOffsetX }, { translateY: pillOffsetY }],
  },
})