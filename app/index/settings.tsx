import { StyleSheet, View, Button, Alert } from 'react-native';
import { Text, ScreenView } from '@/components/Themed';
import React, { useCallback } from 'react';
import AnimationToast from '@/components/animation-toast/animation-toast';
import moment from 'moment';
import { clearEvents, createEvent } from '@/utils/database';
import { loadDay, tasks$ } from '@/utils/stateManager';
import { clearActiveTimerState } from '@/utils/activeTimerStore';
import { dirtyTasks$ } from '@/utils/dirtyTaskStore';

export default function SettingsScreen() {
  const refreshToday = useCallback(async () => {
    await loadDay(new Date());
  }, []);

  const singleDayRule = useCallback((date: Date) => {
    const dtstart = moment(date).utc().format('YYYYMMDD[T]HHmmss[Z]');
    return `DTSTART=${dtstart};FREQ=DAILY;COUNT=1`;
  }, []);

  const handleClearDb = useCallback(async () => {
    await clearEvents();
    clearActiveTimerState();
    dirtyTasks$.set({});
    await refreshToday();
    Alert.alert('Database cleared');
  }, [refreshToday]);

  const handleCreateCustom = useCallback(async () => {
    const start = moment().startOf('day').toDate();
    await createEvent({
      title: 'Focus Block',
      rrule: singleDayRule(start),
      timeGoal: 2 * 60 * 60,
      timeSpent: 0,
      category: 0,
      description: 'Custom two hour focus session',
    });
    await refreshToday();
    Alert.alert('Custom event added');
  }, [refreshToday, singleDayRule]);

  const handleCreateRandomToday = useCallback(async () => {
    const randomHour = Math.floor(Math.random() * 12);
    const randomDurationMinutes = 30 + Math.floor(Math.random() * 120);
    const start = moment().startOf('day').add(randomHour, 'hours').toDate();
    await createEvent({
      title: `Random Task ${randomHour + 1}`,
      rrule: singleDayRule(start),
      timeGoal: randomDurationMinutes * 60,
      timeSpent: 0,
      category: (randomHour % 5),
      description: 'Auto-generated test event',
    });
    await refreshToday();
    Alert.alert('Random event created for today');
  }, [refreshToday, singleDayRule]);

  const handleClearCache = useCallback(() => {
    tasks$.entities.set({});
    tasks$.lists.byDate.set({});
    Alert.alert('tasks$ cache cleared');
  }, []);

  return (
    <ScreenView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <AnimationToast />
      <View style={styles.devPanel}>
        <Text style={styles.panelTitle}>Debug Tasks</Text>
        <View style={styles.panelButton}>
          <Button title="Clear Database" onPress={handleClearDb} />
        </View>
        <View style={styles.panelButton}>
          <Button title="Create Custom Event" onPress={handleCreateCustom} />
        </View>
        <View style={styles.panelButton}>
          <Button title="Random Event (Today)" onPress={handleCreateRandomToday} />
        </View>
        <View style={styles.panelButton}>
          <Button title="Clear Tasks Cache" onPress={handleClearCache} />
        </View>
      </View>
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
  devPanel: {
    marginTop: 30,
    width: '90%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f1f1f5',
    gap: 12,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  panelButton: {
    width: '100%',
  },
});
