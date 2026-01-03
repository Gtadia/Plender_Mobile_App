import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import React from 'react';
import { Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { observer } from '@legendapp/state/react';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { colorTheme$, styling$ } from '@/utils/stateManager';
import { AntDesign } from '@expo/vector-icons';

const itemSize = 20;
const itemWidth = 66;
const barHeight = 60;

const withOpacity = (hex: string, opacity: number) => {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const TabBar = observer(({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const windowWidth = Dimensions.get('window').width;
  const visibleRoutes = state.routes.filter((r) => !['_sitemap', '+not-found'].includes(r.name));
  const tabWidth = itemWidth * visibleRoutes.length;
  const computedIndex = visibleRoutes.findIndex(
    (route) => route.key === state.routes[state.index]?.key
  );
  const activeIndex =
    computedIndex === -1
      ? Math.max(0, Math.min(state.index, visibleRoutes.length - 1))
      : computedIndex;

  const blurEnabled = styling$.tabBarBlurEnabled.get();
  const primaryColor = colorTheme$.colors.accent.get();
  const textColor = colorTheme$.colors.text.get();
  const surface = colorTheme$.colors.surface1.get();
  const isDark = colorTheme$.nativeTheme.dark.get();
  const baseBackdrop = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)";
  const barBackground = blurEnabled ? baseBackdrop : withOpacity(surface, isDark ? 0.9 : 0.96);
  const barBorder = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)";

  const icons = {
    index: (props: any) => <AntDesign name="home" size={itemSize} {...props} />,
    calendar: (props: any) => <AntDesign name="calendar" size={itemSize} {...props} />,
    dayProgress: (props: any) => <AntDesign name="piechart" size={itemSize} {...props} />,
    testPanel: (props: any) => <AntDesign name="tool" size={itemSize} {...props} />,
    test: (props: any) => <AntDesign name="linechart" size={itemSize} {...props} />,
    test2: (props: any) => <AntDesign name="linechart" size={itemSize} {...props} />,
    settings: (props: any) => <AntDesign name="setting" size={itemSize} {...props} />,
  };

  const labelMap: Record<string, string> = {
    index: 'Home',
    calendar: 'Calendar',
    dayProgress: 'Progress',
    testPanel: 'Test',
    settings: 'Settings',
  };

  const indicatorStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: withTiming(activeIndex * itemWidth, { duration: 180 }) }],
    }),
    [activeIndex]
  );

  return (
    <View
      style={[
        styles.tabBar,
        {
          bottom: insets.bottom,
          left: (windowWidth - tabWidth) / 2,
          width: tabWidth,
        },
      ]}
    >
      {blurEnabled ? (
        <BlurView tint="light" intensity={35} style={StyleSheet.absoluteFill} />
      ) : null}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: barBackground }]} />
      <Svg
        pointerEvents="none"
        width={tabWidth}
        height={barHeight}
        style={StyleSheet.absoluteFill}
        viewBox={`0 0 ${tabWidth} ${barHeight}`}
      >
        <Defs>
          <LinearGradient id="tabBorder" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={barBorder} />
            <Stop offset="0.52" stopColor={isDark ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.6)"} />
            <Stop offset="0.91" stopColor={barBorder} />
            <Stop offset="1" stopColor={isDark ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.45)"} />
          </LinearGradient>
        </Defs>
        <Rect
          x="0.5"
          y="0.5"
          width={Math.max(0, tabWidth - 1)}
          height={Math.max(0, barHeight - 1)}
          rx={barHeight / 2}
          ry={barHeight / 2}
          fill="transparent"
          stroke="url(#tabBorder)"
          strokeWidth={1}
        />
      </Svg>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.activePill,
          indicatorStyle,
          { backgroundColor: withOpacity(primaryColor, 0.2), borderColor: withOpacity(primaryColor, 0.65) },
        ]}
      />
      {visibleRoutes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = activeIndex === index;
        const displayLabel = labelMap[route.name] ?? route.name;
        const iconColor = isFocused ? primaryColor : textColor;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabBarItem}
          >
            {(icons[route.name] ?? icons.index)({ color: iconColor })}
            <Text style={[styles.tabLabel, { color: isFocused ? primaryColor : textColor }]} numberOfLines={1}>
              {displayLabel}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    // borderWidth: 1,
    borderRadius: 999,
    height: barHeight,
    paddingHorizontal: 6,
    overflow: 'hidden',
  },
  tabBarItem: {
    justifyContent: 'center',
    alignItems: 'center',
    width: itemWidth,
    height: barHeight - 8,
    gap: 2,
  },
  activePill: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: itemWidth,
    height: barHeight,
    borderRadius: 999,
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 13,
  },
});

export default TabBar
