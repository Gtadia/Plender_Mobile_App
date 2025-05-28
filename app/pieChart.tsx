import { StyleSheet } from 'react-native';
import { Text, ScreenView } from '@/components/Themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colorTheme$ } from '@/utils/stateManager';

// TODO — Left and Right padding ==> 20
const horizontalPadding = 20;

export default function PieChartScreen() {
  const insets = useSafeAreaInsets();


  return (
    <ScreenView style={styles.container}>
      <Text style={[styles.title, { top: insets.top }]}>Pie Chart</Text>

      {/* 28 -> font color, 15 -> padding between */}
      <Text style={[styles.taskTitle, { top: insets.top + 28 + 15, }]}>
        CS3511 Algo Homework
      </Text>

      {/* Time Progress — As a component*/}

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
  },
  title: {
    position: 'absolute',
    left: horizontalPadding,
    color: '#000',
    fontSize: 28,
    fontWeight: 'bold',
  },
  taskTitle: {
    fontSize: 20,
    color: colorTheme$.nativeTheme.colors.text.get(),
    fontWeight: 500,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
