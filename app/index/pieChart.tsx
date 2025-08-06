import { Dimensions, StyleSheet, View, ScrollView } from 'react-native';
import { Text, ScreenView } from '@/components/Themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colorTheme$ } from '@/utils/stateManager';
import CircularProgress from '@/components/CircularProgress';
import RadialProgressBar from '@/components/custom_ui/RadialProgressBar';
import HorizontalProgressBar from '@/components/custom_ui/HorizontalProgressBar';
import { horizontalPadding } from '@/constants/globalThemeVar';
import TaskList from '@/components/custom_ui/TaskList';


// TODO — IT'S NOT A PIE CHART, IT'S A CIRCULAR PROGRESS BAR CHANGE IT!!!!!!!



export default function PieChartScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScreenView style={styles.container}>
      <View style={[styles.titleContainer, { paddingTop: insets.top }]}>
        <Text style={[styles.title]}>Pie Chart</Text>
      </View>

      {/* 28 -> font color, 15 -> padding between */}
      {/* <Text style={[styles.taskTitle, { top: insets.top + 28 + 15, }]}> */}

          <ScrollView
            contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}
          >
            <Text style={[styles.taskTitle]}>
              CS3511 Algo Homework
            </Text>

            {/* Time Progress — As a component*/}
            {/* <CircularProgress /> */}
            <RadialProgressBar />

            {/* Top Task Progress Bars — As a component */}
            <HorizontalProgress />

            {/* Task List — As a component */}
            <TaskList />
          </ScrollView>
    </ScreenView>
  );
}

function HorizontalProgress() {
  const windowWidth = Dimensions.get('window').width;
  const MAX_WIDTH = 500;
  const padding = 20;

  const progressWidth = (windowWidth - padding * 2) > 800 ? MAX_WIDTH : (windowWidth - padding * 2);

  const ProgressItem = ({task}: any) => {

    return (
      <View>
        <Text>
          {task.title}
        </Text>
        <Text>
          {`${task.percentage * 100}%`}
        </Text>
        <View>
          <HorizontalProgressBar width={(windowWidth - padding * 4) / 3} percentage={task.percentage} color={task.color}/>
        </View>
      </View>
    )
  }

  return (
    <View
      style={{width: progressWidth, flexDirection: 'row', justifyContent: "space-between", marginTop: 16, borderWidth: 1, borderColor: colorTheme$.colors.primary.get()}}
    >
      <ProgressItem task={{title: "Day Progress", percentage: 0.5, color: colorTheme$.colors.secondary.get()}} />
      <ProgressItem task={{title: "School", percentage: 0.3, color: colorTheme$.colors.primary.get()}} />
      <ProgressItem task={{title: "Chores", percentage: 0.1, color: colorTheme$.colorTheme.blue.get()}} />
    </View>
  )
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
