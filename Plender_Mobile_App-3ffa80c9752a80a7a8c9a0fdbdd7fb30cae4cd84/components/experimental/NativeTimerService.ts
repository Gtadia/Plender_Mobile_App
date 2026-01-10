/**
 * Experimental native timer interface placeholder.
 *
 * The real implementation would live in a custom native module (Android foreground
 * service / iOS background task) that tracks elapsed seconds even when the JS runtime
 * is suspended. We expose a minimal API that mirrors what the JS timer service does
 * today so we can swap it in later without touching the rest of the app.
 *
 * Usage idea:
 *   NativeTimerService.start(taskId, startedAtSeconds);
 *   NativeTimerService.stop();
 *
 * On the native side we could emit headless JS events or local notifications to let JS
 * know when ticks occur. For now we just log the intent so the rest of the app can be
 * built without worrying about linkage errors.
 */
import { NativeModules, Platform } from 'react-native';

type NativeTimerModule = {
  startForegroundTimer?: (taskId: number, startedAt: number) => void;
  stopForegroundTimer?: () => void;
};

const moduleRef: NativeTimerModule | undefined = NativeModules?.NativeTimerService;

const warnUnavailable = () => {
  console.warn(
    `[NativeTimerService] No native module registered${
      Platform.OS === 'ios'
        ? '. Implement via a background task / BGProcessing.'
        : '. Implement via a Foreground Service or Headless JS task.'
    }`
  );
};

export const NativeTimerService = {
  start(taskId: number, startedAt: number) {
    if (moduleRef?.startForegroundTimer) {
      moduleRef.startForegroundTimer(taskId, startedAt);
    } else {
      warnUnavailable();
    }
  },
  stop() {
    if (moduleRef?.stopForegroundTimer) {
      moduleRef.stopForegroundTimer();
    } else {
      warnUnavailable();
    }
  },
};
