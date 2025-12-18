import { StyleSheet, View, ScrollView, Button, RefreshControl } from "react-native";
import { Text, ScreenView } from "@/components/Themed";
import { globalTheme, horizontalPadding } from "@/constants/globalThemeVar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { observable } from "@legendapp/state";
import { eventsType, getAllEvents, getEventsForDate } from "@/utils/database";
import moment from "moment";
import { Category$, loadDay, tasks$ } from "@/utils/stateManager";
import { Memo, useObservable } from "@legendapp/state/react";
import { CurrentTaskView, TodayTaskView } from "@/components/HomeScreenTasks";
import { useCallback } from "react";

// TODO — for drag down to reload

export default function TabOneScreen() {
  const insets = useSafeAreaInsets();
  const homePageInfo$ = useObservable({
    reload: false
  })

  const Refreshing = useCallback(async () => {
    // show spinner immediately
    homePageInfo$.reload.set(true);
    try {
      const events = await getEventsForDate(moment().startOf("day").toDate());
      events.forEach(r => tasks$.entities[r.id].set(r));
      loadDay(new Date());
    } finally {
      // hide spinner
      homePageInfo$.reload.set(false);
    }
  }, []);

  return (
    <ScreenView style={globalTheme.container}>
      <View
        style={[
          styles.titleContainer,
          { paddingTop: insets.top, marginBottom: 5 },
        ]}
      >
        <Text style={[styles.title, styles.mainTitle]}>Home</Text>
      </View>
      <ScrollView
        style={{ width: "100%" }}
        refreshControl={
          <RefreshControl
            refreshing={homePageInfo$.reload.get()}
            onRefresh={Refreshing}
          />
        }
      >
        {/* Current Task Progress */}
        {/* marginTop: 15  */}
        {/* Padding near bottom so users can scroll past UI components */}

        <CurrentTaskView />

        <View style={[styles.titleContainer, { marginBottom: 15 }]}>
          <Text style={[styles.title, styles.secondaryTitle]}>Today</Text>
        </View>
        <TodayTaskView />

        {/* Padding Bottom */}
        <View style={globalTheme.tabBarAvoidingPadding} />
      </ScrollView>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    width: "100%",
  },
  title: {
    left: horizontalPadding,
    color: "#000",
    marginLeft: 0,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },

  mainTitle: {
    fontSize: 28,
  },
  secondaryTitle: {
    fontSize: 24,
  },
});