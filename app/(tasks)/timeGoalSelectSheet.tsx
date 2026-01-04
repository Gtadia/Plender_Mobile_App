// -------------------------------------------------------------
// TimeGoalSelectSheet
// -------------------------------------------------------------
// Purpose:
//   Modal sheet to select a time goal (hours/minutes) for a task.
//
// Key points:
//   - Uses Legend observable `time$` to hold hours & minutes
//   - On "Done", persists total seconds to `task$.timeGoal`
//   - Custom `Picker` component used for hours/minutes
//
// Notes:
//   - No functional changes; only formatting, comments, and style cleanup
//   - Dynamic layout (height) remains inline where required
// -------------------------------------------------------------

import { Dimensions, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect } from 'react'
import { useNavigation, useRouter } from 'expo-router'
import { task$ } from './create'
import { Memo } from '@legendapp/state/react';
import { observable } from '@legendapp/state';
import { BlurView } from 'expo-blur';
import { styling$, themeTokens$, timeGoalEdit$, tasks$ } from '@/utils/stateManager';
import { getListTheme } from '@/constants/listTheme';
import { createListSheetStyles } from '@/constants/listStyles';
import { updateEvent } from '@/utils/database';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
// import Picker from '@/components/TimeCarousel/Picker';
// import { Picker } from 'react-native-wheel-pick';
import Picker from '@/components/TimeCarousel/Picker';

const withOpacity = (hex: string, opacity: number) => {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// -------------------------------------------------------------
// Observable: time selection state (hours/minutes)
// -------------------------------------------------------------
export const time$ = observable({
  hours: 1,
  minutes: 0,
});

// -------------------------------------------------------------
// UI constants (kept for readability and reuse)
// -------------------------------------------------------------
const ITEM_HEIGHT = 34;
const VISIBLE_ITEMS = 5;
const pickerPadding = 70

// TODO — move this somewhere so that it only renders ONCE!!!
const minutes = new Array(60).fill(0).map((_, index) => (index));
const hours = new Array(24).fill(0).map((_, index) => (index));

// -------------------------------------------------------------
// Main component
// -------------------------------------------------------------
const TimeGoalSelectSheet = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const { width, height } = Dimensions.get("window");
  const translateY = useSharedValue(height);
  const { palette, colors, isDark } = themeTokens$.get();
  const listTheme = getListTheme(palette, isDark);
  const sheetStyles = createListSheetStyles(listTheme);
  const blurEnabled = styling$.tabBarBlurEnabled.get();
  const overlayColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.35)";
  const containerBackground = listTheme.colors.card;
  const cardBackground = listTheme.colors.row;
  const borderColor = listTheme.colors.divider;
  const textColor = colors.text;
  const mutedText = colors.subtext0;
  const pickerTextStyle = { primaryColor: colors.text, secondaryColor: colors.subtext1 };
  const pickerPill = withOpacity(palette.overlay0, isDark ? 0.4 : 0.2);
  const editingId = timeGoalEdit$.taskId.get();
  const isEditing = editingId !== null && editingId !== undefined;

  useEffect(() => {
    const goalSeconds = isEditing
      ? tasks$.entities[editingId!]?.timeGoal?.get?.() ?? 0
      : task$.timeGoal.get() ?? 0;
    time$.hours.set(Math.floor(goalSeconds / 3600));
    time$.minutes.set(Math.floor((goalSeconds % 3600) / 60));
  }, [editingId]);

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
        console.warn("Failed to close time goal sheet", err);
        closingRef.current = false;
      }
    }, 230);
  };

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={sheetStyles.overlay}>
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
      {/* Tap outside to dismiss */}
      <Pressable
        onPress={() => {
          if (isEditing) {
            timeGoalEdit$.taskId.set(null);
          }
          closeSheet();
        }}
        style={sheetStyles.background}
      />

      {/* Sheet container (dynamic height preserved) */}
      <Animated.View
        style={[
          sheetStyles.container,
          { height: height * 6 / 8, minHeight: 500, backgroundColor: containerBackground },
          sheetStyle,
        ]}
      >
        {/* Header: Back / Title / Done */}
        <View style={sheetStyles.header}>
          <TouchableOpacity
            style={sheetStyles.button}
            onPress={() => {
              if (isEditing) {
                timeGoalEdit$.taskId.set(null);
              }
              closeSheet();
            }}
          >
            <Text style={{ color: textColor }}>Back</Text>
          </TouchableOpacity>
          <Text style={[sheetStyles.title, { color: textColor }]}>Select Goal</Text>
          <TouchableOpacity
            style={sheetStyles.button}
            onPress={async () => {
              const totalSeconds = time$.hours.get() * 3600 + time$.minutes.get() * 60;
              try {
                if (isEditing) {
                  const id = editingId!;
                  const node = tasks$.entities[id];
                  if (node) {
                    node.timeGoal.set(totalSeconds);
                    await updateEvent({ id, timeGoal: totalSeconds });
                  } else {
                    task$.timeGoal.set(totalSeconds);
                  }
                  timeGoalEdit$.taskId.set(null);
                } else {
                  task$.timeGoal.set(totalSeconds);
                }
                console.log("The time has been sent: ", time$.hours.get(), time$.minutes.get(), totalSeconds);
                closeSheet();
              } catch (err) {
                console.warn("Failed to apply time goal", err);
                timeGoalEdit$.taskId.set(null);
              }
            }}
          >
            <Text style={{ color: textColor }}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View>
          <View style={styles.center}>
            {/* Keep the dynamic maxWidth expression as-is */}
            <View style={{ maxWidth: 400 | width, paddingHorizontal: 0, alignSelf: 'center' }}>
              <Memo>
                {() => {
                  // TODO — Gray out DONE button if time is set to 0!!!!
                  const hourString = time$.hours.get() > 1 ? "hours" : "hour"
                  const minuteString = time$.minutes.get() > 1 ? "minutes" : "minute"

                  const goalString =
                    `${time$.hours.get() < 1 ? '' : `${time$.hours.get()} ${hourString}`} ` +
                    `${time$.minutes.get() < 1 ? '' : `${time$.minutes.get()} ${minuteString}`}`

                  return (
                    <>
                      {/* Card: label + current selection + pickers */}
                        <View
                        style={[
                          sheetStyles.subMenuSquare,
                          sheetStyles.subMenuSquarePadding,
                          { backgroundColor: cardBackground, borderColor, borderWidth: 1 },
                        ]}
                      >
                        <View style={sheetStyles.subMenuBar}>
                          <Text style={[sheetStyles.menuText, { color: textColor }]}>Time Goal</Text>
                          <Text style={[sheetStyles.menuTextEnd, { color: mutedText }]}>{goalString}</Text>
                        </View>

                        <View style={styles.max380}>
                          <View
                            style={styles.pickerRow}
                          >
                            {/* Hours picker */}
                            <Picker
                              values={hours}
                              legendState={time$.hours}
                              defaultValue={time$.hours}
                              unit="hours"
                              enableSelectBox={true}
                              ITEM_HEIGHT={34}
                              VISIBLE_ITEMS={5}
                              textStyle={pickerTextStyle}
                              pillColor={pickerPill}
                            />
                            {/* Minutes picker */}
                            <Picker
                              values={minutes}
                              legendState={time$.minutes}
                              defaultValue={time$.minutes}
                              unit="min"
                              enableSelectBox={true}
                              ITEM_HEIGHT={34}
                              VISIBLE_ITEMS={5}
                              textStyle={pickerTextStyle}
                              pillColor={pickerPill}
                            />
                            {/* <View style={styles.pill} /> */}
                          </View>
                        </View>
                      </View>
                    </>
                  )
                }}
              </Memo>
            </View>
          </View>
        </View>

      </Animated.View>
    </View>
  )
}

export default TimeGoalSelectSheet

// -------------------------------------------------------------
// Styles
// -------------------------------------------------------------
const styles = StyleSheet.create({
  center: { alignItems: "center" },
  max380: { maxWidth: 380 },
  pickerRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    paddingVertical: 14,
    paddingHorizontal: pickerPadding,
  },
  pill: {
    position: "absolute",
    right: pickerPadding,
    height: ITEM_HEIGHT,
    width: "100%",
    backgroundColor: "transparent",
    borderRadius: 12,
    zIndex: 20,
    elevation: 20,
    pointerEvents: "none",
  },
});
