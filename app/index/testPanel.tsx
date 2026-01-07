import { StyleSheet, View, Button, Alert, ScrollView, SafeAreaView } from "react-native";
import { Text, ScreenView } from "@/components/Themed";
import React, { useCallback, useState } from "react";
import moment from "moment";
import { clearEvents, createEvent } from "@/utils/database";
import { loadDay, tasks$ } from "@/utils/stateManager";
import { clearActiveTimerState } from "@/utils/activeTimerStore";
import { dirtyTasks$ } from "@/utils/dirtyTaskStore";
import { clearFakeNow, setFakeNow, fakeNow$ } from "@/utils/timeOverride";
import DateTimePicker, { useDefaultStyles } from "react-native-ui-datepicker";
import AnimationToast from "@/components/animation-toast/animation-toast";

export default function TestPanelScreen() {
  const refreshToday = useCallback(async () => {
    await loadDay(new Date());
  }, []);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(new Date());

  const singleDayRule = useCallback((date: Date) => {
    const dtstart = moment(date).utc().format("YYYYMMDD[T]HHmmss[Z]");
    return `DTSTART=${dtstart};FREQ=DAILY;COUNT=1`;
  }, []);

  const handleClearDb = useCallback(async () => {
    await clearEvents();
    clearActiveTimerState();
    dirtyTasks$.set({});
    await refreshToday();
    Alert.alert("Database cleared");
  }, [refreshToday]);

  const handleCreateCustom = useCallback(async () => {
    const start = moment().startOf("day").toDate();
    await createEvent({
      title: "Focus Block",
      rrule: singleDayRule(start),
      timeGoal: 2 * 60 * 60,
      timeSpent: 0,
      category: 0,
      description: "Custom two hour focus session",
    });
    await refreshToday();
    Alert.alert("Custom event added");
  }, [refreshToday, singleDayRule]);

  const handleCreateRandomToday = useCallback(async () => {
    const randomHour = Math.floor(Math.random() * 12);
    const randomDurationMinutes = 30 + Math.floor(Math.random() * 120);
    const start = moment().startOf("day").add(randomHour, "hours").toDate();
    await createEvent({
      title: `Random Task ${randomHour + 1}`,
      rrule: singleDayRule(start),
      timeGoal: randomDurationMinutes * 60,
      timeSpent: 0,
      category: randomHour % 5,
      description: "Auto-generated test event",
    });
    await refreshToday();
    Alert.alert("Random event created for today");
  }, [refreshToday, singleDayRule]);

  const handleClearCache = useCallback(() => {
    tasks$.entities.set({});
    tasks$.lists.byDate.set({});
    Alert.alert("tasks$ cache cleared");
  }, []);

  const handleSetFakeNow = useCallback((date: Date) => {
    setFakeNow(date);
    Alert.alert("Fake time set", moment(date).format("LLLL"));
  }, []);

  const handleSetFakeNowTomorrow = useCallback(() => {
    const d = moment()
      .add(1, "day")
      .startOf("day")
      .add(23, "hours")
      .add(59, "minutes")
      .add(50, "seconds")
      .toDate();
    handleSetFakeNow(d);
  }, [handleSetFakeNow]);

  const handleClearFakeNow = useCallback(() => {
    clearFakeNow();
    Alert.alert("Fake time cleared");
  }, []);

  return (
    <ScreenView style={styles.container}>
      <SafeAreaView>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Test Panel</Text>
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
            <View style={styles.panelButton}>
              <Button title="Set Fake Now (Tomorrow 11:59:50pm)" onPress={handleSetFakeNowTomorrow} />
            </View>
            <View style={styles.panelButton}>
              <Button
                title="Pick Fake Now…"
                onPress={() => {
                  setPickerDate(new Date());
                  setShowPicker(true);
                }}
              />
            </View>
            {showPicker && (
              <View style={styles.pickerCard}>
                <DateTimePicker
                  mode="single"
                  date={pickerDate}
                  onChange={(ev) => {
                    if (ev.date) setPickerDate(ev.date);
                  }}
                  styles={{
                    ...useDefaultStyles,
                    today: { borderColor: "black", borderRadius: 12, borderWidth: 1, backgroundColor: "transparent" },
                    selected: { backgroundColor: "#000", borderRadius: 12 },
                    selected_label: { color: "white" },
                  }}
                />
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
                  <Button title="Cancel" onPress={() => setShowPicker(false)} />
                  <Button
                    title="Set Fake Now"
                    onPress={() => {
                      handleSetFakeNow(pickerDate);
                      setShowPicker(false);
                    }}
                  />
                </View>
              </View>
            )}
            <View style={styles.panelButton}>
              <Button title="Clear Fake Now" onPress={handleClearFakeNow} />
            </View>
            <Text style={styles.fakeLabel}>
              {fakeNow$.get() ? `Fake now: ${moment(fakeNow$.get()).format("LLLL")}` : "Fake now: off"}
            </Text>
          </View>
          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  devPanel: {
    marginTop: 30,
    width: "90%",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#f1f1f5",
    gap: 12,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  panelButton: {
    width: "100%",
  },
  pickerCard: {
    marginTop: 4,
    borderRadius: 12,
    padding: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fakeLabel: {
    fontSize: 12,
    color: "#555",
  },
});
