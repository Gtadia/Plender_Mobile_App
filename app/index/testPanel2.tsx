import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Carousel, { type ICarouselInstance } from "react-native-reanimated-carousel";
import {
  addDays,
  addWeeks,
  differenceInCalendarDays,
  format,
  isSameDay,
  isToday,
  startOfWeek,
} from "date-fns";
import { ScreenView, Text } from "@/components/Themed";
import { settings$, themeTokens$ } from "@/utils/stateManager";

const PANES = 5;
const CENTER_INDEX = Math.floor(PANES / 2);
const DAY_SPACING = 6;
const SIDE_PADDING = 16;
const DAY_HEIGHT = 44;

const getCircularOffset = (index: number, activeIndex: number, count: number) => {
  const diff = index - activeIndex;
  const wrapped = diff > 0 ? diff - count : diff + count;
  return Math.abs(wrapped) < Math.abs(diff) ? wrapped : diff;
};

export default function TestPanel2Screen() {
  const { colors, palette } = themeTokens$.get();
  const startWeekOn = settings$.general.startWeekOn.get();
  const weekStartsOn = startWeekOn === "Monday" ? 1 : 0;
  const { width } = useWindowDimensions();
  const carouselRef = useRef<ICarouselInstance>(null);
  const selectedOffsetRef = useRef(0);

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [activeIndex, setActiveIndex] = useState(CENTER_INDEX);
  const [anchorWeekStart, setAnchorWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn }),
  );

  const paneIndices = useMemo(
    () => Array.from({ length: PANES }, (_, index) => index),
    [],
  );

  const weekHeader = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn });
    return Array.from({ length: 7 }, (_, index) =>
      format(addDays(start, index), "EEE"),
    );
  }, [weekStartsOn]);

  useEffect(() => {
    selectedOffsetRef.current = differenceInCalendarDays(selectedDate, anchorWeekStart);
  }, [anchorWeekStart, selectedDate]);

  const handleSnap = useCallback(
    (index: number) => {
      if (index === activeIndex) return;
      const direction = getCircularOffset(index, activeIndex, PANES);
      const nextWeekStart = addWeeks(anchorWeekStart, direction);
      setActiveIndex(index);
      setAnchorWeekStart(nextWeekStart);
      setSelectedDate(addDays(nextWeekStart, selectedOffsetRef.current));
    },
    [activeIndex, anchorWeekStart],
  );

  const renderWeekPane = useCallback(
    ({ item: index }: { item: number }) => {
      const offset = getCircularOffset(index, activeIndex, PANES);
      const weekStart = addWeeks(anchorWeekStart, offset);
      const days = Array.from({ length: 7 }, (_, dayIndex) =>
        addDays(weekStart, dayIndex),
      );

      return (
        <View style={[styles.weekPane, { width }]}>
          <View style={styles.weekRow}>
            {days.map((day, dayIndex) => {
              const selected = isSameDay(day, selectedDate);
              const today = isToday(day);
              return (
                <Pressable
                  key={day.toISOString()}
                  onPress={() => {
                    setSelectedDate(day);
                    setAnchorWeekStart(startOfWeek(day, { weekStartsOn }));
                  }}
                  style={[
                    styles.dayCell,
                    dayIndex > 0 && { marginLeft: DAY_SPACING },
                    selected && { backgroundColor: colors.accent },
                    !selected && today && { borderColor: colors.accent, borderWidth: 1 },
                  ]}
                >
                  <Text
                    style={{
                      color: selected ? palette.base : colors.text,
                      fontWeight: selected ? "700" : "600",
                    }}
                  >
                    {format(day, "d")}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      );
    },
    [activeIndex, anchorWeekStart, colors.accent, colors.text, palette.base, selectedDate, weekStartsOn, width],
  );

  return (
    <ScreenView radius={0} style={[styles.container, { backgroundColor: palette.base }]}
    >
      <Text style={styles.title}>Week Carousel Debug</Text>
      <Text style={[styles.subtitle, { color: colors.subtext1 }]}>Selected: {format(selectedDate, "yyyy-MM-dd")}</Text>
      <View style={styles.headerRow}>
        {weekHeader.map((label, index) => (
          <View
            key={`${label}-${index}`}
            style={[styles.headerCell, index > 0 && { marginLeft: DAY_SPACING }]}
          >
            <Text style={{ color: colors.subtext1, fontWeight: "600" }}>{label}</Text>
          </View>
        ))}
      </View>
      <Carousel
        ref={carouselRef}
        width={width}
        height={DAY_HEIGHT}
        data={paneIndices}
        defaultIndex={CENTER_INDEX}
        renderItem={renderWeekPane}
        onSnapToItem={handleSnap}
        loop={Platform.OS === "android"}
        autoFillData={false}
        scrollAnimationDuration={260}
        panGestureHandlerProps={{ activeOffsetX: [-10, 10] }}
      />
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    paddingHorizontal: SIDE_PADDING,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: SIDE_PADDING,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    paddingHorizontal: SIDE_PADDING,
    marginBottom: 8,
  },
  headerCell: {
    flex: 1,
    alignItems: "center",
  },
  weekPane: {
    paddingHorizontal: SIDE_PADDING,
  },
  weekRow: {
    flexDirection: "row",
  },
  dayCell: {
    flex: 1,
    height: DAY_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
});
