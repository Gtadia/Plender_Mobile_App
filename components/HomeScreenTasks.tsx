import {
  StyleSheet,
  View,
  ScrollView,
  Button,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Text, ScreenView } from "@/components/Themed";
import { eventsType, getEventsForDate } from "@/utils/database";
import {
  Category$,
  CurrentTask$,
  CurrentTaskID$,
  Today$,
} from "@/utils/stateManager";
import moment from "moment";
import { observable } from "@legendapp/state";
import { Memo } from "@legendapp/state/react";
import Fontisto from "@expo/vector-icons/Fontisto";
import { FontAwesome5 } from "@expo/vector-icons";
import { useCallback } from "react";
import HorizontalProgressBarPercentage from "./custom_ui/HorizontalProgressBarPercentage";

export const homePageInfo$ = observable({
  reload: false,
});

export const CurrentTaskView = () => {
  const noTaskView = (
    <>
      <Text style={taskStyles.taskText}>No Task Running</Text>
      <Text style={taskStyles.taskSubText}>
        Start a task to see it running here!
      </Text>
    </>
  );

  const taskView = () => {
    const task = CurrentTask$.get();
    const taskObj = {
      title: "Untitled",
      timeSpent: "00:00",
      timeGoal: "00:00",
      percentage: 0
    };
    if (task) {
      taskObj.title = task.title.trim() ? task.title.trim() : "Untitled";
      taskObj.percentage = task.percentComplete;
    }

    return (
      <View style={{ justifyContent: 'center', alignItems: 'center'}}>
        <Text style={[taskStyles.taskText, taskStyles.pad]}>{taskObj.title}</Text>
        <View style={taskStyles.pad} >
          <Text style={taskStyles.taskTimeSpent}>{taskObj.timeSpent}</Text>
          <View style={{ height: 0}} />
          <Text style={taskStyles.taskTimeGoal}>{taskObj.timeGoal}</Text>
        </View>
        <View style={taskStyles.pad}>
          <HorizontalProgressBarPercentage width={150} percentage={taskObj.percentage} color={"green"} />
        </View>
      </View>
    );
  };

  // TODO — Find task in each category, save category, print category color
  return (
    <Memo>
      {() => (
        <View
          style={[
            taskStyles.container,
            {
              backgroundColor:
                CurrentTaskID$.get() === -1
                  ? "gray"
                  : CurrentTask$.category.get() === -1
                  ? "gray"
                  : Category$[CurrentTask$.category.get()].color.get(),
            },
          ]}
        >
          {CurrentTaskID$.get() === -1 ? noTaskView : taskView()}
        </View>
      )}
    </Memo>
  );
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
        {Category$[category].label.get() ?? "General"} ({percent}%)
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
      <TouchableOpacity
        onPress={() => {
          CurrentTaskID$.set((prev) => (prev === e.id ? -1 : e.id));
          console.warn("Current Task: ", CurrentTask$.get());
          // CurrentTask$.timeSpent.set((prev) => prev + 5)
          // console.warn("This is the current task: ", CurrentTaskID$.get(), CurrentTask$.get())
        }}
        style={{ marginRight: 8 }}
      >
        <Memo>
          {() =>
            CurrentTaskID$.get() === e.id ? (
              <FontAwesome5 name="pause" size={24} color="red" />
            ) : (
              <FontAwesome5 name="play" size={24} color="green" />
            )
          }
        </Memo>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          // TODO — handle opening modal later
        }}
        style={{ flex: 1, backgroundColor: "pink" }}
      >
        <Text style={taskListStyles.rowTitle}>{taskTitle}</Text>
        {e.date && (
          <Text style={taskListStyles.rowSub}>
            {moment(e.date).format("MMMM D, YYYY")}
          </Text>
        )}
      </TouchableOpacity>
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
// helper
const groupByCategory = (items: eventsType[]) =>
  items.reduce((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {} as Record<number, eventsType[]>);

export const TodayTaskView = () => {
  return (
    <Memo>
      {() => {
        // --- OPTION A: regroup on any change to Today$ (deep tracking) ---
        // const grouped = groupByCategory(Today$.get());

        // --- OPTION B: regroup ONLY when the array length changes ---
        Today$.total.get(); // track just the length (just to fire Memo re-render)
        const grouped = groupByCategory(Today$.tasks.peek()); // read without tracking

        const entries = Object.entries(grouped).sort(
          ([a], [b]) => Number(a) - Number(b)
        );

        return (
          <ScrollView
            contentContainerStyle={taskListStyles.container}
            scrollEnabled={false}
          >
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

const taskStyles = StyleSheet.create({
  container: {
    maxWidth: 500,
    flex: 1,
    marginHorizontal: 30,
    borderRadius: 20,
    justifyContent: "center",
    alignContent: "center",
    paddingVertical: 15,
    minHeight: 170,
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
  taskTimeSpent: {
    fontSize: 28,
    fontWeight: 700,
    textAlign: "center",
  },
  taskTimeGoal: {
    fontSize: 24,
    fontWeight: 700,
    color: 'white',
    textAlign: "center",
  },
  taskPercentage: {
    fontSize: 16,
    fontWeight: 500,
    color: 'white',
  },
  pad: {
    margin: 3,
    // backgroundColor: 'aqua'
  }
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
