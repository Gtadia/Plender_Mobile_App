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
  tasks$
} from "@/utils/stateManager";
import moment from "moment";
import { computed, observable } from "@legendapp/state";
import { Memo } from "@legendapp/state/react";
import Fontisto from "@expo/vector-icons/Fontisto";
import { FontAwesome5 } from "@expo/vector-icons";
import { useCallback } from "react";
import HorizontalProgressBarPercentage from "./custom_ui/HorizontalProgressBarPercentage";
import { colorTheme } from "@/constants/Colors";
import { fmt, fmtDisappearingHour } from "@/helpers/fmt";

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
    const taskObj$ = observable({
      title: computed(() => {
        const curr = CurrentTask$.get()
        if (curr && typeof curr.title === 'string') return (curr.title.trim() ? curr.title.trim() : "Untitled") ?? "Untitled"
        return "Untitled"
      }),
      timeSpent: computed(() => {
        const curr = CurrentTask$.get()
        if (curr) return fmtDisappearingHour(curr.timeSpent)
        return "00:00"
      }),
      timeGoal: computed(() => {
        const curr = CurrentTask$.get()
        if (curr) return fmtDisappearingHour(curr.timeGoal)
        return "00:00"
      }),
      percentage: computed(() => {
        const curr = CurrentTask$.get()
        let division = 0;
        if (curr) {
          try {
            division = curr.timeSpent / curr.timeGoal;
          } catch (err) {
            console.warn("Probably divided by 0 somehow...", err)
          }
        }
        return division
      })
    });

    return (
      <View style={{ justifyContent: 'center', alignItems: 'center'}}>
        <Memo><Text style={[taskStyles.taskText, taskStyles.pad]}>{taskObj$.title.get()}</Text></Memo>
        <View style={taskStyles.pad} >
          <Memo><Text style={taskStyles.taskTimeSpent}>{taskObj$.timeSpent.get()}</Text></Memo>
          <Memo><Text style={taskStyles.taskTimeGoal}>{taskObj$.timeGoal.get()}</Text></Memo>
        </View>
        <View style={taskStyles.pad}>
          <Memo><HorizontalProgressBarPercentage width={150} percentage={taskObj$.percentage.get()} color={"green"} /></Memo>
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

const SectionHeader = ({
  category,
  ids,
}: {
  category: number;
  ids: number[];
}) => {
  return (
    <Memo>
      {() => {
        let spent = 0, goal = 0;
        for (const id of ids) {
          const n = tasks$.entities[id];
          if (!n) continue;
          spent += n.timeSpent.get() ?? 0;  // tracked read
          goal  += n.timeGoal.get()  ?? 0;  // tracked read
        }
        const percent = goal > 0 ? Math.round((spent / goal) * 100) : 0;

        return (
          <View style={taskListStyles.sectionHeader}>
            <Text
              style={[
                taskListStyles.sectionTitle,
                { color: Category$[category].color.get() ?? "#000" }, // tracked category color
              ]}
            >
              {Category$[category].label.get() ?? "General"} ({percent}%)
            </Text>
            <Text style={taskListStyles.sectionTotals}>
              {fmt(spent)}{goal ? ` / ${fmt(goal)}` : ""}
            </Text>
          </View>
        );
      }}
    </Memo>
  )
};

const TaskRow = ({ id }: { id: number }) => (
  <Memo>
    {() => {
      const node = tasks$.entities[id];
      if (!node) return null;

      const isCurrent = CurrentTaskID$.get() === id;

      const title = node.title.get()?.trim() || "Untitled";
      const timeSpent = node.timeSpent.get() ?? 0;
      const timeGoal  = node.timeGoal.get()  ?? 0;
      const date      = node.date?.get?.(); // optional

      const onToggle = () => {
        // toggle current selection
        CurrentTaskID$.set(prev => (prev === id ? -1 : id));
        // example: increment this row's time (updates cache & UI)
        node.timeSpent.set(prev => (prev ?? 0) + 60);
        // (optionally debounce persist to DB here)
      };

      return (
        <View style={taskListStyles.row}>
          <TouchableOpacity onPress={onToggle} style={{ marginRight: 8 }}>
            {isCurrent ? (
              <FontAwesome5 name="pause" size={24} color="red" />
            ) : (
              <FontAwesome5 name="play" size={24} color="green" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              // open details modal, etc.
            }}
            style={{ flex: 1 }}
          >
            <Text style={taskListStyles.rowTitle}>{title}</Text>
            {date && (
              <Text style={taskListStyles.rowSub}>
                {moment(date).format("MMMM D, YYYY")}
              </Text>
            )}
          </TouchableOpacity>

          <View style={{ alignItems: "flex-end" }}>
            <Text style={taskListStyles.rowTime}>
              {fmt(timeSpent)}{timeGoal ? ` / ${fmt(timeGoal)}` : ""}
            </Text>
          </View>
        </View>
      );
    }}
  </Memo>
);

// TODO — Implement Tomorrow task views as well...

export const TodayTaskView = () => {
  const key = moment().format("YYYY-MM-DD");
  // const byCat$ = tasks$.lists.byDateCategory[key];

  return (
    <Memo>
      {() => {
        // 🔍 tracked: the object mapping category -> [ids]
        const byCat = tasks$.lists.byDateCategory[key].get();
        const entries = byCat === undefined ? [] : Object.entries(byCat).sort(([a], [b]) => +a - +b);

        return (
          <ScrollView contentContainerStyle={taskListStyles.container} scrollEnabled={false}>
            {entries.length ? (
              entries.map(([catKey, ids]) => (
                // <SectionView key={catKey} category={+catKey} ids={ids} />
                  <View style={taskListStyles.section}>
                    <SectionHeader category={+catKey} ids={ids} />
                    {ids.map((id) => (
                      <TaskRow key={id} id={id} />
                    ))}
                  </View>
              ))
            ) : (
              <View><Text>No tasks for today!</Text></View>
            )}
          </ScrollView>
        );
      }}
    </Memo>
  );
};

const SectionView = () => {

}

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
    color: colorTheme.catppuccin.latte.crust
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
