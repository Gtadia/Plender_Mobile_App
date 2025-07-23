import { StyleSheet, View, Text} from 'react-native';
import { ScreenView } from '@/components/Themed';
import { horizontalPadding } from '@/constants/globalThemeVar';
// import RowCalendar from '@/components/custom_ui/TestWeekCalendarFR7';
import MonthlyCalendar from '@/components/custom_ui/MonthlyCalendar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarActiveDateRange, CalendarOnDayPress, fromDateId, toDateId } from '@marceloterreiro/flash-calendar';
import { useCallback, useMemo, useState } from 'react';
import { format } from 'date-fns/fp';
import { add, sub } from 'date-fns';

export default function CalendarScreen() {
  // TODO — This is temporary, remove later
  const insets = useSafeAreaInsets();

  const [selectedDate, setSelectedDate] = useState<Date>(
    sub(new Date(), { days: 1 })
  );
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());

  const calendarActiveDateRanges = useMemo<CalendarActiveDateRange[]>(
    () => [
      {
        startId: toDateId(selectedDate),
        endId: toDateId(selectedDate),
      },
    ],
    [selectedDate]
  );

  const handleDayPress = useCallback<CalendarOnDayPress>((dateId) => {
    setCurrentCalendarMonth(fromDateId(dateId));
    setSelectedDate(fromDateId(dateId));
    console.log("Selected date:", fromDateId(dateId));
  }, []);

  const handlePreviousMonth = useCallback(() => {
    setCurrentCalendarMonth(sub(currentCalendarMonth, { months: 1 }));
  }, [currentCalendarMonth]);

  const handleNextMonth = useCallback(() => {
    setCurrentCalendarMonth(add(currentCalendarMonth, { months: 1 }));
  }, [currentCalendarMonth]);

  return (
    <ScreenView style={styles.container}>
            <View style={[styles.titleContainer, { paddingTop: insets.top }]}>
              <Text style={[styles.title]}>Calendar</Text>
            </View>

      {/* TODO — week swipe, something  */}
      <MonthlyCalendar
        calendarActiveDateRanges={calendarActiveDateRanges}
        calendarMonthId={toDateId(currentCalendarMonth)}
        getCalendarWeekDayFormat={format("E")}
        onCalendarDayPress={handleDayPress}
        onNextMonthPress={handleNextMonth}
        onPreviousMonthPress={handlePreviousMonth}
      />
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
