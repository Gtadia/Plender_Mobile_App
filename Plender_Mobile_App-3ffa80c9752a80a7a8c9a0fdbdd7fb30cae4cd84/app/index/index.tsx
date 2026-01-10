import { StyleSheet, View, ScrollView, RefreshControl } from "react-native";
import { Text, ScreenView } from "@/components/Themed";
import { globalTheme, horizontalPadding } from "@/constants/globalThemeVar";
import { dayKey$, taskDetailsSheet$, loadDay } from "@/utils/stateManager";
import { Memo, useObservable } from "@legendapp/state/react";
import { observer } from "@legendapp/state/react";
import { CurrentTaskView, TodayTaskView } from "@/components/HomeScreenTasks";
import { useCallback, useEffect, useState } from "react";
import { flushDirtyTasksToDB } from "@/utils/dirtyTaskStore";
import { useRouter } from "expo-router";
import { getNow } from "@/utils/timeOverride";
import moment from "moment";
import { ScreenHeader } from "@/components/ScreenHeader";

// TODO — for drag down to reload

export default observer(function TabOneScreen() {
  const homePageInfo$ = useObservable({
    reload: false
  })
  const router = useRouter();
  const [todayKey, setTodayKey] = useState(dayKey$.get());

  useEffect(() => {
    const dispose = dayKey$.onChange(({ value }) => {
      setTodayKey(value);
      void loadDay(new Date());
    });
    return () => dispose();
  }, []);

  const Refreshing = useCallback(async () => {
    // show spinner immediately
    homePageInfo$.reload.set(true);
    try {
      const now = moment(getNow());
      dayKey$.set(now.format("YYYY-MM-DD"));
      await flushDirtyTasksToDB();
      await loadDay(now.toDate());
    } finally {
      // hide spinner
      homePageInfo$.reload.set(false);
    }
  }, []);

  return (
    <ScreenView style={globalTheme.container}>
      <ScreenHeader title="Home" />
      <ScrollView
        style={{ width: "100%" }}
        showsVerticalScrollIndicator={false}
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
            taskDetailsSheet$.taskId.set(id);
            router.push("/taskDetailsSheet");
          }}
        />

        <View style={styles.todayHeader}>
          <Text style={styles.sectionTitle} fontColor="strong">
            Today
          </Text>
          <Text fontColor="subtext1" style={styles.todayDate}>
            {moment(todayKey, "YYYY-MM-DD")
              .toDate()
              .toLocaleDateString("en-US", { dateStyle: "medium" })}
          </Text>
        </View>
        <TodayTaskView
          onPressItem={(id) => {
            taskDetailsSheet$.taskId.set(id);
            router.push("/taskDetailsSheet");
          }}
        />

        {/* Padding Bottom */}
        <View style={globalTheme.tabBarAvoidingPadding} />
      </ScrollView>

    </ScreenView>
  );
});

const styles = StyleSheet.create({
  todayHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    paddingHorizontal: horizontalPadding,
    marginBottom: 0,
  },
  todayDate: {
    fontSize: 14,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },

});
