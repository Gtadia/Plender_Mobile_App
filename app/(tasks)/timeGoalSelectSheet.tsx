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

import { Dimensions, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect } from 'react'
import { useNavigation, useRouter } from 'expo-router'
import { task$ } from './create'
import { Memo } from '@legendapp/state/react';
import { observable } from '@legendapp/state';
import { PlatformBlurView } from "@/components/PlatformBlurView";
import { settings$, styling$, themeTokens$, timeGoalEdit$, tasks$ } from '@/utils/stateManager';
import { getListTheme } from '@/constants/listTheme';
import ToastOverlay from "@/components/animation-toast/ToastOverlay";
import { createListSheetStyles } from '@/constants/listStyles';
import { updateEvent } from '@/utils/database';
import { AntDesign } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Picker as WheelPicker } from 'react-native-wheel-pick';

type PickerOption = { label: string; value: string };

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
const minutes: PickerOption[] = Array.from({ length: 60 }, (_, index) => {
  const value = `${index}`;
  return { value, label: value.padStart(2, "0") };
});

const hours: PickerOption[] = Array.from({ length: 24 }, (_, index) => {
  const value = `${index}`;
  return { value, label: value };
});

const clampInt = (value: string, min: number, max: number) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
};

// -------------------------------------------------------------
// Main component
// -------------------------------------------------------------
const TimeGoalSelectSheet = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const { width, height } = Dimensions.get("window");
  const translateY = useSharedValue(height);
  const { palette, colors, isDark } = themeTokens$.get();
  const useButtonTint = settings$.personalization.buttonTintEnabled.get();
  const accentButtonIcon = useButtonTint ? colors.textStrong : isDark ? palette.crust : palette.base;
  const listTheme = getListTheme(palette, isDark);
  const sheetStyles = createListSheetStyles(listTheme);
  const blurEnabled = styling$.tabBarBlurEnabled.get();
  const overlayColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.35)";
  const containerBackground = listTheme.colors.row;
  const cardBackground = listTheme.colors.card;
  const borderColor = listTheme.colors.divider;
  const textColor = colors.text;
  const mutedText = colors.subtext0;
  const pickerTextColor = isDark ? colors.text : colors.textStrong;
  const pickerLine = isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.18)";
  const editingId = timeGoalEdit$.taskId.get();
  const isEditing = editingId !== null && editingId !== undefined;
  const [timePickerVisible, setTimePickerVisible] = React.useState(false);
  const [draftHours, setDraftHours] = React.useState("1");
  const [draftMinutes, setDraftMinutes] = React.useState("0");

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

  const openTimePicker = () => {
    setDraftHours(`${time$.hours.get()}`);
    setDraftMinutes(`${time$.minutes.get()}`);
    setTimePickerVisible(true);
  };

  const closeTimePicker = () => {
    setTimePickerVisible(false);
  };

  const applyTimePicker = () => {
    time$.hours.set(clampInt(draftHours, 0, 23));
    time$.minutes.set(clampInt(draftMinutes, 0, 59));
    closeTimePicker();
  };

  return (
    <View style={sheetStyles.overlay}>
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
            onPress={() => {
              if (isEditing) {
                timeGoalEdit$.taskId.set(null);
              }
              closeSheet();
            }}
          >
            <AntDesign name="close" size={22} color={textColor} />
          </TouchableOpacity>
          <Text style={[sheetStyles.title, { color: textColor }]}>Select Goal</Text>
          <TouchableOpacity
            style={[
              sheetStyles.headerIconButton,
              { backgroundColor: colors.accent, borderColor: colors.accent },
            ]}
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
            <AntDesign name="check" size={22} color={accentButtonIcon} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View>
          <View style={styles.center}>
            <View style={{ width: Math.min(400, width), paddingHorizontal: 0, alignSelf: 'center' }}>
              <Memo>
                {() => {
                  const hourString = time$.hours.get() > 1 ? "hours" : "hour";
                  const minuteString = time$.minutes.get() > 1 ? "minutes" : "minute";

                  const goalString =
                    `${time$.hours.get() < 1 ? '' : `${time$.hours.get()} ${hourString}`} ` +
                    `${time$.minutes.get() < 1 ? '' : `${time$.minutes.get()} ${minuteString}`}`;
                  const goalText = goalString.trim() || "No goal";

                  return (
                    <>
                      {/* Card: label + current selection */}
                      <View
                        style={[
                          sheetStyles.subMenuSquare,
                          sheetStyles.subMenuSquarePadding,
                          { backgroundColor: cardBackground, borderColor, borderWidth: 1 },
                        ]}
                      >
                        <View style={sheetStyles.subMenuBar}>
                          <Text style={[sheetStyles.menuText, { color: textColor }]}>Time Goal</Text>
                          <Text style={[sheetStyles.menuTextEnd, { color: mutedText }]}>{goalText}</Text>
                        </View>
                        <TouchableOpacity style={styles.timePickerButton} onPress={openTimePicker}>
                          <Text style={[styles.timePickerButtonText, { color: textColor }]}>
                            Select Time
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )
                }}
              </Memo>
            </View>
          </View>
        </View>

      </Animated.View>

      <Modal
        transparent
        visible={timePickerVisible}
        animationType="fade"
        onRequestClose={closeTimePicker}
      >
        <View style={[styles.pickerOverlay, { backgroundColor: overlayColor }]}>
          {blurEnabled ? (
            <PlatformBlurView
              tint={isDark ? "dark" : "light"}
              intensity={40}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          ) : null}
          <Pressable style={StyleSheet.absoluteFill} onPress={closeTimePicker} />
          <View style={[styles.pickerCard, { backgroundColor: containerBackground, borderColor }]}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity
                style={[
                  sheetStyles.headerIconButton,
                  { backgroundColor: listTheme.colors.card, borderColor },
                ]}
                onPress={closeTimePicker}
              >
                <AntDesign name="close" size={20} color={textColor} />
              </TouchableOpacity>
              <Text style={[styles.pickerTitle, { color: textColor }]}>Select Time Goal</Text>
              <TouchableOpacity
                style={[
                  sheetStyles.headerIconButton,
                  { backgroundColor: colors.accent, borderColor: colors.accent },
                ]}
                onPress={applyTimePicker}
              >
                <AntDesign name="check" size={20} color={accentButtonIcon} />
              </TouchableOpacity>
            </View>
            <View style={styles.pickerRow}>
              <WheelPicker
                isShowSelectLine={true}
                isShowSelectBackground={false}
                selectLineColor={pickerLine}
                selectLineSize={1}
                style={[styles.picker, { backgroundColor: cardBackground }]}
                itemStyle={[styles.pickerItem, { color: pickerTextColor }]}
                textColor={pickerTextColor}
                selectTextColor={textColor}
                selectedValue={draftHours}
                pickerData={hours}
                onValueChange={(value: string | number) => setDraftHours(String(value))}
              />
              <WheelPicker
                isShowSelectLine={true}
                isShowSelectBackground={false}
                selectLineColor={pickerLine}
                selectLineSize={1}
                style={[styles.picker, { backgroundColor: cardBackground }]}
                itemStyle={[styles.pickerItem, { color: pickerTextColor }]}
                textColor={pickerTextColor}
                selectTextColor={textColor}
                selectedValue={draftMinutes}
                pickerData={minutes}
                onValueChange={(value: string | number) => setDraftMinutes(String(value))}
              />
            </View>
          </View>
        </View>
      </Modal>
      <ToastOverlay />
    </View>
  )
}

export default TimeGoalSelectSheet

// -------------------------------------------------------------
// Styles
// -------------------------------------------------------------
const styles = StyleSheet.create({
  center: { alignItems: "center" },
  timePickerButton: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  timePickerButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 16,
  },
  pickerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -8 },
    elevation: 8,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  pickerRow: {
    flexDirection: "row",
    borderRadius: 16,
    overflow: "hidden",
  },
  picker: {
    width: "50%",
    height: 228,
  },
  pickerItem: {
    fontSize: 24,
  },
});
