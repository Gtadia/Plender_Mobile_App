// -------------------------------------------------------------
// DateSelectSheet
// -------------------------------------------------------------
// Purpose:
//   Modal sheet for selecting a task's start date, repeat frequency,
//   optional weekly recurrence days, and an end condition.
//
// Key points:
//   - Uses `repeat$` observable to manage all recurrence data
//   - Builds and sets an `RRule` into the global `task$` when "Done" is pressed
//   - Picker (react-native-wheel-pick) for number & frequency
//   - Weekly toggle UI if frequency = 'Week'
//   - End date selection (Never or specific date)
//
// Notes:
//   - No functional changes, only cleaned structure and added comments
//   - Inline styles centralized into StyleSheet when possible
// -------------------------------------------------------------

import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useNavigation, useRouter } from "expo-router";
import moment, { Moment } from "moment";
import { AntDesign } from "@expo/vector-icons";
import { task$ } from "./create";
import { RRule } from "rrule";
import { Memo, Show } from "@legendapp/state/react";
import { observable } from "@legendapp/state";
import { useFocusEffect } from "@react-navigation/native";
import { Picker as WheelPicker } from "react-native-wheel-pick";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { getListTheme } from "@/constants/listTheme";
import { createListSheetStyles } from "@/constants/listStyles";
import { styling$, themeTokens$ } from "@/utils/stateManager";
import CalendarDatePicker from "@/components/CalendarDatePicker";
import { getNow } from "@/utils/timeOverride";
import Picker from "@/components/TimeCarousel/Picker";
import { ScrollView } from "react-native-gesture-handler";

// -------------------------------------------------------------
// Observable state for repeat settings
// -------------------------------------------------------------
const repeat$ = observable({
  isRepeat: false,
  num: "",
  type: "None", // Options: None, Day, Week, Month, Year
  weeks: [false, false, false, false, false, false, false],
  isWeeks: false, // true if weekly recurrence enabled
  endsOn: moment().add(1, "day"), // end date if endsOnMode=true
  endsOnMode: false, // false = Never, true = Ends On
  startsOn: moment(), // start date

  hours: 1, // not currently used here
  minutes: 0, // not currently used here
});

// -------------------------------------------------------------
// Static constants
// -------------------------------------------------------------
const values: string[] = [""]; // first entry blank = no repeat
for (let i = 1; i < 999; i++) values.push(`${i}`);

const types: string[] = ["None", "Day", "Week", "Month", "Year"];

const dayOfWeek = ["S", "M", "T", "W", "T", "F", "S"];
const dayOfWeekRrule = [
  RRule.SU,
  RRule.MO,
  RRule.TU,
  RRule.WE,
  RRule.TH,
  RRule.FR,
  RRule.SA,
];

const withOpacity = (hex: string, opacity: number) => {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// -------------------------------------------------------------
// Build & set RRule into task$
// -------------------------------------------------------------
const AddRrule = () => {
  const dtstart = repeat$.startsOn
    .peek()
    .hour(12)
    .minute(0)
    .second(0)
    .millisecond(0)
    .toDate(); // moment syntax is same here

  const base: Partial<RRule.Options> = {
    dtstart,
    freq:
      repeat$.type.peek() === "Day"
        ? RRule.DAILY
        : repeat$.type.peek() === "Week"
        ? RRule.WEEKLY
        : repeat$.type.peek() === "Month"
        ? RRule.MONTHLY
        : RRule.YEARLY,
    interval: repeat$.isRepeat.peek()
      ? parseInt(repeat$.num.peek() || "1", 10)
      : 1,
    // wkst: RRule.MO, // optional
  };

  // Only add byweekday for weekly rules:
  if (base.freq === RRule.WEEKLY) {
    const days = dayOfWeekRrule.filter((_, i) => repeat$.weeks[i].peek());
    (base as RRule.Options).byweekday = days.length
      ? days
      : [dayOfWeekRrule[moment(dtstart).day()]];
  }

  // Only add 'until' if "Ends On" is chosen:
  if (repeat$.isRepeat.peek() && repeat$.endsOnMode.peek()) {
    (base as RRule.Options).until = repeat$.endsOn.peek().endOf("day").toDate();
  }

  const rule =
    !repeat$.isRepeat.peek() || repeat$.type.peek() === "None"
      ? new RRule({ dtstart, freq: RRule.DAILY, interval: 1, until: dtstart }) // single occurrence
      : new RRule(base as RRule.Options);

  task$.rrule.set(rule);

  // console.log("The Completed RRule, ", rrule.toText());
  console.log("isRepeat ", repeat$.isRepeat.get());
};

// -------------------------------------------------------------
// Main Component
// -------------------------------------------------------------
const DateSelectSheet = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const { height } = Dimensions.get("window");
  const translateY = useSharedValue(height);
  const { palette, colors, isDark } = themeTokens$.get();
  const listTheme = getListTheme(palette, isDark);
  const sheetStyles = createListSheetStyles(listTheme);
  const blurEnabled = styling$.tabBarBlurEnabled.get();
  const blurMethod = Platform.OS === "android" ? "dimezisBlurView" : undefined;
  const overlayColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.35)";
  const containerBackground = listTheme.colors.row;
  const cardBackground = listTheme.colors.card;
  const borderColor = listTheme.colors.divider;
  const textColor = colors.text;
  const headerTextColor = colors.textStrong;
  const mutedText = colors.subtext0;
  const pickerLine = withOpacity(colors.text, isDark ? 0.4 : 0.32);
  const pickerTextColor = isDark ? colors.text : colors.textStrong;
  const pickerTextStyle = {
    primaryColor: pickerTextColor,
    secondaryColor: mutedText,
    fontSize: 20,
  };
  const pickerPill = withOpacity(palette.overlay0, isDark ? 0.4 : 0.2);
  const cardStyle = { backgroundColor: cardBackground, borderColor, borderWidth: 1 };
  const [calendarMode, setCalendarMode] = useState<"start" | "end" | null>(null);
  const [calendarDraft, setCalendarDraft] = useState<Moment | null>(null);
  const formatDate = (date: Moment) => date.format("MMM D, YYYY");
  const minSelectableDate = moment(getNow()).startOf("day").toDate();

  useFocusEffect(
    React.useCallback(() => {
      const now = moment(getNow()).startOf("day");
      const existing = task$.rrule.get();
      const start = existing?.options?.dtstart ? moment(existing.options.dtstart) : now;
      repeat$.startsOn.set(start);

      if (!existing) {
        repeat$.isRepeat.set(false);
        repeat$.type.set("None");
        repeat$.num.set("");
        repeat$.isWeeks.set(false);
        const weeks = [false, false, false, false, false, false, false];
        weeks[start.day()] = true;
        repeat$.weeks.set(weeks);
        repeat$.endsOnMode.set(false);
        repeat$.endsOn.set(start.clone().add(1, "day"));
      }
    }, [])
  );

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 260 });
  }, [translateY]);

  const closingRef = React.useRef(false);

  const closeSheet = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    translateY.value = withTiming(height, { duration: 220 });
    setTimeout(() => {
      try {
        if (typeof (router as any).canGoBack === "function") {
          if ((router as any).canGoBack()) {
            router.back();
            return;
          }
        }
        (navigation as any).goBack?.();
      } catch (err) {
        console.warn("Failed to close date sheet", err);
        closingRef.current = false;
      }
    }, 230);
  };

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const openCalendar = (mode: "start" | "end") => {
    const date = mode === "start" ? repeat$.startsOn.get() : repeat$.endsOn.get();
    setCalendarDraft(date.clone());
    setCalendarMode(mode);
  };

  const closeCalendar = () => {
    setCalendarMode(null);
    setCalendarDraft(null);
  };

  const applyCalendar = () => {
    if (!calendarDraft || !calendarMode) {
      closeCalendar();
      return;
    }
    if (calendarMode === "start") {
      repeat$.startsOn.set(calendarDraft.clone());
    } else {
      repeat$.endsOn.set(calendarDraft.clone());
    }
    closeCalendar();
  };

  return (
    <View style={sheetStyles.overlay}>
      {blurEnabled ? (
        <BlurView
          tint={isDark ? "dark" : "light"}
          intensity={40}
          experimentalBlurMethod={blurMethod}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]}
      />
      {/* Click outside to dismiss */}
      <Pressable onPress={closeSheet} style={sheetStyles.background} />

      <Animated.View
        style={[
          sheetStyles.container,
          { height: height * 0.7, minHeight: 460, backgroundColor: containerBackground },
          sheetStyle,
        ]}
      >
        {/* Header: Back / Title / Done */}
        <View style={sheetStyles.header}>
          <TouchableOpacity
            style={[
              sheetStyles.headerIconButton,
              { backgroundColor: listTheme.colors.card, borderColor },
            ]}
            onPress={closeSheet}
          >
            <AntDesign name="close" size={22} color={headerTextColor} />
          </TouchableOpacity>
          <Text style={[sheetStyles.title, { color: headerTextColor }]}>Select Date</Text>
          <TouchableOpacity
            style={[
              sheetStyles.headerIconButton,
              { backgroundColor: colors.accent, borderColor: colors.accent },
            ]}
            onPress={() => {
              try {
                AddRrule();
                closeSheet();
              } catch (err) {
                console.warn("Failed to apply date rule", err);
              }
            }}
          >
            <AntDesign name="check" size={22} color={colors.textStrong} />
          </TouchableOpacity>
        </View>

        {/* Content Scroll */}
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: "center" }}>
            <View style={{ maxWidth: 400, alignSelf: "center" }}>
              {/* Start Date Picker */}
              <View style={[sheetStyles.subMenuSquare, cardStyle]}>
                <View
                  style={[
                    sheetStyles.subMenuBar,
                    sheetStyles.subMenuSquarePadding,
                    { alignItems: "center" },
                  ]}
                >
                  <Text style={[sheetStyles.menuText, { color: textColor }]}>Start Date</Text>
                  <Pressable
                    style={[
                      styles.datePill,
                      { backgroundColor: listTheme.colors.card, borderColor },
                    ]}
                    onPress={() => openCalendar("start")}
                  >
                    <Text style={[styles.datePillText, { color: textColor }]}>
                      {formatDate(repeat$.startsOn.get())}
                    </Text>
                    <AntDesign name="calendar" size={16} color={mutedText} />
                  </Pressable>
                </View>
              </View>

              {/* Repeat Section */}
              <View style={sheetStyles.subMenu}>
                <View style={{ flexDirection: "row" }}>
                  <AntDesign
                    name="retweet"
                    size={20}
                    color={mutedText}
                  />
                  <Text style={[sheetStyles.menuText, sheetStyles.subMenuText, { color: textColor }]}>
                    Repeat
                  </Text>
                </View>
              </View>

              {/* Repeat Picker UI */}
              <Memo>
                {() => {
                  const repeatValue =
                    repeat$.type.get() === "None"
                      ? "None"
                      : `${repeat$.num.get()} ${repeat$.type.get()}${
                          Number(repeat$.num.get()) > 1 ? "s" : ""
                        }`;

                  return (
                    <>
                      {/* Number + Type Pickers */}
                      <View
                        style={[
                          sheetStyles.subMenuSquare,
                          sheetStyles.subMenuSquarePadding,
                          cardStyle,
                        ]}
                      >
                        <View style={sheetStyles.subMenuBar}>
                          <Text style={[sheetStyles.menuText, { color: textColor }]}>Every</Text>
                          <Text style={[sheetStyles.menuTextEnd, { color: mutedText }]}>{repeatValue}</Text>
                        </View>
                        <View style={{ flexDirection: "row" }}>
                          {/* Number Picker */}
                          {Platform.OS === "android" ? (
                            <Picker
                              values={values}
                              legendState={repeat$.num}
                              defaultValue={repeat$.num}
                              ITEM_HEIGHT={34}
                              VISIBLE_ITEMS={5}
                              textStyle={pickerTextStyle}
                              pillColor={pickerPill}
                              enableSelectBox={true}
                              onValueChange={(value) => {
                                const next = String(value);
                                repeat$.isRepeat.set(true);
                                if (next === "") {
                                  repeat$.isRepeat.set(false);
                                  repeat$.type.set("None");
                                  repeat$.num.set("");
                                } else if (repeat$.type.get() === "None") {
                                  repeat$.type.set("Day");
                                  repeat$.num.set(next);
                                } else {
                                  repeat$.num.set(next);
                                }
                              }}
                            />
                          ) : (
                            <WheelPicker
                              style={[styles.picker, { backgroundColor: cardBackground }]}
                              itemStyle={[styles.pickerItem, { color: pickerTextColor }]}
                              textColor={pickerTextColor}
                              selectedValue={repeat$.num.get()}
                              pickerData={values}
                            onValueChange={(value: string) => {
                              repeat$.isRepeat.set(true);
                              if (value === "") {
                                repeat$.isRepeat.set(false);
                                repeat$.type.set("None");
                                repeat$.num.set("");
                              } else if (repeat$.type.get() === "None") {
                                repeat$.type.set("Day");
                                repeat$.num.set(value);
                              } else {
                                repeat$.num.set(value);
                              }
                            }}
                            />
                          )}
                          {/* Type Picker */}
                          {Platform.OS === "android" ? (
                            <Picker
                              values={types}
                              legendState={repeat$.type}
                              defaultValue={repeat$.type}
                              ITEM_HEIGHT={34}
                              VISIBLE_ITEMS={5}
                              textStyle={pickerTextStyle}
                              pillColor={pickerPill}
                              enableSelectBox={true}
                              onValueChange={(value) => {
                                const next = String(value);
                                repeat$.type.set(next);
                                repeat$.isRepeat.set(true);
                                if (next === "None") {
                                  repeat$.num.set("");
                                  repeat$.isRepeat.set(false);
                                } else if (repeat$.num.get() === "") {
                                  repeat$.num.set("1");
                                }
                                repeat$.isWeeks.set(next === "Week");
                              }}
                            />
                          ) : (
                            <WheelPicker
                              isShowSelectLine={false}
                              selectLineColor={pickerLine}
                              selectLineSize={6}
                              style={[styles.picker, { backgroundColor: cardBackground }]}
                              itemStyle={[styles.pickerItem, { color: pickerTextColor }]}
                              textColor={pickerTextColor}
                              selectedValue={repeat$.type.get()}
                              pickerData={types}
                              onValueChange={(value: string) => {
                                repeat$.type.set(value);
                                repeat$.isRepeat.set(true);
                                if (value === "None") {
                                  repeat$.num.set("");
                                  repeat$.isRepeat.set(false);
                                } else if (repeat$.num.get() === "") {
                                  repeat$.num.set("1");
                                }
                                repeat$.isWeeks.set(value === "Week");
                              }}
                            />
                          )}
                        </View>
                      </View>

                      {/* Weekly Day Toggles */}
                      <Show if={repeat$.isWeeks} else={() => <></>}>
                        {() => (
                          <>
                            <Text style={{ color: mutedText }}>ON</Text>
                            <View
                              style={[
                                sheetStyles.subMenuSquare,
                                cardStyle,
                                { flexDirection: "row", overflow: "hidden" },
                              ]}
                            >
                              {dayOfWeek.map((d, i) => (
                                <TouchableOpacity
                                  key={i}
                                  style={[
                                    styles.weekDayButton,
                                    {
                                      backgroundColor: repeat$.weeks[i].get()
                                        ? colors.accent
                                        : "transparent",
                                    },
                                  ]}
                                  onPress={() => {
                                    if (
                                      repeat$.weeks.get().filter((x) => x)
                                        .length > 1 ||
                                      !repeat$.weeks[i].get()
                                    ) {
                                      repeat$.weeks[i].set((prev) => !prev);
                                    }
                                  }}
                                >
                                  <Text style={{ color: repeat$.weeks[i].get() ? colors.textStrong : mutedText }}>
                                    {d}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </>
                        )}
                      </Show>

                      {/* Ends Section */}
                      <Show if={repeat$.isRepeat} else={() => <></>}>
                        {() => (
                          <>
                            <Text style={{ color: mutedText }}>ENDS</Text>
                            <View style={[sheetStyles.subMenuSquare, cardStyle]}>
                              {/* Never option */}
                              <TouchableOpacity
                                style={[
                                  sheetStyles.subMenuBar,
                                  sheetStyles.subMenuSquarePadding,
                                ]}
                                onPress={() => repeat$.endsOnMode.set(false)}
                              >
                                <Text style={[sheetStyles.menuText, { color: textColor }]}>Never</Text>
                                <Memo>
                                  {() =>
                                    !repeat$.endsOnMode.get() && (
                                      <AntDesign
                                        name="check"
                                        size={18}
                                        color={colors.accent}
                                      />
                                    )
                                  }
                                </Memo>
                              </TouchableOpacity>

                              {/* On Date option */}
                              <TouchableOpacity
                                style={[
                                  sheetStyles.subMenuBar,
                                  sheetStyles.subMenuSquarePadding,
                                  { alignItems: "center" },
                                ]}
                                onPress={() => {
                                  repeat$.endsOnMode.set(true);
                                  openCalendar("end");
                                }}
                              >
                                <Text style={[sheetStyles.menuText, { color: textColor }]}>On Date</Text>
                                <View
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                  }}
                                >
                                  <Show
                                    if={repeat$.endsOnMode}
                                    else={() => <></>}
                                  >
                                    <Pressable
                                      style={[
                                        styles.datePill,
                                        { backgroundColor: listTheme.colors.card, borderColor },
                                      ]}
                                      onPress={() => openCalendar("end")}
                                    >
                                      <Text style={[styles.datePillText, { color: textColor }]}>
                                        {formatDate(repeat$.endsOn.get())}
                                      </Text>
                                      <AntDesign name="calendar" size={16} color={mutedText} />
                                    </Pressable>
                                  </Show>
                                  <Memo>
                                    {() =>
                                      repeat$.endsOnMode.get() && (
                                        <AntDesign
                                          name="check"
                                          size={18}
                                          color={colors.accent}
                                        />
                                      )
                                    }
                                  </Memo>
                                </View>
                              </TouchableOpacity>
                            </View>
                          </>
                        )}
                      </Show>
                    </>
                  );
                }}
              </Memo>
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      <Modal
        transparent
        visible={calendarMode !== null}
        animationType="fade"
        onRequestClose={closeCalendar}
      >
        <View style={[styles.calendarOverlay, { backgroundColor: overlayColor }]}>
          {blurEnabled ? (
            <BlurView
              tint={isDark ? "dark" : "light"}
              intensity={40}
              experimentalBlurMethod={blurMethod}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          ) : null}
          <Pressable style={StyleSheet.absoluteFill} onPress={closeCalendar} />
          <View style={[styles.calendarCard, { backgroundColor: containerBackground, borderColor }]}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                style={[
                  sheetStyles.headerIconButton,
                  { backgroundColor: listTheme.colors.card, borderColor },
                ]}
                onPress={closeCalendar}
              >
                <AntDesign name="close" size={20} color={headerTextColor} />
              </TouchableOpacity>
              <Text style={[styles.calendarTitle, { color: headerTextColor }]}>
                {calendarMode === "start" ? "Start Date" : "End Date"}
              </Text>
              <TouchableOpacity
                style={[
                  sheetStyles.headerIconButton,
                  { backgroundColor: colors.accent, borderColor: colors.accent },
                ]}
                onPress={applyCalendar}
              >
                <AntDesign name="check" size={20} color={colors.textStrong} />
              </TouchableOpacity>
            </View>
            {calendarDraft ? (
              <CalendarDatePicker
                date={calendarDraft}
                onChange={setCalendarDraft}
                minDate={
                  calendarMode === "end"
                    ? repeat$.startsOn.get().startOf("day").toDate()
                    : minSelectableDate
                }
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DateSelectSheet;

// -------------------------------------------------------------
// Styles
// -------------------------------------------------------------
const styles = StyleSheet.create({
  picker: { width: "50%", height: 215 },
  pickerItem: { fontSize: 20 },
  weekDayButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  datePillText: {
    fontWeight: "600",
    fontSize: 16,
  },
  calendarOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 16,
  },
  calendarCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -8 },
    elevation: 8,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
});
