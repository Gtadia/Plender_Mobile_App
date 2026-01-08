import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import React from 'react';
import { Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { observer } from '@legendapp/state/react';
import { PlatformBlurView } from '@/components/PlatformBlurView';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { settings$, styling$, themeTokens$ } from '@/utils/stateManager';
import { FontAwesome6 } from '@expo/vector-icons';

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
  const visibleRoutes = state.routes.filter((route) => {
    if (['_sitemap', '+not-found'].includes(route.name)) return false;
    if (route.name === 'testPanel') return false;
    if (route.name === 'support' && !settings$.general.showSupportPage.get()) return false;
    const options = descriptors[route.key]?.options as { href?: string | null } | undefined;
    if (options?.href === null) return false;
    return true;
  });
  const tabWidth = itemWidth * visibleRoutes.length;
  const computedIndex = visibleRoutes.findIndex(
    (route) => route.key === state.routes[state.index]?.key
  );
  const activeIndex =
    computedIndex === -1
      ? Math.max(0, Math.min(state.index, visibleRoutes.length - 1))
      : computedIndex;

  const blurEnabled = styling$.tabBarBlurEnabled.get();
  const { colors, palette, isDark } = themeTokens$.get();
  const primaryColor = colors.accent;
  const textColor = colors.text;
  const surface = colors.surface1;
  const baseBackdrop = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)";
  const barBackground = blurEnabled ? baseBackdrop : withOpacity(surface, isDark ? 0.9 : 0.96);
  const barBorder = withOpacity(palette.overlay0, isDark ? 0.35 : 0.2);
  const highlightBase = isDark ? palette.text : palette.base;
  const shadowBase = isDark ? palette.crust : palette.overlay1;
  const highlightCorner = withOpacity(highlightBase, isDark ? 0.28 : 0.45);
  const highlightFade = withOpacity(highlightBase, isDark ? 0.12 : 0.2);
  const shadowCorner = withOpacity(shadowBase, isDark ? 0.5 : 0.3);
  const shadowFade = withOpacity(shadowBase, isDark ? 0.22 : 0.14);
  const tlCorner = isDark ? highlightCorner : shadowCorner;
  const tlFade = isDark ? highlightFade : shadowFade;
  const trCorner = isDark ? shadowCorner : highlightCorner;
  const trFade = isDark ? shadowFade : highlightFade;
  const blCorner = isDark ? shadowCorner : highlightCorner;
  const blFade = isDark ? shadowFade : highlightFade;
  const brCorner = isDark ? highlightCorner : shadowCorner;
  const brFade = isDark ? highlightFade : shadowFade;
  const baseStroke = 0.9;
  const glowStroke = 1.2;
  const borderInset = glowStroke / 2;
  const borderWidth = Math.max(0, tabWidth - borderInset * 2);
  const borderHeight = Math.max(0, barHeight - borderInset * 2);
  const cornerRadius = barHeight / 2 - borderInset;
  const glowRadius = cornerRadius * 1.35;

  const icons = {
    index: (props: any) => <FontAwesome6 name="house" size={itemSize} {...props} />,
    calendar: (props: any) => <FontAwesome6 name="calendar" size={itemSize} {...props} />,
    dayProgress: (props: any) => <FontAwesome6 name="chart-pie" size={itemSize} {...props} />,
    support: (props: any) => <FontAwesome6 name="mug-hot" size={itemSize} {...props} />,
    test: (props: any) => <FontAwesome6 name="chart-line" size={itemSize} {...props} />,
    test2: (props: any) => <FontAwesome6 name="chart-line" size={itemSize} {...props} />,
    settings: (props: any) => <FontAwesome6 name="gear" size={itemSize} {...props} />,
  };

  const labelMap: Record<string, string> = {
    index: 'Home',
    calendar: 'Calendar',
    dayProgress: 'Progress',
    support: 'Support',
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
          bottom: insets.bottom + 6,
          left: (windowWidth - tabWidth) / 2,
          width: tabWidth,
          borderColor: surface,
        },
      ]}
    >
      {blurEnabled ? (
        <PlatformBlurView tint={isDark ? "dark" : "light"} intensity={35} style={StyleSheet.absoluteFill} />
      ) : null}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: barBackground }]} />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.activePill,
          indicatorStyle,
          { backgroundColor: withOpacity(primaryColor, 0.2) },
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
    borderWidth: 1,
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
    borderWidth: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 13,
  },
});

export default TabBar
