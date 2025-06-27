import { StyleSheet, View, Text} from 'react-native';
import { ScreenView } from '@/components/Themed';
import { horizontalPadding } from '@/constants/globalThemeVar';
import TestWeekCalendarFR4 from '@/components/UI/TestWeekCalendarFR4';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CalendarScreen() {
  // TODO — This is temporary, remove later
  const insets = useSafeAreaInsets();

  return (
    <ScreenView style={styles.container}>
            <View style={[styles.titleContainer, { paddingTop: insets.top }]}>
              <Text style={[styles.title]}>Calendar</Text>
            </View>

      {/* TODO — week swipe, something  */}
      <TestWeekCalendarFR4 />
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
