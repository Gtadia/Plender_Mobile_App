import React, { useEffect } from 'react';
import { View, Text, Pressable, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { $TextInput } from '@legendapp/state/react-native';
import { PlatformBlurView } from "@/components/PlatformBlurView";
import { settings$, styling$, themeTokens$ } from '@/utils/stateManager';
import { getListTheme } from '@/constants/listTheme';
import { createListSheetStyles } from '@/constants/listStyles';
import ToastOverlay from "@/components/animation-toast/ToastOverlay";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AntDesign } from "@expo/vector-icons";

export default function TaskEditView() {
  const navigation = useNavigation();
  const router = useRouter();
  const { height } = Dimensions.get("window");
  const translateY = useSharedValue(height);
  const { palette, colors, isDark } = themeTokens$.get();
  const useButtonTint = settings$.personalization.buttonTintEnabled.get();
  const accentButtonIcon = useButtonTint ? colors.textStrong : isDark ? palette.crust : palette.base;
  const listTheme = getListTheme(palette, isDark);
  const sheetStyles = createListSheetStyles(listTheme);
  const blurEnabled = styling$.tabBarBlurEnabled.get();
  const overlayColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.35)";
  const containerBackground = listTheme.colors.row;
  const rowBackground = listTheme.colors.card;
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
      <Pressable onPress={closeSheet} style={sheetStyles.background} />
      <Animated.View
        style={[
          sheetStyles.container,
          { height: height * 0.7, minHeight: 460, backgroundColor: containerBackground },
          sheetStyle,
        ]}
      >
        <View style={sheetStyles.header}>
          <TouchableOpacity
            style={[
              sheetStyles.headerIconButton,
              { backgroundColor: listTheme.colors.card, borderColor: dividerColor },
            ]}
            onPress={closeSheet}
          >
            <AntDesign name="close" size={22} color={textColor} />
          </TouchableOpacity>
          <Text style={[sheetStyles.title, { color: textColor }]}>Task Details</Text>
          <TouchableOpacity
            style={[
              sheetStyles.headerIconButton,
              { backgroundColor: colors.accent, borderColor: colors.accent },
            ]}
            onPress={() => {
              // close
              closeSheet();
            }}
          >
            <AntDesign name="check" size={22} color={accentButtonIcon} />
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
      <ToastOverlay />
    </View>
  );
}
