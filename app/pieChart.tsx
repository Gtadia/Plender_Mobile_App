import { StyleSheet, View } from 'react-native';
import { Text, ScreenView } from '@/components/Themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colorTheme$ } from '@/utils/stateManager';
import CircularProgress from '@/components/CircularProgress';
import RadialProgressBar from '@/components/UI/RadialProgressBar';

// TODO — IT'S NOT A PIE CHART, IT'S A CIRCULAR PROGRESS BAR CHANGE IT!!!!!!!
// TODO — Left and Right padding ==> 20
const horizontalPadding = 20;

export default function PieChartScreen() {
  const insets = useSafeAreaInsets();


  return (
    <ScreenView style={styles.container}>

      <View style={[styles.titleContainer, { paddingTop: insets.top }]}>
        <Text style={[styles.title]}>Pie Chart</Text>
      </View>

      {/* 28 -> font color, 15 -> padding between */}
      {/* <Text style={[styles.taskTitle, { top: insets.top + 28 + 15, }]}> */}
      <Text style={[styles.taskTitle]}>
        CS3511 Algo Homework
      </Text>

      {/* Time Progress — As a component*/}
      {/* <CircularProgress /> */}
      <RadialProgressBar />

      {/* Top Task Progress Bars — As a component */}

      {/* Task List — As a component */}
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    // justifyContent: 'center',
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
  taskTitle: {
    paddingTop: 15,
    fontSize: 20,
    color: colorTheme$.nativeTheme.colors.text.get(),
    fontWeight: 700,  // Use 700 for bold
    alignContent: 'flex-end',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
