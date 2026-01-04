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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect } from "react";
import { useNavigation } from "expo-router";
import moment from "moment";
import { AntDesign } from "@expo/vector-icons";
import { task$ } from "./create";
import { RRule } from "rrule";
import { Memo, Show } from "@legendapp/state/react";
import { observable } from "@legendapp/state";
import { Picker } from "react-native-wheel-pick";
import RNDateTimePicker from "@react-native-community/datetimepicker";
import { DateTime } from "luxon";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { themeTokens$ } from "@/utils/stateManager";

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
  const { height } = Dimensions.get("window");
  const translateY = useSharedValue(height);
  const isDark = themeTokens$.isDark.get();
  const overlayColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.35)";

  // Default: repeat on current day of the week
  repeat$.weeks[moment().day()].set(true);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 260 });
  }, [translateY]);

  const closeSheet = () => {
    translateY.value = withTiming(height, { duration: 220 }, (finished) => {
      if (finished) {
        runOnJS(() => navigation.goBack())();
      }
    });
  };

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: overlayColor }}>
      {/* Click outside to dismiss */}
      <Pressable onPress={closeSheet} style={styles.background} />

      <Animated.View
        style={[styles.container, { height: (height * 6) / 8, minHeight: 500 }, sheetStyle]}
      >
        {/* Header: Back / Title / Done */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.button}
            onPress={closeSheet}
          >
            <Text>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Select Date</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              AddRrule();
              closeSheet();
            }}
          >
            <Text>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Content Scroll */}
        <ScrollView>
          <View style={{ alignItems: "center" }}>
            <View style={{ maxWidth: 400, alignSelf: "center" }}>
              {/* Start Date Picker */}
              <View style={styles.subMenuSquare}>
                <View
                  style={[
                    styles.subMenuBar,
                    styles.subMenuSquarePadding,
                    { alignItems: "center" },
                  ]}
                >
                  <Text style={styles.menuText}>Start Date</Text>
                  {/* dayjs(date).startOf('day') uses startOf in order to keep up with local time zone and not get stuck on UTC */}
                  <RNDateTimePicker
                    mode="date"
                    display="compact"
                    // design="material"
                    value={repeat$.startsOn.get().toDate()}
                    onChange={(e, date) => {
                      repeat$.startsOn.set(moment(date));
                    }}
                  />
                </View>
              </View>

              {/* Repeat Section */}
              <View style={[styles.subMenu, { marginTop: 10 }]}>
                <View style={{ flexDirection: "row" }}>
                  <AntDesign
                    name="retweet"
                    size={20}
                    color={"rgba(0, 0, 0, 0.75)"}
                  />
                  <Text style={[styles.menuText, styles.subMenuText]}>
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
                          styles.subMenuSquare,
                          styles.subMenuSquarePadding,
                        ]}
                      >
                        <View style={styles.subMenuBar}>
                          <Text style={styles.menuText}>Every</Text>
                          <Text style={styles.menuTextEnd}>{repeatValue}</Text>
                        </View>
                        <View style={{ flexDirection: "row" }}>
                          {/* Number Picker */}
                          <Picker
                            style={styles.picker}
                            itemStyle={styles.pickerItem}
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
                          {/* Type Picker */}
                          <Picker
                            isShowSelectLine={false}
                            selectLineColor="black"
                            selectLineSize={6}
                            style={styles.picker}
                            itemStyle={styles.pickerItem}
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
                        </View>
                      </View>

                      {/* Weekly Day Toggles */}
                      <Show if={repeat$.isWeeks} else={() => <></>}>
                        {() => (
                          <>
                            <Text>ON</Text>
                            <View
                              style={[
                                styles.subMenuSquare,
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
                                        ? "rgba(200, 0, 0, 0.75)"
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
                                  <Text>{d}</Text>
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
                            <Text>ENDS</Text>
                            <View style={styles.subMenuSquare}>
                              {/* Never option */}
                              <TouchableOpacity
                                style={[
                                  styles.subMenuBar,
                                  styles.subMenuSquarePadding,
                                ]}
                                onPress={() => repeat$.endsOnMode.set(false)}
                              >
                                <Text style={styles.menuText}>Never</Text>
                                <Memo>
                                  {() =>
                                    !repeat$.endsOnMode.get() && (
                                      <AntDesign
                                        name="check"
                                        size={18}
                                        color="rgba(200, 0, 0, 0.75)"
                                      />
                                    )
                                  }
                                </Memo>
                              </TouchableOpacity>

                              {/* On Date option */}
                              <TouchableOpacity
                                style={[
                                  styles.subMenuBar,
                                  styles.subMenuSquarePadding,
                                  { alignItems: "center" },
                                ]}
                                onPress={() => repeat$.endsOnMode.set(true)}
                              >
                                <Text style={styles.menuText}>On Date</Text>
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
                                    <RNDateTimePicker
                                      mode="date"
                                      display="compact"
                                      // design="material"
                                      value={repeat$.endsOn.get().toDate()}
                                      onChange={(e, date) =>
                                        repeat$.endsOn.set(
                                          moment(date)
                                        )
                                      }
                                    />
                                  </Show>
                                  <Memo>
                                    {() =>
                                      repeat$.endsOnMode.get() && (
                                        <AntDesign
                                          name="check"
                                          size={18}
                                          color="rgba(200, 0, 0, 0.75)"
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
    </View>
  );
};

export default DateSelectSheet;

// -------------------------------------------------------------
// Styles
// -------------------------------------------------------------
const styles = StyleSheet.create({
  background: { backgroundColor: "transparent", flex: 1 },
  title: { fontWeight: "500", fontSize: 15 },
  container: { backgroundColor: "#F2F2F7", padding: 15, alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
  },
  button: {},
  subMenu: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 10,
    marginTop: 10,
  },
  subMenuText: { paddingLeft: 10 },
  subMenuSquare: {
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 10,
  },
  subMenuSquarePadding: {
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  subMenuBar: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  menuText: { fontWeight: "500", fontSize: 16 },
  menuTextEnd: {
    fontWeight: "300",
    fontSize: 16,
    color: "rgba(0, 0, 0, 0.75)",
  },
  picker: { backgroundColor: "white", width: "50%", height: 215 },
  pickerItem: { fontSize: 18 },
  weekDayButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
});
