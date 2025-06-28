import { StyleSheet, View, Text} from 'react-native';
import { ScreenView } from '@/components/Themed';
import { horizontalPadding } from '@/constants/globalThemeVar';
import SwipeableCalendar from '@/components/UI/SwipeableCalendar_ReanimatedCarousel';
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
      <SwipeableCalendar />
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
