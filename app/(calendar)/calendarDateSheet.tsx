import React, { useCallback, useEffect } from "react";
import { Dimensions, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import { useNavigation } from "expo-router";
import DateTimePicker, { useDefaultStyles } from "react-native-ui-datepicker";
import moment, { Moment } from "moment";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Memo, observer } from "@legendapp/state/react";
import { observable } from "@legendapp/state";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useFocusEffect } from "@react-navigation/native";
import { Text } from "@/components/Themed";
import { selectedDate$ } from "@/app/index/calendar/rowCalendar";
import { getNow } from "@/utils/timeOverride";
import { themeTokens$ } from "@/utils/stateManager";

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
    <View style={[styles.overlay, { backgroundColor: overlayColor }]}>
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
                    header: {
                      paddingHorizontal: 8,
                      paddingVertical: 6,
                      justifyContent: "space-between",
                      alignItems: "center",
                    },
                    month_selector: {
                      backgroundColor: palette.surface1,
                      borderColor: palette.surface2,
                      borderWidth: 1,
                      borderTopLeftRadius: 999,
                      borderBottomLeftRadius: 999,
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      marginRight: 0,
                    },
                    month_selector_label: {
                      color: palette.text,
                      fontWeight: "800",
                      fontSize: 16,
                    },
                    year_selector: {
                      backgroundColor: palette.surface1,
                      borderColor: palette.surface2,
                      borderWidth: 1,
                      borderLeftWidth: 0,
                      borderTopRightRadius: 999,
                      borderBottomRightRadius: 999,
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      marginLeft: -1,
                    },
                    year_selector_label: {
                      color: palette.text,
                      fontWeight: "800",
                      fontSize: 16,
                    },
                    button_prev: {
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: withOpacity(colors.accent, 0.16),
                      borderColor: withOpacity(colors.accent, 0.3),
                      borderWidth: 1,
                      alignItems: "center",
                      justifyContent: "center",
                    },
                    button_next: {
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: withOpacity(colors.accent, 0.16),
                      borderColor: withOpacity(colors.accent, 0.3),
                      borderWidth: 1,
                      alignItems: "center",
                      justifyContent: "center",
                    },
                    button_prev_image: { tintColor: colors.accent },
                    button_next_image: { tintColor: colors.accent },
                    weekdays: { marginBottom: 4 },
                    weekday_label: {
                      fontWeight: "700",
                      color: palette.subtext1,
                      fontSize: 12,
                    },
                    day: { borderRadius: 12 },
                    day_label: { fontWeight: "600", color: palette.text },
                    outside_label: { color: palette.surface2 },
                    disabled_label: { color: palette.surface2 },
                    today: {
                      borderColor: colors.accent,
                      borderRadius: 12,
                      borderWidth: 1,
                      backgroundColor: "transparent",
                    },
                    today_label: { color: colors.accent, fontWeight: "700" },
                    selected: { backgroundColor: colors.accent, borderRadius: 12 },
                    selected_label: { color: palette.base, fontWeight: "700" },
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
