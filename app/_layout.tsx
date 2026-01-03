import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { clearEvents, eventsType, getEventsForDate, initializeDB } from '@/utils/database';
import { useBackNavOverride } from '@/utils/useBackNavOverride';
import { Toast } from '@/components/animation-toast/components';
import { toastShow$ } from '@/components/animation-toast/toastStore';
import { ensureCategoriesHydrated, ensureSettingsHydrated, ensureStylingHydrated, loadDay, tasks$, themeTokens$ } from '@/utils/stateManager';
import { observer } from '@legendapp/state/react';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import dayjs from 'dayjs';
import moment from 'moment';
dayjs.extend(utc);
dayjs.extend(timezone);

const RootLayout = observer(() => {
  // intialize sqlite database
  // clearEvents();
  initializeDB();
  useBackNavOverride();   // Overrides default back behavior of Android

  // Load Today's Event's
  console.log("Initialize DB cache")
  ensureCategoriesHydrated().catch((err) => console.warn("Failed to hydrate categories", err));
  ensureStylingHydrated().catch((err) => console.warn("Failed to hydrate styling", err));
  ensureSettingsHydrated().catch((err) => console.warn("Failed to hydrate settings", err));
  // getEventsForDate(new Date()).then((events) => {
  //   Today$.set(events);
  // })
  getEventsForDate(moment().startOf("day").toDate()).then((tasks) => {
    // Save Today's events by its category
    tasks.forEach(r => tasks$.entities[r.id].set(r));
  });
  loadDay(new Date());

  const isDark = themeTokens$.isDark.get();

  return (
    <GestureHandlerRootView>
      <StatusBar style={isDark ? "light" : "dark"} />
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
        <Stack.Screen name="calendarDateSheet" options={{
          headerShown: false,
          presentation: "transparentModal",
          animation: "fade",
        }}/>
        <Stack.Screen name="settingsThemeSelect" options={{
          headerShown: false,
          animation: "slide_from_right",
        }}/>
        <Stack.Screen name="settingsAccentSelect" options={{
          headerShown: false,
          animation: "slide_from_right",
        }}/>
        <Stack.Screen name="settingsWeekStartSelect" options={{
          headerShown: false,
          animation: "slide_from_right",
        }}/>
        <Stack.Screen name="settingsTimezoneSelect" options={{
          headerShown: false,
          animation: "slide_from_right",
        }}/>
      </Stack>

      {/* Toast Menu */}
      { toastShow$.whereToDisplay.get() == 0 && <Toast />}
    </GestureHandlerRootView>
  );
});

export default RootLayout;
