import { computed, observable, observe } from "@legendapp/state";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorTheme } from "@/constants/Colors";
import { AccentKey, ThemeKey, accentOpposites, getThemeTokens } from "@/constants/themes";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { dbEvents, eventsType, getEventsForDate } from "./database";
import moment from "moment";

dayjs.extend(utc);
dayjs.extend(timezone);

interface categoryItem {
  label: string;
  color: string;
  accentKey?: AccentKey;
  contrastKey?: AccentKey;
  contrastColor?: string;
}

const DEFAULT_CATEGORY_ACCENT: AccentKey = "peach";
const DEFAULT_CATEGORY_CONTRAST = accentOpposites[DEFAULT_CATEGORY_ACCENT];

const DEFAULT_CATEGORY_META: categoryItem = {
  label: "General",
  color: colorTheme.catppuccin.latte[DEFAULT_CATEGORY_ACCENT],
  accentKey: DEFAULT_CATEGORY_ACCENT,
  contrastKey: DEFAULT_CATEGORY_CONTRAST,
  contrastColor: colorTheme.catppuccin.latte[DEFAULT_CATEGORY_CONTRAST],
};
const NO_CATEGORY_META: categoryItem = {
  label: "No Category",
  color: colorTheme.catppuccin.latte.overlay1,
  contrastColor: colorTheme.catppuccin.latte.text,
};

export const DEFAULT_CATEGORY_ID = 0;
export const NO_CATEGORY_ID = -1;

export const Category$ = observable<Record<number, categoryItem>>({
  [DEFAULT_CATEGORY_ID]: DEFAULT_CATEGORY_META,
});
// max numeric key + 1 (handles empty object)
const nextId =
  Object.keys(Category$.get()).length === 0
    ? 0
    : Math.max(...Object.keys(Category$.get()).map(Number)) + 1;

export const CategoryIDCount$ = observable<number>(nextId);

const CATEGORY_STORAGE_KEY = "categoriesStore";
let categoriesHydrated = false;
let categoriesReady = false;
let categoriesPromise: Promise<void> | null = null;

const ensureDefaultCategory = () => {
  const categories = Category$.get();
  if (!Object.prototype.hasOwnProperty.call(categories, DEFAULT_CATEGORY_ID)) {
    Category$.assign({
      [DEFAULT_CATEGORY_ID]: { ...DEFAULT_CATEGORY_META },
    });
  }
};

export const getCategoryGroupId = (id?: number | null) => {
  const resolved = id ?? DEFAULT_CATEGORY_ID;
  const categories = Category$.get();
  if (Object.prototype.hasOwnProperty.call(categories, resolved)) {
    return resolved;
  }
  if (resolved === DEFAULT_CATEGORY_ID) {
    return DEFAULT_CATEGORY_ID;
  }
  return NO_CATEGORY_ID;
};

export const getCategoryMeta = (id?: number | null): categoryItem => {
  const resolved = id ?? DEFAULT_CATEGORY_ID;
  const categories = Category$.get();
  const entry = categories[resolved];
  if (entry) {
    return {
      ...entry,
      contrastColor: entry.contrastColor ?? entry.color,
    };
  }
  if (resolved === DEFAULT_CATEGORY_ID) {
    return {
      ...DEFAULT_CATEGORY_META,
      contrastColor: DEFAULT_CATEGORY_META.contrastColor ?? DEFAULT_CATEGORY_META.color,
    };
  }
  return NO_CATEGORY_META;
};

export const getCategoryContrastColor = (id?: number | null, fallback?: string) => {
  const meta = getCategoryMeta(id);
  return meta.contrastColor ?? fallback ?? meta.color;
};

async function hydrateCategoriesInternal() {
  try {
    const raw = await AsyncStorage.getItem(CATEGORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        categories?: Record<number, categoryItem>;
        nextId?: number;
      };
      if (parsed.categories && Object.keys(parsed.categories).length) {
        Category$.set(parsed.categories);
      }
      ensureDefaultCategory();
      if (parsed.nextId !== undefined) {
        CategoryIDCount$.set(parsed.nextId);
      } else {
        const keys = Object.keys(Category$.get()).map(Number);
        CategoryIDCount$.set(keys.length ? Math.max(...keys) + 1 : 0);
      }
    }
  } catch (err) {
    console.warn("Failed to load categories store", err);
  } finally {
    ensureDefaultCategory();
    categoriesHydrated = true;
    categoriesReady = true;
    const snapshot = {
      categories: Category$.get(),
      nextId: CategoryIDCount$.get(),
    };
    AsyncStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(snapshot)).catch((err) => {
      console.warn("Failed to persist categories store", err);
    });
  }
}

export async function ensureCategoriesHydrated() {
  if (categoriesHydrated) return;
  categoriesPromise ??= hydrateCategoriesInternal();
  await categoriesPromise;
}

observe(() => {
  const payload = JSON.stringify({
    categories: Category$.get(),
    nextId: CategoryIDCount$.get(),
  });
  if (!categoriesReady) return;
  AsyncStorage.setItem(CATEGORY_STORAGE_KEY, payload).catch((err) => {
    console.warn("Failed to persist categories store", err);
  });
});

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

// Task details modal target
export const taskDetailsSheet$ = observable<{ taskId: number | null }>({
  taskId: null,
});

// Time goal editor target (reused by timeGoalSelectSheet)
export const timeGoalEdit$ = observable<{ taskId: number | null }>({
  taskId: null,
});

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

const buildThemeTokens = (themeKey: ThemeKey, accentKey: AccentKey) => {
  const { palette, accent, textStrong, theme } = getThemeTokens(themeKey, accentKey);
  return {
    palette,
    colors: {
      primary: palette.yellow,
      secondary: palette.red,
      accent,
      background: palette.base,
      surface0: palette.surface0,
      surface1: palette.surface1,
      subtext0: palette.subtext0,
      subtext1: palette.subtext1,
      text: palette.text,
      textStrong,
    },
    nativeColors: {
      primary: palette.blue,
      background: palette.base,
      card: palette.surface1,
      text: palette.text,
      border: palette.overlay0,
      notification: palette.red,
    },
    isDark: theme.isDark,
  };
};

const defaultTokens = buildThemeTokens("light", "peach");

export const themeTokens$ = observable(defaultTokens);

export const styling$ = observable({
  mainContentRadius: 0, // 55 is the radius of iphone 14 pro max corners
  tabBarBlurEnabled: true,
});

const STYLING_STORAGE_KEY = "stylingStore";
let stylingHydrated = false;
let stylingReady = false;
let stylingPromise: Promise<void> | null = null;

async function hydrateStylingInternal() {
  try {
    const raw = await AsyncStorage.getItem(STYLING_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { tabBarBlurEnabled?: boolean };
      if (parsed.tabBarBlurEnabled !== undefined) {
        styling$.tabBarBlurEnabled.set(parsed.tabBarBlurEnabled);
      }
    }
  } catch (err) {
    console.warn("Failed to load styling store", err);
  } finally {
    stylingHydrated = true;
    stylingReady = true;
    const snapshot = { tabBarBlurEnabled: styling$.tabBarBlurEnabled.get() };
    AsyncStorage.setItem(STYLING_STORAGE_KEY, JSON.stringify(snapshot)).catch((err) => {
      console.warn("Failed to persist styling store", err);
    });
  }
}

export async function ensureStylingHydrated() {
  if (stylingHydrated) return;
  stylingPromise ??= hydrateStylingInternal();
  await stylingPromise;
}

observe(() => {
  if (!stylingReady) return;
  const snapshot = { tabBarBlurEnabled: styling$.tabBarBlurEnabled.get() };
  AsyncStorage.setItem(STYLING_STORAGE_KEY, JSON.stringify(snapshot)).catch((err) => {
    console.warn("Failed to persist styling store", err);
  });
});

interface SettingsState {
  general: {
    timezoneMode: "auto" | "manual";
    timezone: string;
    startWeekOn: string;
    allowQuickTasks: boolean;
  };
  personalization: {
    theme: ThemeKey;
    accent: AccentKey;
  };
  productivity: {
    notificationsEnabled: boolean;
  };
}

const defaultTimezone = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Local Timezone";
  } catch (err) {
    return "Local Timezone";
  }
})();

export const settings$ = observable<SettingsState>({
  general: {
    timezoneMode: "auto",
    timezone: defaultTimezone,
    startWeekOn: "Sunday",
    allowQuickTasks: true,
  },
  personalization: {
    theme: "light",
    accent: "peach",
  },
  productivity: {
    notificationsEnabled: false,
  },
});

const getSystemTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Local Timezone";
  } catch (err) {
    return "Local Timezone";
  }
};

const applyTimezoneFromSettings = () => {
  const mode = settings$.general.timezoneMode.get();
  const timezoneValue = mode === "manual" ? settings$.general.timezone.get() : getSystemTimezone();
  if (!timezoneValue) return;
  try {
    dayjs.tz.setDefault(timezoneValue);
  } catch (err) {
    console.warn("Failed to apply timezone", err);
  }
};

const applyThemeFromSettings = () => {
  const themeKey = settings$.personalization.theme.get();
  const accentKey = settings$.personalization.accent.get();
  themeTokens$.assign(buildThemeTokens(themeKey, accentKey));
};

const SETTINGS_STORAGE_KEY = "settingsStore";
let settingsHydrated = false;
let settingsReady = false;
let settingsPromise: Promise<void> | null = null;

async function hydrateSettingsInternal() {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SettingsState>;
      if (parsed?.general) settings$.general.assign(parsed.general);
      if (parsed?.personalization) settings$.personalization.assign(parsed.personalization);
      if (parsed?.productivity) settings$.productivity.assign(parsed.productivity);
    }
  } catch (err) {
    console.warn("Failed to load settings store", err);
  } finally {
    settingsHydrated = true;
    settingsReady = true;
    const snapshot = settings$.get();
    AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(snapshot)).catch((err) => {
      console.warn("Failed to persist settings store", err);
    });
    applyThemeFromSettings();
    applyTimezoneFromSettings();
  }
}

export async function ensureSettingsHydrated() {
  if (settingsHydrated) return;
  settingsPromise ??= hydrateSettingsInternal();
  await settingsPromise;
}

observe(() => {
  settings$.personalization.theme.get();
  settings$.personalization.accent.get();
  settings$.general.timezoneMode.get();
  settings$.general.timezone.get();
  if (!settingsReady) return;
  applyThemeFromSettings();
  applyTimezoneFromSettings();
  const snapshot = settings$.get();
  AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(snapshot)).catch((err) => {
    console.warn("Failed to persist settings store", err);
  });
});
