import React, { useRef } from 'react';
import { View, Text, Pressable, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import ColorPicker, { Panel3 } from 'reanimated-color-picker';
import { task$ } from './create';
import { Stack, useNavigation } from 'expo-router';
import { Memo, useObservable } from '@legendapp/state/react';
import { $TextInput } from '@legendapp/state/react-native';
import { Category$, CategoryIDCount$ } from '@/utils/stateManager';

export default function TaskEditView() {
  const navigation = useNavigation();
  let { width, height } = Dimensions.get("window");

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen name='dateSelectSheet' options={{
          headerShown: false,
          presentation: "transparentModal",
      }}/>

      <Pressable onPress={() => {navigation.goBack();}} style={styles.background} />
      <View style={[ styles.container, { height: height * 6 / 8, minHeight: 500 } ]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width:"100%", marginBottom: 15}}>
          <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
            <Text>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Task Details</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              // close
              (navigation as any).goBack?.();
            }}
          >
            <Text>Done</Text>
          </TouchableOpacity>
        </View>


        <View style={{ maxWidth: 400, paddingHorizontal: 0, alignSelf: 'center', }}>
          {/* TEXT */}
          <View style={[ styles.subMenuSquare, styles.subMenuSquarePadding ]}>
            <View style={[styles.subMenuBar, { alignItems: 'center' }]}>
              <Text style={styles.menuText}>Name</Text>
            </View>
            <View style={{ paddingVertical: 15}}>
               <$TextInput
                $value={"Hello"}
                style={styles.textInput}
                autoFocus={true}
                multiline
                placeholder={"Category Name"}
                placeholderTextColor={'rgba(0, 0, 0, 0.5)'}
              />
            </View>
          </View>
          {/* TEXT */}

        </View>
      </View>
    </View>
  );
}

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
  textInput: {
    color: 'rgba(0, 0, 0)',
    fontSize: 18,
    fontWeight: 500,
  },
})