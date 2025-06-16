import { StyleSheet, View} from 'react-native';
import { Text, ScreenView } from '@/components/Themed';
import { horizontalPadding } from '@/constants/globalThemeVar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SwipeableCalendar from '@/components/UI/SwipeableCalendar_Infinite3View';
import WeekCalendar from '@/components/UI/WeekCalendar';

export default function StatsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScreenView style={styles.container}>
      <View style={[styles.titleContainer, { paddingTop: insets.top }]}>
        <Text style={[styles.title]}>Stats</Text>
      </View>

{/* Weekly Stats View */}
      <SwipeableCalendar />
    {/* <WeekCalendar /> */}
      {/* TODO — Requires Swipeable */}
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
