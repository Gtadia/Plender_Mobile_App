import { observable, observe } from "@legendapp/state";
import * as SQLite from "expo-sqlite";

export interface ActiveTimerState {
  taskId: number;
  startedAt: number;
  baseSeconds: number;
}

const STORAGE_KEY = "activeTimerState";
const kvDb = SQLite.openDatabaseSync("activeTimerCache.db");
kvDb.execAsync("CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)").catch(() => {});

export const activeTimer$ = observable<ActiveTimerState | null>(null);

let hydrated = false;
let readyToPersist = false;

observe(() => {
  const value = activeTimer$.get();
  if (!readyToPersist) {
    return;
  }
  const payload = value ? JSON.stringify(value) : null;
  if (payload) {
    kvDb.runAsync("INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)", [STORAGE_KEY, payload]).catch((err) =>
      console.warn("Failed to persist active timer", err)
    );
  } else {
    kvDb.runAsync("DELETE FROM kv WHERE key = ?", [STORAGE_KEY]).catch((err) =>
      console.warn("Failed to clear active timer", err)
    );
  }
});

export async function hydrateActiveTimer() {
  if (hydrated) return;
  hydrated = true;
  try {
    const rows = await kvDb.getAllAsync("SELECT value FROM kv WHERE key = ?", [STORAGE_KEY]);
    const raw = rows?.[0]?.value as string | undefined;
    if (raw) activeTimer$.set(JSON.parse(raw));
  } catch (err) {
    console.warn("Failed to load active timer", err);
  } finally {
    readyToPersist = true;
  }
}

export function clearActiveTimerState() {
  activeTimer$.set(null);
  if (!readyToPersist) {
    kvDb.runAsync("DELETE FROM kv WHERE key = ?", [STORAGE_KEY]).catch((err) =>
      console.warn("Failed to clear active timer", err)
    );
  }
}
