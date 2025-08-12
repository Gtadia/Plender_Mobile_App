import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, ScreenView } from '@/components/Themed';
import { horizontalPadding } from '@/constants/globalThemeVar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CurrentTaskView = () => {
  const noTaskView = <View style={[taskStyles.container, {backgroundColor: 'gray'}]}>
      <Text style={taskStyles.taskText}>No Task Running</Text>
      <Text style={taskStyles.taskSubText}>Start a task to see it running here!</Text>
    </View>

  const taskView = <View>
    <Text style={taskStyles.taskText}>{}</Text>
    <Text>{}</Text>
  </View>

  return (
    noTaskView
  )
}

export default function TabOneScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScreenView style={styles.container}>
      <View style={[styles.titleContainer, { paddingTop: insets.top }]}>
        <Text style={[styles.title]}>Home</Text>
      </View>
      <ScrollView style={{ width: '100%', }}>

  {/* Current Task Progress */}
  {/* marginTop: 15  */}
  {/* Padding near bottom so users can scroll past UI components */}

  <CurrentTaskView />



        {/* <View
          style={{
            height: 800,
            backgroundColor: "black",
          }}
        >

        </View> */}
      </ScrollView>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  titleContainer: {
    width: '100%',
  },
  title: {
    left: horizontalPadding,
    color: '#000',
    fontSize: 28,
    marginLeft: 0,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});

const taskStyles = StyleSheet.create({
  container: {
    maxWidth: 500,
    flex: 1,
    marginHorizontal: 30,
    borderRadius: 20,
    justifyContent: 'center',
    alignContent: 'center',
    paddingVertical: 15,
    height: 140,
  },
  taskText: {
    fontSize: 16,
    fontWeight: 700,
    color: 'white',
    textAlign: 'center'
  },
  taskSubText: {
    fontSize: 14,
    fontWeight: 500,
    color: 'white',
    textAlign: 'center'
  }
})