import { StyleSheet, View} from 'react-native';
import { Text, ScreenView } from '@/components/Themed';
import React from 'react';
import AnimationToast from '@/components/animation-toast/animation-toast';

export default function SettingsScreen() {
  return (
    <ScreenView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <AnimationToast />
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
