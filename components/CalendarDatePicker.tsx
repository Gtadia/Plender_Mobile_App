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

type ThemeTokens = ReturnType<typeof themeTokens$.get>;

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
    const { palette, colors } = themeTokens$.get();

    return (
      <View style={{ alignSelf: "center", backgroundColor: palette.base }}>
        <DateTimePicker
          mode="single"
          date={date}
          minDate={minDate}
          onChange={(event) => {
            if (!event.date) return;
            onChange(moment(event.date));
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
  }
);

export default CalendarDatePicker;
