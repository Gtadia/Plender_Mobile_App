import React from "react";
import { View } from "react-native";
import DateTimePicker, { useDefaultStyles } from "react-native-ui-datepicker";
import moment, { Moment } from "moment";
import { observer } from "@legendapp/state/react";
import { themeTokens$ } from "@/utils/stateManager";

const withOpacity = (hex: string, opacity: number) => {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const CalendarDatePicker = observer(
  ({
    date,
    onChange,
    minDate,
  }: {
    date: Moment;
    onChange: (next: Moment) => void;
    minDate?: Date;
  }) => {
    const { palette, colors, isDark } = themeTokens$.get();
    const defaultStyles = useDefaultStyles(isDark ? "dark" : "light");

    return (
      <View style={{ alignSelf: "center", backgroundColor: palette.base }}>
        <DateTimePicker
          mode="single"
          date={date}
          minDate={minDate}
          monthsFormat="short"
          monthCaptionFormat="short"
          onChange={(event) => {
            if (!event.date) return;
            onChange(moment(event.date));
          }}
          styles={{
            ...defaultStyles,
            header: {
              paddingHorizontal: 8,
              paddingVertical: 6,
              justifyContent: "space-between",
              alignItems: "center",
            },
            month_selector: {
              backgroundColor: "transparent",
              borderWidth: 0,
              borderRadius: 0,
              paddingHorizontal: 2,
              paddingVertical: 4,
              marginRight: 2,
              minWidth: 52,
              justifyContent: "center",
              alignItems: "flex-end",
            },
            month_selector_label: {
              color: palette.text,
              fontWeight: "700",
              fontSize: 16,
            },
            year_selector: {
              backgroundColor: "transparent",
              borderWidth: 0,
              borderRadius: 0,
              paddingHorizontal: 2,
              paddingVertical: 4,
              marginLeft: 2,
              minWidth: 44,
              justifyContent: "center",
              alignItems: "flex-start",
            },
            year_selector_label: {
              color: palette.text,
              fontWeight: "700",
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
  }
);

export default CalendarDatePicker;
