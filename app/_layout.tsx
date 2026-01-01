import React from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { clearEvents, eventsType, getEventsForDate, initializeDB } from '@/utils/database';
import { useBackNavOverride } from '@/utils/useBackNavOverride';
import { Toast } from '@/components/animation-toast/components';
import { toastShow$ } from '@/components/animation-toast/toastStore';
import { loadDay, tasks$ } from '@/utils/stateManager';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import dayjs from 'dayjs';
import moment from 'moment';
dayjs.extend(utc);
dayjs.extend(timezone);

export default function TabLayout() {
  // intialize sqlite database
  // clearEvents();
  initializeDB();
  useBackNavOverride();   // Overrides default back behavior of Android

  // Set dayjs timezone
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  dayjs.tz.setDefault(localZone);
  console.log("Default timezone set to:", localZone);

  // Load Today's Event's
  console.log("Initialize DB cache")
  // getEventsForDate(new Date()).then((events) => {
  //   Today$.set(events);
  // })
  getEventsForDate(moment().startOf("day").toDate()).then((tasks) => {
    // Save Today's events by its category
    tasks.forEach(r => tasks$.entities[r.id].set(r));
  });
  loadDay(new Date());

  return (
    <GestureHandlerRootView>
      <Stack
        screenOptions={({ route }) => ({
          headerShown: false,
        })}
        initialRouteName='index'
        >

        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="create" options={{
          headerShown: false,
          presentation: "transparentModal",
          animation: "fade",
        }}/>
        <Stack.Screen name="taskDetailsSheet" options={{
          headerShown: false,
          presentation: "transparentModal",
          animation: "fade",
        }}/>
      </Stack>

      {/* Toast Menu */}
      { toastShow$.whereToDisplay.get() == 0 && <Toast />}
    </GestureHandlerRootView>
  );
}
