import React, { useEffect } from 'react';
import { Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initializeDB } from '@/utils/database';
import { useBackNavOverride } from '@/utils/useBackNavOverride';
import { Toast } from '@/components/animation-toast/components';
import { Host } from 'react-native-portalize';
import { dayKey$, ensureCategoriesHydrated, ensureSettingsHydrated, ensureStylingHydrated, loadDay, themeTokens$ } from '@/utils/stateManager';
import { fakeNow$, getNow } from '@/utils/timeOverride';
import { AppState } from 'react-native';
import { observer } from '@legendapp/state/react';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import dayjs from 'dayjs';
import moment from 'moment';
dayjs.extend(utc);
dayjs.extend(timezone);

let hasBootstrapped = false;

const RootLayout = observer(() => {
  useBackNavOverride();   // Overrides default back behavior of Android

  const isDark = themeTokens$.isDark.get();
  const segments = useSegments();
  const isModalGroup = segments[0] === '(tasks)' || segments[0] === '(calendar)' || segments[0] === '(overlays)';

  useEffect(() => {
    if (hasBootstrapped) return;
    hasBootstrapped = true;

    void (async () => {
      try {
        await initializeDB();
        console.log("Initialize DB cache");
        await Promise.all([
          ensureCategoriesHydrated(),
          ensureStylingHydrated(),
          ensureSettingsHydrated(),
        ]);
        await loadDay(moment(getNow()).startOf("day").toDate());
      } catch (err) {
        console.warn("Failed app bootstrap", err);
      }
    })();
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const syncDayKey = async () => {
      const now = moment(getNow());
      const nextKey = now.format("YYYY-MM-DD");
      if (dayKey$.get() !== nextKey) {
        dayKey$.set(nextKey);
        await loadDay(now.startOf("day").toDate());
      }
    };

    const scheduleNext = () => {
      if (timeoutId) clearTimeout(timeoutId);
      const now = moment(getNow());
      const nextMidnight = now.clone().add(1, "day").startOf("day");
      const msUntil = Math.max(nextMidnight.diff(now), 1000);
      timeoutId = setTimeout(async () => {
        await syncDayKey();
        scheduleNext();
      }, msUntil);
    };

    void syncDayKey();
    scheduleNext();

    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void syncDayKey();
        scheduleNext();
      }
    });

    const fakeSub = fakeNow$.onChange(() => {
      void syncDayKey();
      scheduleNext();
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      appStateSub?.remove?.();
      if (typeof fakeSub === "function") {
        fakeSub();
      } else {
        fakeSub?.off?.();
      }
    };
  }, []);

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
