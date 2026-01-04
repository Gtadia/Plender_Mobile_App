import React, { useEffect } from 'react';
import { View, Text, Pressable, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from 'expo-router';
import { $TextInput } from '@legendapp/state/react-native';
import { themeTokens$ } from '@/utils/stateManager';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export default function TaskEditView() {
  const navigation = useNavigation();
  const { height } = Dimensions.get("window");
  const translateY = useSharedValue(height);
  const isDark = themeTokens$.isDark.get();
  const overlayColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.35)";

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 260 });
  }, [translateY]);

  const closeSheet = () => {
    translateY.value = withTiming(height, { duration: 220 }, (finished) => {
      if (finished) {
        runOnJS(() => navigation.goBack())();
      }
    });
  };

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: overlayColor }}>
      <Pressable onPress={closeSheet} style={styles.background} />
      <Animated.View style={[ styles.container, { height: height * 6 / 8, minHeight: 500 }, sheetStyle ]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width:"100%", marginBottom: 15}}>
          <TouchableOpacity style={styles.button} onPress={closeSheet}>
            <Text>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Task Details</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              // close
              closeSheet();
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
      </Animated.View>
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
