import React, { useEffect } from 'react';
import { View, Text, Pressable, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { $TextInput } from '@legendapp/state/react-native';
import { BlurView } from 'expo-blur';
import { styling$, themeTokens$ } from '@/utils/stateManager';
import { getListTheme } from '@/constants/listTheme';
import { createListSheetStyles } from '@/constants/listStyles';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export default function TaskEditView() {
  const navigation = useNavigation();
  const router = useRouter();
  const { height } = Dimensions.get("window");
  const translateY = useSharedValue(height);
  const { palette, colors, isDark } = themeTokens$.get();
  const listTheme = getListTheme(palette, isDark);
  const sheetStyles = createListSheetStyles(listTheme);
  const blurEnabled = styling$.tabBarBlurEnabled.get();
  const overlayColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.35)";
  const containerBackground = listTheme.colors.card;
  const rowBackground = listTheme.colors.row;
  const dividerColor = listTheme.colors.divider;
  const textColor = colors.text;
  const subtextColor = colors.subtext0;
  const cardStyle = { backgroundColor: rowBackground, borderColor: dividerColor, borderWidth: 1 };

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
        console.warn("Failed to close task edit sheet", err);
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
      <Pressable onPress={closeSheet} style={sheetStyles.background} />
      <Animated.View
        style={[
          sheetStyles.container,
          { height: height * 6 / 8, minHeight: 500, backgroundColor: containerBackground },
          sheetStyle,
        ]}
      >
        <View style={sheetStyles.header}>
          <TouchableOpacity style={sheetStyles.button} onPress={closeSheet}>
            <Text style={{ color: textColor }}>Back</Text>
          </TouchableOpacity>
          <Text style={[sheetStyles.title, { color: textColor }]}>Task Details</Text>
          <TouchableOpacity
            style={sheetStyles.button}
            onPress={() => {
              // close
              closeSheet();
            }}
          >
            <Text style={{ color: textColor }}>Done</Text>
          </TouchableOpacity>
        </View>


        <View style={{ maxWidth: 400, paddingHorizontal: 0, alignSelf: 'center', }}>
          {/* TEXT */}
          <View style={[sheetStyles.subMenuSquare, sheetStyles.subMenuSquarePadding, cardStyle]}>
            <View style={[sheetStyles.subMenuBar, { alignItems: 'center' }]}>
              <Text style={[sheetStyles.menuText, { color: textColor }]}>Name</Text>
            </View>
            <View style={{ paddingVertical: 15}}>
               <$TextInput
                $value={"Hello"}
                style={[sheetStyles.textInput, { color: textColor }]}
                autoFocus={true}
                multiline
                placeholder={"Category Name"}
                placeholderTextColor={subtextColor}
              />
            </View>
          </View>
          {/* TEXT */}

        </View>
      </Animated.View>
    </View>
  );
}
