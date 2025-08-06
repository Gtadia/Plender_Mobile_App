import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, ScreenView } from '@/components/Themed';
import { horizontalPadding } from '@/constants/globalThemeVar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function TabOneScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScreenView style={styles.container}>
      <View style={[styles.titleContainer, { paddingTop: insets.top }]}>
        <Text style={[styles.title]}>Home</Text>
      </View>
      <ScrollView>

  {/* Current Task Progress */}
  {/* marginTop: 15  */}
  {/* Padding near bottom so users can scroll past UI components */}

        <View
          style={{
            height: 800,
            backgroundColor: "black",
          }}
        >

        </View>
      </ScrollView>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  titleContainer: {
    width: '100%',
  },
  title: {
    left: horizontalPadding,
    color: '#000',
    fontSize: 28,
    marginLeft: 0,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
