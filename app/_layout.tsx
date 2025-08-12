import React from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initializeDB } from '@/utils/database';
import { useBackNavOverride } from '@/utils/useBackNavOverride';

export default function TabLayout() {
  // intialize sqlite database
  initializeDB();
  useBackNavOverride();   // Overrides default back behavior of Android

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
    </GestureHandlerRootView>
  );
}
