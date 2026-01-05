import React, { useCallback, useEffect } from "react";
import { Dimensions, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import { useNavigation } from "expo-router";
import moment, { Moment } from "moment";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Memo, observer } from "@legendapp/state/react";
import { observable } from "@legendapp/state";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useFocusEffect } from "@react-navigation/native";
import { Text } from "@/components/Themed";
import { selectedDate$ } from "@/app/index/calendar/rowCalendar";
import { getNow } from "@/utils/timeOverride";
import { BlurView } from "expo-blur";
import { styling$, themeTokens$ } from "@/utils/stateManager";
import CalendarDatePicker from "@/components/CalendarDatePicker";

const pickerDate$ = observable<Moment>(selectedDate$.get());

const withOpacity = (hex: string, opacity: number) => {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

type ThemeTokens = ReturnType<typeof themeTokens$.get>;

const CalendarDateSheet = observer(() => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { height } = Dimensions.get("window");
  const translateY = useSharedValue(height);
  const { palette, colors, isDark } = themeTokens$.get();
  const blurEnabled = styling$.tabBarBlurEnabled.get();
  const overlayColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.35)";
  const accentSoft = withOpacity(colors.accent, 0.14);
  const accentBorder = withOpacity(colors.accent, 0.28);
  const styles = createStyles({ palette, colors, accentSoft, accentBorder });

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

  const handleJumpToday = useCallback(() => {
    const today = moment(getNow()).startOf("day");
    pickerDate$.set(today);
    selectedDate$.set(today);
    closeSheet();
  }, [closeSheet]);

  return (
    <View style={styles.overlay}>
      {blurEnabled ? (
        <BlurView
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
                <CalendarDatePicker
                  date={date}
                  onChange={(next) => {
                    pickerDate$.set(next);
                  }}
                />
              </View>
            );
          }}
        </Memo>
        
        <TouchableOpacity style={styles.todayButton} onPress={handleJumpToday}>
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => {
            selectedDate$.set(pickerDate$.get());
            closeSheet();
          }}
        >
          <Text style={styles.confirmText}>Select Date</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

export default CalendarDateSheet;

const createStyles = ({
  palette,
  colors,
  accentSoft,
  accentBorder,
}: {
  palette: ThemeTokens["palette"];
  colors: ThemeTokens["colors"];
  accentSoft: string;
  accentBorder: string;
}) =>
  StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  background: {
    flex: 1,
    backgroundColor: "transparent",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: palette.base,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    shadowColor: "#000",
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
    alignSelf: "center",
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.text,
    marginBottom: 0,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  pickerWrapper: {
    alignSelf: "center",
    backgroundColor: palette.base,
  },
  confirmButton: {
    marginTop: 12,
    backgroundColor: palette.text,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmText: {
    color: palette.base,
    fontWeight: "700",
    fontSize: 16,
  },
  todayButton: {
    marginTop: 12,
    // backgroundColor: palette.text,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: accentSoft,
    borderWidth: 1,
    borderColor: accentBorder,
  },
  todayButtonText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: "700",
  },
});
