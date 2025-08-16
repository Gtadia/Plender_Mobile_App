// -------------------------------------------------------------
// CategoryCreateSheet
// -------------------------------------------------------------
// Purpose:
//   Modal sheet for creating a new category type and assigning it
//   immediately to the current task.
//
// Key points:
//   - Uses a local observable `newCategory$` for name, color, and ID
//   - Color is selected using `reanimated-color-picker` (Panel3)
//   - Name is entered via `$TextInput` (Legend state binding)
//   - On "Done":
//       • Adds new category to global `Category$`
//       • Sets task$.category to the new category
//       • Increments global `CategoryIDCount$`
//   - Modal is presented as a transparent overlay via Expo Router
//
// Notes:
//   - Color picker uses initialHex ref to avoid frame-by-frame re-renders
//   - Category ID is generated from `CategoryIDCount$`
//   - Minimum height for container is 500px, max height ~6/8 screen
// -------------------------------------------------------------

import React, { useRef } from 'react';
import { View, Text, Pressable, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import ColorPicker, { Panel3 } from 'reanimated-color-picker';
import { task$ } from './create';
import { Stack, useNavigation } from 'expo-router';
import { Memo, useObservable } from '@legendapp/state/react';
import { $TextInput } from '@legendapp/state/react-native';
import { Category$, CategoryIDCount$ } from '@/utils/stateManager';

export default function CategoryCreateSheet() {
  const navigation = useNavigation();
  let { width, height } = Dimensions.get("window");
  const newCategory$ = useObservable({
    label: '',
    color: '#FF0000',
    id: Number(CategoryIDCount$.get())
  })
  // read once for initial color (don’t subscribe the picker)
  const initialHex = useRef(newCategory$.color.get()).current;
  // local live preview while dragging (no global re-render storm)

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
          <Text style={styles.title}>Select Date</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              const id = CategoryIDCount$.get();
              const cat = newCategory$.get(); // { label, color, id }

              // (optional) basic validation
              if (!cat.label.trim()) {
                console.warn("Category name required");
                return;
              }

              // 1) Save to global categories (Record<number, {label,color}>)
              Category$.assign({
                [id]: { label: cat.label, color: cat.color },
              });

              // 2) Assign to current task (your task shape seems to include id/label/color)
              task$.category.set({ id, label: cat.label, color: cat.color });

              // 3) Increment the ID counter for the next category
              CategoryIDCount$.set(id + 1);

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
                $value={newCategory$.label}
                style={styles.textInput}
                autoFocus={true}
                multiline
                placeholder={"Category Name"}
                placeholderTextColor={'rgba(0, 0, 0, 0.5)'}
              />
            </View>
          </View>
          {/* TEXT */}

          {/* COLOR */}
          <View style={[ styles.subMenuSquare ]}>
            <View style={[styles.subMenuBar, styles.subMenuSquarePadding, { alignItems: 'center' }]}>
              <Text style={styles.menuText}>Color</Text>
              {/* <Text style={styles.menuTextEnd}>Something</Text> */}
              <Memo>
                {() => (<View style={{ height: 20, aspectRatio: 1, borderRadius: 100, backgroundColor: newCategory$.color.get() }} />)}
              </Memo>
            </View>
            <View style={{ paddingVertical: 15}}>
              <ColorPicker
                value={initialHex}                       // initial-only; do not control per-frame
                style={{ width: '70%', aspectRatio: 1, alignSelf: 'center' }}
                onCompleteJS={(c) => newCategory$.color.set(c.hex)} // commit after gesture ends
              >
                <Panel3 centerChannel="saturation" />
              </ColorPicker>
            </View>
          </View>
          {/* COLOR */}
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