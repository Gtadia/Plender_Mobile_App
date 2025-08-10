import { Dimensions, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import React from 'react'
import { useNavigation, useRouter } from 'expo-router'
import { BlurView } from 'expo-blur';
import { $TextInput } from "@legendapp/state/react-native";
import { observable } from '@legendapp/state';
import { ScrollView } from 'react-native-gesture-handler';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { Memo, Show } from '@legendapp/state/react';
import dayjs from 'dayjs';
import { RRule } from 'rrule';
import { Category$ } from '@/utils/stateManager';
import Animated, { useAnimatedKeyboard, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// TODO — remove start_date
interface categoryItem {
  label: string,
  color: string,
  id: number
}
export const task$ = observable({
  title: '',
  description: '',
  category: {label: '', color: '', id: 0},
  start_date: null,
  rrule: null,
  isRepeating: false,
  timeGoal: 0,
});
const categoryPopup$ = observable(false)

const CategoryPopup = ({
    width = 250,
    position = {bottom: 145, left: 25}
  } : {
    width?: number,
    position?: { bottom?: number; left?: number; right?: number; top?: number }
  }) => {
  const popupStyle = {
  subMenuSquare: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
  },
  subMenuSquarePadding: {
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  }

  const categoryStyles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    maxHeight: 320,
    // shadow
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  list: { paddingVertical:0,  },
  row: {
    paddingVertical: 4,
    justifyContent: 'center',
  },
  label: { fontSize: 16, color: '#111' },
});

const { height, state } = useAnimatedKeyboard(); // RNR v3
const insets = useSafeAreaInsets();
const baseBottom = position.bottom || 145;

const style = useAnimatedStyle(() => {
  const kb = Math.max(0, height.value);
  return { bottom: withTiming(baseBottom + kb, { duration: 40 }) };
});

  return (
      <Animated.View style={ [style, { width, position: 'absolute', ...position }]}>
            <Show
      if={categoryPopup$}
      else={<></>}
    >
    {() =>
        <View style={categoryStyles.card}>
          <ScrollView
            bounces={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={categoryStyles.list}
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps={'always'}
          >
            {Category$.get().map((item, index) => (
              <Pressable
                key={item.id}
                style={categoryStyles.row}
                onPress={() => {
                  console.log("Un poco loco: ", item.label, item.id)
                  task$.category.set(item)
                }}
              >
                <Text style={[categoryStyles.label, item.color ? { color: item.color } : null]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
  }</Show>
      </Animated.View>
  )
}

const create = () => {
  const navigation = useNavigation();
  const router = useRouter();
  let { height } = Dimensions.get("window");

  return (
    <View style={{flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)"}}>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false} style={{backgroundColor: 'transparent', flex:1}}>
      <Pressable onPress={() => navigation.goBack()} style={styles.background} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ bottom: 0, position: 'relative', backgroundColor: 'transparent' }}
        >
        <ScrollView
          keyboardShouldPersistTaps={'always'}
          scrollEnabled={false}
        >
      {/* <ScrollView keyboardShouldPersistTaps="always"> */}
            <View
              style={{
                height: 'auto',
                maxWidth: 500,
                borderRadius: 0,
                backgroundColor: 'white',
                padding: 15,
              }}
            >
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

              <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps={'always'}>
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

                  <TouchableOpacity style={styles.actionButton} onPress={() => { router.push('/timeGoalSelectSheet')}}>
                    <AntDesign name="clockcircleo" size={15} color="rgba(0, 0, 0, 0.75)"/>
                    <Text style={styles.actionText}>Time Goal</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionButton} onPress={() => {
                    categoryPopup$.set((prev) => !prev)
                    console.log(categoryPopup$.get())
                  }}>
                    <Memo>
                      {() => {
                        if (task$.category.id.get() == 0)
                          return (
                            <>
                              <AntDesign name="flag" size={15} color="rgba(0, 0, 0, 0.75)"/>
                              <Text style={styles.actionText}>Category</Text>
                            </>
                          )
                        return (
                          <>
                            <AntDesign name="flag" size={15} color={task$.category.color.get()}/>
                            <Text style={[styles.actionText, {color: task$.category.color.get(), maxWidth: 120}]} numberOfLines={1} ellipsizeMode='tail'>{task$.category.label.get()}</Text>
                          </>
                        )
                    }}
                    </Memo>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
                    <MaterialIcons name="more-horiz" size={15} color="rgba(0, 0, 0, 0.75)"/>
                  </TouchableOpacity>

                </View>
              </ScrollView>
            </View>
    </ScrollView>
<CategoryPopup />
      </KeyboardAvoidingView>

    </View>
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
    paddingHorizontal: 5,
  }
})