import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colorTheme$ } from '@/utils/stateManager';
import {Dimensions} from 'react-native';
import { horizontalPadding } from '@/constants/globalThemeVar';

const TaskList = () => {
    const insets = useSafeAreaInsets();
  
    // TODO — This is temporary, remove later
    const items = [
      { id: "1", title: "Item 1" },
      { id: "2", title: "Item 2" },
      { id: "3", title: "Item 3" },
      { id: "4", title: "Item 4" },
      { id: "5", title: "Item 5" },
      { id: "6", title: "Item 6" },
      { id: "7", title: "Item 7" },
      { id: "8", title: "Item 8" },
      { id: "9", title: "Item 9" },
      { id: "10", title: "Item 10" },
    ];
  return (
    <View>
      {/* Task List subtitle */}
      <View style={styles.listSubtitleContainer}>
        <Text style={[styles.listSubtitle, styles.subtitle1]}>Task</Text>
        <Text style={[styles.listSubtitle, styles.subtitle2]}>Total Time</Text>
        <Text style={[styles.listSubtitle, styles.subtitle3]}>% of Day</Text>
      </View>

      {/* Task List */}
      {items.map((item) => (
        <View key={item.id} style={{ padding: 10 }}>
          <Text style={styles.taskTitle}>{item.title}</Text>
        </View>
      ))}

      {/* Padding for the bottom */}
      <View style={{ height: insets.bottom + 130}} />
    </View>
  )
}

const listItem = () => {

}

const styles = StyleSheet.create({
  listSubtitleContainer: {
    flexDirection: 'row',
    width: Dimensions.get('window').width - horizontalPadding * 2,
    marginTop: 16,
  },
  listSubtitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colorTheme$.colors.subtext0.get(),
  },
  subtitle1: {
    flex: 1,
  },
  subtitle2: {
    width: 100,
    textAlign: 'center',
  },
  subtitle3: {
    textAlign: 'center',
  },
  taskTitle: {
    fontSize: 14,
    color: '#333',
  },
})

export default TaskList