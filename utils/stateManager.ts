import { computed, observable } from "@legendapp/state";
import { fonts } from "@/constants/types";
import { colorTheme } from "@/constants/Colors";
import type { Theme } from "@/node_modules/@react-navigation/native/src/types";
import dayjs from "dayjs";
import { dbEvents, eventsType, getEventsForDate } from "./database";
import moment from "moment";

interface categoryItem {
  label: string;
  color: string;
}

export const Category$ = observable<Record<number, categoryItem>>({
  0: { label: "test", color: '#FF0000' },
  1: { label: "test test, 1 2 3 1 2 3 test", color: "#00FF00" },
  2: { label: "pop", color: "#0000FF" },
  3: { label: "deo", color: "#FF00FF" },
  4: { label: "deo", color: "#FF00FF" },
  5: { label: "deo", color: "#FF00FF" },
});
// max numeric key + 1 (handles empty object)
const nextId =
  Object.keys(Category$.get()).length === 0
    ? 0
    : Math.max(...Object.keys(Category$.get()).map(Number)) + 1;

export const CategoryIDCount$ = observable<number>(nextId);

// Event selected to be viewed
export const ViewTask$ = computed(() => {
  const id = ViewTaskID$.get();
  if (id === -1) return undefined;

  // Search on plain array to find the index…
  const arr = SelectedDate$.tasks.get();                // plain values
  const idx = arr.findIndex(t => t.id === id);   // search by value

  // …then return the observable node at that index
  return idx >= 0 ? SelectedDate$.tasks[idx] : undefined;
});
export const ViewTaskID$ = observable<number>(-1);   // if negative, no task

// TODO — Make a cache that just stores today's events + 100 most recently visisted events (not due today)
export interface TaskType {
  tasks: eventsType[],
  total: number,
}
export const Today$ = observable<TaskType>({
  tasks: [],
  total: (): number => Today$.tasks.length,
});
export const SelectedDate$ = observable<TaskType>({
  tasks: [],
  total: (): number => SelectedDate$.tasks.length
});

import { ensureDirtyTasksHydrated, getDirtySnapshot } from "./dirtyTaskStore";

// Task Observable
export const tasks$ = observable({
  entities: {} as Record<number, eventsType>,   // id -> event
  lists: {
    byDate: {} as Record<string, number[]>,     // "YYYY-MM-DD" -> [ids]
  },
});

// Load once per screen/range
export async function loadDay(date: Date) {
  await ensureDirtyTasksHydrated();
  const rows = await getEventsForDate(date);  // DB query ONCE
  const key = moment(date).format('YYYY-MM-DD');
  const dirty = getDirtySnapshot();

  tasks$.lists.byDate[key].set(rows.map(r => r.id));
  rows.forEach((r) => {
    const dirtyEntry = dirty[r.id];
    const dayOverride = dirtyEntry?.byDate?.[key];
    const timeSpent = dayOverride ?? dirtyEntry?.timeSpent;
    const withDirty = timeSpent !== undefined ? { ...r, timeSpent } : r;
    tasks$.entities[r.id].set(withDirty);
  });
}
export async function loadWeek() {
  // TODO — For Calendar View
}

// Selection
export const CurrentTaskID$ = observable<number>(-1);   // if negative, no task
export const CurrentTask$ = computed(() => {
  const id = CurrentTaskID$.get();
  return id === -1 ? undefined : tasks$.entities[id]; // <- node
});
// export const CurrentTask$ = computed(() => {
//   const id = CurrentTaskID$.get();
//   if (id === -1) return undefined;

//   // Search on plain array to find the index…
//   const arr = Today$.tasks.get();                // plain values
//   const idx = arr.findIndex(t => t.id === id);   // search by value

//   // …then return the observable node at that index
//   return idx >= 0 ? Today$.tasks[idx] : undefined;
// });



// import { throttle } from 'lodash-es';
// const persistTimeSpent = throttle(async (id: number, value: number) => {
//   await db.runAsync('UPDATE event SET timeSpent=? WHERE id=?', [value, id]);
// }, 500);





export const Tags$ = observable({
  list: {
    // `value` ==> `id`
    // WARNING: id == 0 DOES NOT WORK with home.tsx's TagsView
    1: { label: "This is a labe", color: "black", value: 1 },
    2: { label: "bro", color: "red", value: 2 },
    3: { label: "what", color: "blue", value: 3 },
  },
  addToList: (id: number, tagItem: { label: string; color: string }) => {
    Tags$.list.set((prev) => ({
      ...prev,
      [id]: { ...tagItem, value: id }, // Add/Update the tag with the provided ID
    }));
  },
});

export const selectedDate$ = observable(dayjs());

export const colorTheme$ = observable({
  colorTheme: colorTheme.catppuccin.latte, // default theme
  nativeTheme: {
    dark: false,
    colors: {
      primary: "rgb(10, 132, 255)",
      // TODO — Change this so that it changes when 'colorTheme' changes
      background: colorTheme.catppuccin.latte.surface1, // NOTE — this is the background color of the app (the main content covers this area however)
      card: colorTheme.catppuccin.latte.surface1, // pop up menu?
      text: colorTheme.catppuccin.latte.text,
      border: "rgb(39, 39, 41)", // Make it really black (light mode) / white (dark mode)
      notification: "rgb(255, 69, 58)",
    },
    fonts,
  },
  tabBar: {
    iconColor: colorTheme.catppuccin.latte.text,
  },
  colors: {
    primary: colorTheme.catppuccin.latte.yellow,
    secondary: colorTheme.catppuccin.latte.red,
    accent: colorTheme.catppuccin.latte.green,

    background: colorTheme.catppuccin.latte.base, // light/dark

    surface0: colorTheme.catppuccin.latte.surface0, // for something...
    surface1: colorTheme.catppuccin.latte.surface1, // bottom tab bar (aka, secondary background)

    subtext0: colorTheme.catppuccin.latte.subtext0,
    subtext1: colorTheme.catppuccin.latte.subtext1,
    // Add more colors as needed
  },
});

export const styling$ = observable({
  mainContentRadius: 0, // 55 is the radius of iphone 14 pro max corners
});
