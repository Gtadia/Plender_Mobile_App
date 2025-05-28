import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { View } from 'react-native';

// import { useColorScheme } from '@/components/useColorScheme';
// import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { colorTheme$ } from '@/utils/stateManager';
import TabBar from '@/components/TabBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  // const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();


  return (
    <>
      <Tabs
        tabBar={props => <TabBar {...props} />}
        screenOptions={({ route }) => ({
          headerShown: false,
        })}>
      </Tabs>

      <View style={{
        position: 'absolute',
        bottom: insets.bottom + 60 + 5, // 60 is the height of the tab bar, 5 is the margin
        right: 18,
        alignSelf: 'center',
        zIndex: 2,
        backgroundColor: colorTheme$.colors.primary.get(),
        width: 60,
        height: 60,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
      }}>
        <AntDesign name="plus" size={26} color="white" />
      </View>
    </>
  );
}
