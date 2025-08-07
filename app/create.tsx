import { Dimensions, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import React from 'react'
import { useNavigation, useRouter } from 'expo-router'
import { BlurView } from 'expo-blur';
import { $TextInput } from "@legendapp/state/react-native";
import { observable } from '@legendapp/state';
import { ScrollView } from 'react-native-gesture-handler';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { Memo } from '@legendapp/state/react';
import dayjs from 'dayjs';
import { RRule } from 'rrule';

// TODO — remove start_date
export const task$ = observable({
  title: '',
  description: '',
  start_date: null,
  rrule: null,
  isRepeating: false,
  timeGoal: 0,
});

const create = () => {
  const navigation = useNavigation();
  const router = useRouter();
  let { height } = Dimensions.get("window");

  return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false} style={{backgroundColor: 'transparent'}}>
    <View style={{ flex: 1, bottom: 0, position: 'aboslute', backgroundColor: 'transparent' }}>
      {/* <ScrollView keyboardShouldPersistTaps="always"> */}
      <Pressable onPress={() => navigation.goBack()} style={styles.background} />
            <View style={{
              height: 'auto',
              maxWidth: 500,
              borderRadius: 0,
              backgroundColor: 'white',
              padding: 15,
            }}>
              <$TextInput
                $value={task$.title}
                style={styles.textInput}
                autoFocus={true}
                multiline
                placeholder={"Task Name"}
                placeholderTextColor={'rgba(0, 0, 0, 0.5)'}
              />

              <$TextInput
                $value={task$.description}
                style={[styles.textInput, styles.description]}
                multiline
                placeholder="Description"
                placeholderTextColor={'rgba(0, 0, 0, 0.4)'}
              />

              <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => { router.push("/dateSelectSheet" )}}>
                    <Memo>
                      {() => {
                        if (task$.rrule.get())
                          return (
                            <>
                            {/* Catppuccin Latte Green */}
                              <AntDesign name="calendar" size={15} color="rgb(64, 160, 43)"/>
                              <Text style={[styles.actionText, { color: "rgb(64, 160, 43)" }]}>{dayjs(task$.rrule.get().DTSTART).format("MMM D YYYY")}</Text>
                              {
  (() => {

    return task$.isRepeating.get() ? (
      <AntDesign name="retweet" size={15} color="rgb(64, 160, 43)"/>
    ) : null;
  })()
}
                            </>
                          )

                      // else
                        return (
                          <>
                            <AntDesign name="calendar" size={15} color="rgba(0, 0, 0, 0.75)"/>
                            <Text style={styles.actionText}>Date</Text>
                          </>
                        )
                      }}
                    </Memo>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
                    <AntDesign name="clockcircleo" size={15} color="rgba(0, 0, 0, 0.75)"/>
                    <Text style={styles.actionText}>Time Goal</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionButton} onPress={() => {}}>

                    <AntDesign name="flag" size={15} color="rgba(0, 0, 0, 0.75)"/>
                    <Text style={styles.actionText}>Category</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
                    <MaterialIcons name="more-horiz" size={15} color="rgba(0, 0, 0, 0.75)"/>
                  </TouchableOpacity>

                </View>
              </ScrollView>
            </View>

      {/* </ScrollView> */}
    </View>
          </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
  )
}

export default create

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
  },
  textInput: {
    color: 'rgba(0, 0, 0)',
    fontSize: 18,
    fontWeight: 500,
  },
  fullTextInput: {
    maxWidth: 400,
    marginHorizontal: 20,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#343434',
  },
  description: {
    fontSize: 15,
    fontWeight: 400,
    minHeight: 35,
    marginBottom: 15,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  actionButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.3)',
    flexDirection: 'row',
    padding: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  actionText: {
    color: 'rgba(0, 0, 0, 0.75)',
    fontSize: 13,
    fontWeight: 500,
    paddingLeft: 5,
  }
})