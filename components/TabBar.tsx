import { View, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import { Dimensions } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLinkBuilder, useTheme } from '@react-navigation/native';
import { Text, PlatformPressable } from '@react-navigation/elements';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colorTheme$ } from '@/utils/stateManager';
import { AntDesign } from '@expo/vector-icons';


const itemPadding = 40; // 20 * 2
const itemSize = 24; // icon size

const TabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  const primaryColor = colorTheme$.colors.primary.get();
  const textColor = colorTheme$.nativeTheme.colors.text.get();

  const icons = {
    index: (props: any) => <AntDesign name="home" size={itemSize} color={textColor} {...props} />,
    calendar: (props: any) => <AntDesign name="calendar" size={itemSize} color={textColor} {...props} />,
    stats: (props: any) => <AntDesign name="barchart" size={itemSize} color={textColor} {...props} />,
    pieChart: (props: any) => <AntDesign name="piechart" size={itemSize} color={textColor} {...props} />,
    test: (props: any) => <AntDesign name="linechart" size={itemSize} color={textColor} {...props} />,
    settings: (props: any) => <AntDesign name="setting" size={itemSize} color={textColor} {...props} />,
  }

  const windowWidth = Dimensions.get('window').width;
  const visibleRoutes = state.routes.filter((r) => !['_sitemap', '+not-found'].includes(r.name));
  const tabWidth = (itemPadding + itemSize) * visibleRoutes.length;

  return (
    <View style={[styles.tabBar, { bottom: insets.bottom, left: (windowWidth - tabWidth) / 2 }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : (options.title !== undefined
              ? options.title
              : route.name);

        if (['_sitemap', '+not-found'].includes(route.name)) return null;

        const isFocused = state.index === index;

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
            {(icons[route.name] ?? icons.index)({ color: isFocused ? primaryColor : textColor })}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: colorTheme$.nativeTheme.colors.card.get(),

    // paddingVertical: 12,
    borderRadius: 30,
    height: 60,
  },
  tabBarItem: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: itemPadding / 2,
  }
});

export default TabBar
