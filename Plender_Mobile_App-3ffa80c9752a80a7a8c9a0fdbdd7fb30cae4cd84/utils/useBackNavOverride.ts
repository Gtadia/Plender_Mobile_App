// -------------------------------------------------------------
// useBackNavOverride (ANDROID)
// -------------------------------------------------------------
// Purpose:
//   Pervent Android's default behavior of (Back ==> Hide Keyboard ==> Back again ==> Navigate).
//   Instead, Back ==> Navigate fires instead.
// -------------------------------------------------------------

import { BackHandler } from 'react-native';
import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

export function useBackNavOverride() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (router.canGoBack()) {
          router.back();      // navigate immediately
          return true;        // tell Android we handled it (don’t dismiss keyboard first)
        }
        return false;          // at root: let OS handle (minimize/exit)
      };

      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [router])
  );
}