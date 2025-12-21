import { observable, observe } from "@legendapp/state";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateEvent } from "./database";

export interface DirtyTaskRecord {
  timeSpent: number;
  updatedAt: number;
}

const STORAGE_KEY = "dirtyTasks";

export const dirtyTasks$ = observable<Record<number, DirtyTaskRecord>>({});

let hydrated = false;
let ready = false;
let hydratePromise: Promise<void> | null = null;

async function hydrateInternal() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<number, DirtyTaskRecord>;
      dirtyTasks$.set(parsed);
    }
  } catch (err) {
    console.warn("Failed to load dirty tasks cache", err);
  } finally {
    hydrated = true;
    ready = true;
  }
}

export async function ensureDirtyTasksHydrated() {
  if (hydrated) return;
  hydratePromise ??= hydrateInternal();
  await hydratePromise;
}

observe(() => {
  if (!ready) return;
  const snapshot = dirtyTasks$.get();
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)).catch((err) => {
    console.warn("Failed to persist dirty tasks cache", err);
  });
});

export function getDirtySnapshot() {
  return dirtyTasks$.get();
}

export function getDirtyEntry(id: number) {
  return dirtyTasks$[id]?.get?.();
}

export function markTaskDirty(id: number, timeSpent: number) {
  dirtyTasks$[id].set({
    timeSpent,
    updatedAt: Date.now(),
  });
}

export function clearDirtyTask(id: number) {
  dirtyTasks$[id].delete();
}

export async function flushDirtyTasksToDB() {
  await ensureDirtyTasksHydrated();
  const snapshot = dirtyTasks$.get();
  const ids = Object.keys(snapshot);
  for (const id of ids) {
    const record = snapshot[Number(id)];
    if (!record) continue;
    await updateEvent({
      id: Number(id),
      timeSpent: record.timeSpent,
    });
  }
  dirtyTasks$.set({});
}
