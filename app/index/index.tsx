import { StyleSheet, View, ScrollView, Button } from "react-native";
import { Text, ScreenView } from "@/components/Themed";
import { globalTheme, horizontalPadding } from "@/constants/globalThemeVar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { observable } from "@legendapp/state";
import { eventsType, getAllEvents, getEventsForDate } from "@/utils/database";
import moment from "moment";
import { Category$, Today$ } from "@/utils/stateManager";
import { Memo } from "@legendapp/state/react";

// TODO — for drag down to reload
const pageInfo$ = observable({
  reload: false,
});

const CurrentTaskView = () => {
  const noTaskView = (
    <View style={[taskStyles.container, { backgroundColor: "gray" }]}>
      <Text style={taskStyles.taskText}>No Task Running</Text>
      <Text style={taskStyles.taskSubText}>
        Start a task to see it running here!
      </Text>
    </View>
  );

  const taskView = (
    <View>
      <Text style={taskStyles.taskText}>{}</Text>
      <Text>{}</Text>
    </View>
  );

  return noTaskView;
};

// helper: seconds → H:MM:SS
const fmt = (s = 0) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${h}:${pad(m)}:${pad(sec)}`;
};

const SectionHeader = ({
  category,
  items,
}: {
  category: number;
  items: eventsType[];
}) => {
  const totalSpent = items.reduce((a, e) => a + (e.timeSpent ?? 0), 0);
  const totalGoal = items.reduce((a, e) => a + (e.timeGoal ?? 0), 0);
  const percent =
    totalGoal > 0 ? Math.round((totalSpent / totalGoal) * 100) : 0;

  return (
    <View style={taskListStyles.sectionHeader}>
      <Text
        style={[
          taskListStyles.sectionTitle,
          { color: Category$[category].color.get() ?? "#000" },
        ]}
      >
        {/* no cateogry handler */}
        {Category$[category].label.get() ?? 'General'} ({percent}%)
      </Text>
      <Text style={taskListStyles.sectionTotals}>
        {fmt(totalSpent)}
        {totalGoal ? ` / ${fmt(totalGoal)}` : ""}
      </Text>
    </View>
  );
};

const TaskRow = ({ e }: { e: eventsType }) => {
  // no title handler
  const taskTitle = e.title.trim() ? e.title : "Untitled";

  return (
    <View style={taskListStyles.row}>
      {/* left icon placeholder */}
      <View style={taskListStyles.bullet} />
      <View style={{ flex: 1 }}>
        <Text style={taskListStyles.rowTitle}>{taskTitle}</Text>
        {e.date && (
          <Text style={taskListStyles.rowSub}>
            {moment(e.date).format("MMMM D, YYYY")}
          </Text>
        )}
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={taskListStyles.rowTime}>
          {fmt(e.timeSpent ?? 0)}
          {e.timeGoal ? ` / ${fmt(e.timeGoal)}` : ""}
        </Text>
        {typeof e.percentComplete === "number" && (
          <Text style={taskListStyles.rowPercent}>{e.percentComplete}%</Text>
        )}
      </View>
    </View>
  );
};

// TODO — Implement Tomorrow task views as well...
const TodayTaskView = () => {
  // wherever you reload, you already set Today$.set(grouped)
  // keep your existing fetch code; only the render changes below
  pageInfo$.reload.onChange(() => {
    getEventsForDate(moment().startOf("day").toDate()).then((events) => {
      // Save Today's events by its category
      const grouped = events.reduce<Record<number, eventsType[]>>(
        (acc, item) => {
          const key = item.category; // or item.cateogry if that's the actual spelling
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(item);
          return acc;
        },
        {}
      );

      Today$.set(grouped);
      console.log("Today's task is running: ", grouped, Today$.get());
    });
  });

  return (
    <Memo>
      {() => {
        const grouped = Today$.get(); // Record<number, eventsType[]>
        if (!grouped) return <></>; // Return nothing when Today$ is null
        const entries = Object.entries(grouped).sort(
          ([a], [b]) => Number(a) - Number(b)
        );

        console.log("These are the ENTRIES: ", entries);

        return (
          <ScrollView contentContainerStyle={taskListStyles.container}>
            {entries.length ? (
              entries.map(([catKey, items]) => {
                const category = Number(catKey);
                return (
                  <View key={catKey} style={taskListStyles.section}>
                    <SectionHeader category={category} items={items} />
                    {items.map((e) => (
                      <TaskRow key={e.id} e={e} />
                    ))}
                  </View>
                );
              })
            ) : (
              <View>
                <Text>No tasks for today!</Text>
              </View>
            )}
          </ScrollView>
        );
      }}
    </Memo>
  );
};

export default function TabOneScreen() {
  const insets = useSafeAreaInsets();

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
      <ScrollView style={{ width: "100%" }}>
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

const taskStyles = StyleSheet.create({
  container: {
    maxWidth: 500,
    flex: 1,
    marginHorizontal: 30,
    borderRadius: 20,
    justifyContent: "center",
    alignContent: "center",
    paddingVertical: 15,
    height: 140,
    marginTop: 10,
    marginBottom: 30,
  },
  taskText: {
    fontSize: 16,
    fontWeight: 700,
    color: "white",
    textAlign: "center",
  },
  taskSubText: {
    fontSize: 14,
    fontWeight: 500,
    color: "white",
    textAlign: "center",
  },
});

// ---- styles (tweak to match your UI) ----
const taskListStyles = StyleSheet.create({
  container: {
    padding: 12,
    gap: 16,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  sectionTotals: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A4A4A",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  bullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2ecc71",
    marginRight: 10,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  rowSub: {
    fontSize: 12,
    color: "#7A7A7A",
    marginTop: 2,
  },
  rowTime: {
    fontSize: 14,
    fontWeight: "600",
  },
  rowPercent: {
    fontSize: 12,
    color: "#7A7A7A",
    marginTop: 2,
  },
});
