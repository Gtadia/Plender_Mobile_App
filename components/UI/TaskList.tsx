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
        <View key={item.id} style={{  }}>
          <ListItem />
          {/* <Text style={styles.taskTitle}>{item.title}</Text> */}
        </View>
      ))}

      {/* Padding for the bottom */}
      <View style={{ height: insets.bottom + 130}} />
    </View>
  )
}

const ListItem = () => {

  return (
    <View style={styles.listItems}>
      {/* subtitle1 needs to be a view */}
      <View>
        
      </View>
      <Text style={[styles.itemTitle, styles.subtitle1]}>{"This is a task"}</Text>
      <Text style={[styles.itemTitle, styles.subtitle2]}>{"4:00:00"}</Text>
      <Text style={[styles.itemTitle, styles.subtitle3]}>{"95%"}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  listSubtitleContainer: {
    flexDirection: 'row',
    width: Dimensions.get('window').width - horizontalPadding * 2,
    marginTop: 16,
    marginBottom: 16,
  },
  listSubtitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colorTheme$.colors.subtext0.get(),
  },
  subtitle1: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'green',
  },
  subtitle2: {
    width: 100,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'red',
  },
  subtitle3: {
    textAlign: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: 'blue',
  },
  taskTitle: {
    fontSize: 14,
    color: '#333',
  },


  listItems: {
    flexDirection: 'row',
    // paddingVertical: 10,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colorTheme$.colors.subtext1.get(),
    marginBottom: 9,
  }

})

export default TaskList