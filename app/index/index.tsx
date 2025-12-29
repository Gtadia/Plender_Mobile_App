import { StyleSheet, View, ScrollView, Button, RefreshControl, TouchableOpacity } from "react-native";
import { Text, ScreenView } from "@/components/Themed";
import { globalTheme, horizontalPadding } from "@/constants/globalThemeVar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { observable } from "@legendapp/state";
import moment from "moment";
import { Category$, loadDay, tasks$ } from "@/utils/stateManager";
import { Memo, useObservable } from "@legendapp/state/react";
import { CurrentTaskView, TodayTaskView } from "@/components/HomeScreenTasks";
import { useCallback } from "react";
import { flushDirtyTasksToDB } from "@/utils/dirtyTaskStore";
import BottomSheet from "@/components/BottomSheet";
import { fmt } from "@/helpers/fmt";

// TODO — for drag down to reload

export default function TabOneScreen() {
  const insets = useSafeAreaInsets();
  const homePageInfo$ = useObservable({
    reload: false
  })
  const taskSheetOpen$ = useObservable(false);
  const taskSheetClose$ = useObservable(0);
  const taskSheetId$ = useObservable<number | null>(null);

  const Refreshing = useCallback(async () => {
    // show spinner immediately
    homePageInfo$.reload.set(true);
    try {
      await flushDirtyTasksToDB();
      await loadDay(new Date());
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

        <CurrentTaskView
          onPressDetails={(id) => {
            taskSheetId$.set(id);
            taskSheetOpen$.set(true);
          }}
        />

        <View style={[styles.titleContainer, { marginBottom: 15 }]}>
          <Text style={[styles.title, styles.secondaryTitle]}>Today</Text>
        </View>
        <TodayTaskView />

        {/* Padding Bottom */}
        <View style={globalTheme.tabBarAvoidingPadding} />
      </ScrollView>

      <BottomSheet open$={taskSheetOpen$} close={taskSheetClose$}>
        <Memo>
          {() => {
            const id = taskSheetId$.get();
            if (id == null) return <View />;
            const node = tasks$.entities[id];
            if (!node) return <View />;
            const task = node.get();
            const title = task.title || "Untitled Task";
            const spent = task.timeSpent ?? 0;
            const goal = task.timeGoal ?? 0;
            const percent = goal > 0 ? Math.min(spent / goal, 1) : (spent > 0 ? 1 : 0);
            const dateLabel = task.date ? moment(task.date).format("MMMM D, YYYY") : "";
            const catColor = Category$[task.category]?.color?.get?.() ?? "#999";
            return (
              <View style={{ padding: 16, gap: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 22, fontWeight: "700" }} numberOfLines={2}>
                    {title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      taskSheetOpen$.set(false);
                      taskSheetClose$.set((v) => v + 1);
                    }}
                  >
                    <Text style={{ color: catColor, fontWeight: "600" }}>Close</Text>
                  </TouchableOpacity>
                </View>
                {dateLabel ? <Text style={{ color: "#666" }}>{dateLabel}</Text> : null}
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <View>
                    <Text style={{ color: "#666", fontWeight: "600" }}>Spent</Text>
                    <Text style={{ fontSize: 18, fontWeight: "700" }}>{fmt(spent)}</Text>
                  </View>
                  <View>
                    <Text style={{ color: "#666", fontWeight: "600" }}>Goal</Text>
                    <Text style={{ fontSize: 18, fontWeight: "700" }}>{goal ? fmt(goal) : "—"}</Text>
                  </View>
                  <View>
                    <Text style={{ color: "#666", fontWeight: "600" }}>Progress</Text>
                    <Text style={{ fontSize: 18, fontWeight: "700" }}>{Math.round(percent * 100)}%</Text>
                  </View>
                </View>
                {task.description ? (
                  <View>
                    <Text style={{ color: "#666", fontWeight: "600" }}>Notes</Text>
                    <Text style={{ fontSize: 16 }}>{task.description}</Text>
                  </View>
                ) : null}
              </View>
            );
          }}
        </Memo>
      </BottomSheet>
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
