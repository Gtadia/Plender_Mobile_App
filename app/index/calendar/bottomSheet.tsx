import { Dimensions, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useEffect } from 'react';
import { useNavigation } from 'expo-router';
import DateTimePicker, { useDefaultStyles } from 'react-native-ui-datepicker';
import moment, { Moment } from 'moment';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { selectedDate$ } from './rowCalendar';
import { Memo, observer } from '@legendapp/state/react';
import { observable } from '@legendapp/state';
import { useFocusEffect } from '@react-navigation/native';
import { Text } from '@/components/Themed';
import { PlatformBlurView } from "@/components/PlatformBlurView";
import { styling$, themeTokens$ } from '@/utils/stateManager';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const pickerDate$ = observable<Moment>(selectedDate$.get());

type ThemeTokens = ReturnType<typeof themeTokens$.get>;

const bottomSheet = observer(() => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { height } = Dimensions.get('window');
  const translateY = useSharedValue(height);
  const { palette, isDark } = themeTokens$.get();
  const blurEnabled = styling$.tabBarBlurEnabled.get();
  const overlayColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.35)";
  const styles = createStyles({ palette });

  useFocusEffect(
    useCallback(() => {
      pickerDate$.set(selectedDate$.get());
      return () => {};
    }, [])
  );

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 260 });
  }, [translateY]);

  const closeSheet = useCallback(() => {
    translateY.value = withTiming(height, { duration: 220 }, (finished) => {
      if (finished) {
        runOnJS(navigation.goBack)();
      }
    });
  }, [height, navigation, translateY]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.overlay}>
      {blurEnabled ? (
      <PlatformBlurView
        tint={isDark ? "dark" : "light"}
        intensity={40}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      ) : null}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]}
      />
      <Pressable onPress={closeSheet} style={styles.background} />
      <Animated.View
        style={[
          styles.sheet,
          { maxHeight: height * 0.72, paddingBottom: Math.max(24, insets.bottom + 12) },
          sheetStyle,
        ]}
      >
        <View style={styles.handle} />
        <Text style={styles.sheetTitle}>Select Date</Text>
        <Memo>
          {() => {
            const date = pickerDate$.get();
            return (
              <View style={styles.pickerWrapper}>
                <DateTimePicker
                  mode="single"
                  date={date}
                  onChange={(event) => {
                    if (!event.date) return;
                    pickerDate$.set(moment(event.date));
                  }}
                  styles={{
                    ...useDefaultStyles,
                    today: {
                      borderColor: palette.text,
                      borderRadius: 1000,
                      borderWidth: 1,
                      backgroundColor: 'transparent',
                    },
                    selected: { backgroundColor: palette.text, borderRadius: 1000 },
                    selected_label: { color: palette.base },
                    month_selector: { backgroundColor: palette.surface1, borderRadius: 10 },
                    year_selector: { backgroundColor: palette.surface1, borderRadius: 10 },
                    button_prev: { backgroundColor: palette.surface1, borderRadius: 10 },
                    button_next: { backgroundColor: palette.surface1, borderRadius: 10 },
                  }}
                />
              </View>
            );
          }}
        </Memo>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => {
            const next = pickerDate$.get().clone().startOf('day');
            selectedDate$.set(next);
            closeSheet();
          }}
        >
          <Text style={styles.confirmText}>Select Date</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
})

export default bottomSheet

const createStyles = ({ palette }: { palette: ThemeTokens["palette"] }) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  background: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: palette.base,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -8 },
    elevation: 10,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: palette.surface1,
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  pickerWrapper: {
    alignSelf: 'center',
    backgroundColor: palette.base,
  },
  confirmButton: {
    marginTop: 12,
    backgroundColor: palette.text,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmText: {
    color: palette.base,
    fontWeight: '700',
    fontSize: 16,
  },
});
