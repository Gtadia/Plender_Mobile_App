import { StyleSheet, View, ScrollView, Button } from "react-native";
import { Text, ScreenView } from "@/components/Themed";
import { horizontalPadding } from "@/constants/globalThemeVar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { observable } from "@legendapp/state";
import { getAllEvents, getEventsForDate } from "@/utils/database";
import dayjs from "dayjs";
import { Today$ } from "@/utils/stateManager";
import { Memo } from "@legendapp/state/react";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(timezone);

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

// TODO — Implement Tomorrow task views as well...
const TodayTaskView = () => {
  pageInfo$.reload.onChange(() => {
    getEventsForDate(dayjs().startOf("date").toDate()).then((events) => {
      Today$.set(events);
    });
  });
  return (
    <Memo>
      {() =>
        Today$.get().map((data, index) => {
          // TODO — render the events return
          return (
            <View key={index}>
              <Text>{data.title}</Text>
            </View>
          );
        })
      }
    </Memo>
  );
};

export default function TabOneScreen() {
  const insets = useSafeAreaInsets();
  dayjs.locale('ny');
  dayjs.tz.setDefault('America/New_York');

  return (
    <ScreenView style={styles.container}>
      <View
        style={[
          styles.titleContainer,
          { paddingTop: insets.top, marginBottom: 15 },
        ]}
      >
        <Text style={[styles.title]}>Home</Text>
      </View>
      <ScrollView style={{ width: "100%" }}>
        {/* Current Task Progress */}
        {/* marginTop: 15  */}
        {/* Padding near bottom so users can scroll past UI components */}

        <CurrentTaskView />

        <TodayTaskView />

        <Button
          title={"Print all Events"}
          onPress={() => {
            console.log("Printing Events");
            getAllEvents().then((events) => {
              events.map((e) => {
                console.log(e);
              });
            });
          }}
        />
        <Button
          title={"Print Today's Events"}
          onPress={() => {
            console.debug("Printing Today's Events ", dayjs().toLocaleString());
            getEventsForDate(dayjs().toDate()).then((events) => {
              events.map((e) => {
                console.warn(e);
              });
            });
          }}
        />
        <Button
          title={"Print Tomorrow's Events"}
          onPress={() => {
            // TODO — REMEMBER that dayjs() keeps defaulting to UTC so use .startOf('day') to combat it because this fixes it for some reason
            console.debug(
              "Printing Tomorrows's Events ",
              dayjs().add(1, "day").startOf("day").toString(),
              new Date().toString()
            );
            getEventsForDate(
              dayjs().add(1, "day").startOf("day").toDate()
            ).then((events) => {
              events.map((e) => {
                console.warn(e);
              });
            });
          }}
        />
        {/* {
getAllEvents().then((events) => {
    events.map((e) => {
      <Text>{e.rrule}</Text>
    })
  })
      } */}

        {/* <View
          style={{
            height: 800,
            backgroundColor: "black",
          }}
        >

        </View> */}
      </ScrollView>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  titleContainer: {
    width: "100%",
  },
  title: {
    left: horizontalPadding,
    color: "#000",
    fontSize: 28,
    marginLeft: 0,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
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
