import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs, useRouter } from 'expo-router';
import { TouchableOpacity, View, StyleSheet, Keyboard } from 'react-native';

// import { useColorScheme } from '@/components/useColorScheme';
// import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { FontAwesome6 } from '@expo/vector-icons';
import { settings$, themeTokens$ } from '@/utils/stateManager';
import TabBar from '@/components/TabBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { observer } from '@legendapp/state/react';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default observer(function TabLayout() {
  // const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, palette, isDark } = themeTokens$.get();
  const accent = colors.accent;
  const useButtonTint = settings$.personalization.buttonTintEnabled.get();
  const plusColor = useButtonTint ? colors.textStrong : isDark ? palette.crust : palette.base;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={props => <TabBar {...props} />}
        screenOptions={({ route }) => ({
          headerShown: false,
        })}>
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="calendar" options={{ title: "Week Calendar" }} />
        <Tabs.Screen name="dayProgress" options={{ title: "Day Progress" }} />
        <Tabs.Screen name="testPanel" options={{ href: null }} />
        <Tabs.Screen name="scrollTest" options={{ title: "Scroll Test" }} />
        <Tabs.Screen name="scrollProbe" options={{ title: "Scroll Probe" }} />
        <Tabs.Screen name="recenterTest" options={{ title: "Recenter Test" }} />
        <Tabs.Screen
          name="support"
          options={{
            title: "Support",
            href: settings$.general.showSupportPage.get() ? undefined : null,
          }}
        />
        <Tabs.Screen name="settings" options={{ title: "Settings" }} />
      </Tabs>

      <TouchableOpacity
        style={[styles.touchable, { bottom: insets.bottom + 60 + 12, backgroundColor: accent }]}
        onPress={() => {
          router.push("/create");
        }}
      >
        <FontAwesome6 name="plus" size={24} color={plusColor} />
      </TouchableOpacity>
    </View>
  );
})

const styles = StyleSheet.create({
  touchable: {
    position: 'absolute',
        right: 18,
        alignSelf: 'center',
        zIndex: 2,
        width: 60,
        height: 60,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
  }
})
