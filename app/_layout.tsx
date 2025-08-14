import React from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { clearEvents, getEventsForDate, initializeDB } from '@/utils/database';
import { useBackNavOverride } from '@/utils/useBackNavOverride';
import { Toast } from '@/components/animation-toast/components';
import { toastShow$ } from '@/components/animation-toast/toastStore';
import { Today$ } from '@/utils/stateManager';

export default function TabLayout() {
  // intialize sqlite database
  initializeDB();
  useBackNavOverride();   // Overrides default back behavior of Android
  // clearEvents();

  // Load Today's Event's
  getEventsForDate(new Date()).then((events) => {
    Today$.set(events);
  })

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
      </Stack>

      {/* Toast Menu */}
      { toastShow$.whereToDisplay.get() == 0 && <Toast />}
    </GestureHandlerRootView>
  );
}
