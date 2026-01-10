import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { themeTokens$ } from '@/utils/stateManager';
import {Dimensions} from 'react-native';
import { horizontalPadding } from '@/constants/globalThemeVar';
import { observer } from '@legendapp/state/react';

const TaskList = observer(() => {
    const insets = useSafeAreaInsets();
    const { colors } = themeTokens$.get();
    const subtitleColor = colors.subtext0;
    const itemColor = colors.text;
    const styles = React.useMemo(
      () => createStyles({ subtitleColor, itemColor }),
      [subtitleColor, itemColor]
    );
  
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
        <View key={item.id} style={{ marginBottom: 9}}>
          <ListItem styles={styles} />
          {/* <Text style={styles.taskTitle}>{item.title}</Text> */}
        </View>
      ))}

      {/* Padding for the bottom */}
      <View style={{ height: insets.bottom + 130}} />
    </View>
  )
})

const ListItem = ({ styles }: { styles: ReturnType<typeof createStyles> }) => {

  return (
    <View style={ styles.listItems }>
      <View style={{ height: 16, width: 16, borderRadius: 100, backgroundColor: 'red', marginRight: 4 }}></View>
      <Text style={[styles.itemTitle, styles.subtitle1]}>{"This is a task"}</Text>
      <Text style={[styles.itemTitle, styles.subtitle2]}>{"4:00:00"}</Text>
      <Text style={[styles.itemTitle, styles.subtitle3]}>{"95%"}</Text>
    </View>
  )
}

const createStyles = ({ subtitleColor, itemColor }: { subtitleColor: string; itemColor: string }) => StyleSheet.create({
  listSubtitleContainer: {
    flexDirection: 'row',
    width: Dimensions.get('window').width - horizontalPadding * 2,
    marginTop: 16,
    marginBottom: 10,
  },
  listSubtitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: subtitleColor,
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
    minWidth: 80,
  },
  taskTitle: {
    fontSize: 14,
    color: '#333',
  },


  listItems: {
    flexDirection: 'row',
    alignItems: 'center',
    // paddingVertical: 10,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: itemColor,
  }

})

export default TaskList
