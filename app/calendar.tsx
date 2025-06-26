import { StyleSheet, View, Text} from 'react-native';
import { ScreenView } from '@/components/Themed';
import TestWeekCalendarFR4 from '@/components/UI/TestWeekCalendarFR4';

export default function CalendarScreen() {
  // TODO — This is temporary, remove later

  return (
    <ScreenView style={styles.container}>
      <Text style={styles.title}>Calendar</Text>

      {/* TODO — week swipe, something  */}
      <TestWeekCalendarFR4 />
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
