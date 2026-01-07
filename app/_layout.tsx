import React from 'react';
import { Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { clearEvents, eventsType, getEventsForDate, initializeDB } from '@/utils/database';
import { useBackNavOverride } from '@/utils/useBackNavOverride';
import { Toast } from '@/components/animation-toast/components';
import { Host } from 'react-native-portalize';
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
  const segments = useSegments();
  const isModalGroup = segments[0] === '(tasks)' || segments[0] === '(calendar)' || segments[0] === '(overlays)';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <Host>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
          initialRouteName="index"
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="(tasks)"
            options={{
              presentation: "transparentModal",
              animation: "fade",
              contentStyle: { backgroundColor: "transparent" },
            }}
          />
          <Stack.Screen
            name="(calendar)"
            options={{
              presentation: "transparentModal",
              animation: "fade",
              contentStyle: { backgroundColor: "transparent" },
            }}
          />
          <Stack.Screen
            name="(settings)"
            options={{ presentation: "card", animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="(overlays)"
            options={{
              presentation: "transparentModal",
              animation: "fade",
              contentStyle: { backgroundColor: "transparent" },
            }}
          />
        </Stack>
        {/* Toast Menu */}
        {!isModalGroup && <Toast />}
      </Host>
    </GestureHandlerRootView>
  );
});

export default RootLayout;
