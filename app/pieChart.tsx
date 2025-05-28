import { StyleSheet } from 'react-native';
import { Text, ScreenView } from '@/components/Themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// TODO — Left and Right padding ==> 20
const horizontalPadding = 20;

export default function PieChartScreen() {
  const insets = useSafeAreaInsets();


  return (
    <ScreenView style={styles.container}>
      <Text style={[styles.title, { top: insets.top }]}>Pie Chart</Text>


    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    position: 'absolute',
    left: horizontalPadding,
    color: '#000',
    fontSize: 28,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
