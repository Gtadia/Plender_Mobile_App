import { Button, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import { useNavigation } from 'expo-router'
import { BlurView } from 'expo-blur';
import DateTimePicker, { useDefaultStyles } from 'react-native-ui-datepicker';
import dayjs, { Dayjs } from 'dayjs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { selectedDate$ } from './rowCalendar';

const bottomSheet = () => {
  const navigation = useNavigation();
  const [date, setDate] = useState<Dayjs>(selectedDate$.get());
  let { height } = Dimensions.get("window");

  return (
    <View style={{ flex: 1 }}>
      <Pressable onPress={() => navigation.goBack()} style={styles.background} />
      <BlurView
        experimentalBlurMethod='dimezisBlurView'    // for android
        intensity={90}
        tint='light'
        style={[styles.blurView, {height: height * 5 / 8 }]}
      >
        <Text>Select Date</Text>
{/* <Memo>
          {() => */}
          <View style={{ maxWidth: 350, paddingHorizontal: 15, borderWidth: 1, alignSelf: 'center'}}>
            <DateTimePicker
              mode="single"
              // date={date$.get()}
              // onChange={(event) => {date$.set(event.date)}}
              date={date}
              onChange={(event) => {setDate(dayjs(event.date))}}
              // style={{  }}
              styles={{
                ...useDefaultStyles,
                today: { borderColor: 'black', borderRadius: 1000, borderWidth: 1, backgroundColor: 'transparent'},
                selected: { backgroundColor: 'black', borderRadius: 1000 },
                selected_label: { color: 'white' },  // selected date's text color
                // header: { borderRadius: 1000,  backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'space-evenly', alignItems: 'center', flexDirection: 'row' },
                month_selector: { borderRadius: 1000, backgroundColor: 'red', padding: 10, },
                year_selector: { borderRadius: 1000, backgroundColor: 'red', padding: 10, },
                button_prev: { borderRadius: 1000, backgroundColor: 'red', padding: 10, },
                button_next: { borderRadius: 1000, backgroundColor: 'red', padding: 10, },
              }}
            />

            <Button title="Select Date" onPress={() => {
              console.log("Selected Date: ", date?.toLocaleString());
              selectedDate$.set(date);
              navigation.goBack();
            }} />
          </View>
          {/* }
        </Memo> */}
      </BlurView>
    </View>
  )
}

export default bottomSheet

const styles = StyleSheet.create({
  background: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  blurView: {
    // height: 'auto',
    minHeight: 300,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    zIndex: 1000,
    elevation: 10,
    // borderTopLeftRadius: 30,
    // borderTopRightRadius: 30,
  }
})