import React, { useEffect } from 'react';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { Text, ScreenView } from '@/components/Themed';
import { horizontalPadding } from '@/constants/globalThemeVar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';

import { observable, computed } from '@legendapp/state';
import { observer } from '@legendapp/state/react';

// ---------- Types ----------
type Task = {
  id: string;
  title: string;
  categoryId: string;
  dueISO?: string;
  goalSeconds: number;     // target (e.g., 5 * 3600)
  spentSeconds: number;    // persisted progress
  status: 'idle' | 'running' | 'paused';
  startedAt?: number;      // epoch ms when last started
};

type Category = { id: string; name: string; color: string };

// ---------- Store ----------
const tasks$ = observable({
  runningTaskId: null as string | null,
  byId: {} as Record<string, Task>,
  order: [] as string[],
  categories: {
    school: { id: 'school', name: 'School Assignments', color: '#ef4444' },
    chores: { id: 'chores', name: 'Daily Chores', color: '#f59e0b' },
  } as Record<string, Category>,
});

// Seed some demo data once
if (Object.keys(tasks$.byId.peek()).length === 0) {
  const seed: Task[] = [
    {
      id: 't1',
      title: 'CS3511 Algo Homework',
      categoryId: 'school',
      dueISO: dayjs().format(),
      goalSeconds: 5 * 3600,
      spentSeconds: 4 * 3600 + 32 * 60 + 30,
      status: 'paused',
    },
    { id: 't2', title: 'Lab Report', categoryId: 'school', goalSeconds: 2 * 3600, spentSeconds: 1 * 3600 + 48 * 60, status: 'paused' },
    { id: 't3', title: 'Read Ch. 7', categoryId: 'school', goalSeconds: 2 * 3600, spentSeconds: 1 * 3600 + 48 * 60, status: 'paused' },
    { id: 't4', title: 'Problem Set', categoryId: 'school', goalSeconds: 2 * 3600, spentSeconds: 1 * 3600 + 48 * 60, status: 'paused' },

    { id: 't5', title: 'Do Laundry', categoryId: 'chores', goalSeconds: 2 * 3600, spentSeconds: 1 * 3600 + 48 * 60, status: 'paused' },
    { id: 't6', title: 'Groceries', categoryId: 'chores', goalSeconds: 2 * 3600, spentSeconds: 1 * 3600 + 48 * 60, status: 'paused' },
    { id: 't7', title: 'Clean Desk', categoryId: 'chores', goalSeconds: 2 * 3600, spentSeconds: 1 * 3600 + 48 * 60, status: 'paused' },
    { id: 't8', title: 'Take out Trash', categoryId: 'chores', goalSeconds: 2 * 3600, spentSeconds: 1 * 3600 + 48 * 60, status: 'paused' },
  ];
  seed.forEach((t) => (tasks$.byId[t.id] = t));
  tasks$.order.set(seed.map((t) => t.id));
}

// Global clock that only ticks when something is running
const now$ = observable(Date.now());
let tick: NodeJS.Timer | null = null;

// ---------- Actions ----------
function pauseRunning() {
  const curr = tasks$.runningTaskId.peek();
  if (!curr) return;
  const t$ = tasks$.byId[curr];
  const started = t$.startedAt.peek();
  if (started) {
    const delta = Math.floor((Date.now() - started) / 1000);
    t$.spentSeconds.set((prev) => prev + delta);
  }
  t$.status.set('paused');
  t$.startedAt.delete();
  tasks$.runningTaskId.set(null);
  if (tick) {
    clearInterval(tick);
    tick = null;
  }
}

function startTask(id: string) {
  const already = tasks$.runningTaskId.peek();
  if (already && already !== id) pauseRunning();
  const t$ = tasks$.byId[id];
  t$.status.set('running');
  t$.startedAt.set(Date.now());
  tasks$.runningTaskId.set(id);

  if (!tick) {
    tick = setInterval(() => now$.set(Date.now()), 1000);
  }
}

function toggleTask(id: string) {
  const t$ = tasks$.byId[id];
  const status = t$.status.peek();
  if (status === 'running') {
    pauseRunning();
  } else {
    startTask(id);
  }
}

// ---------- Computeds ----------
const runningTask$ = computed(() => {
  const id = tasks$.runningTaskId.get();
  return id ? tasks$.byId[id] : null;
});

// liveSpent(task): spentSeconds + (now - startedAt) while running
function liveSpentSeconds(taskId: string) {
  return computed(() => {
    const t$ = tasks$.byId[taskId];
    const base = t$.spentSeconds.get();
    if (t$.status.get() === 'running' && t$.startedAt.get()) {
      now$.get(); // subscribe to clock
      const delta = Math.floor((Date.now() - (t$.startedAt.get() as number)) / 1000);
      return base + delta;
    }
    return base;
  });
}

function percentOf(spent: number, goal: number) {
  if (goal <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((spent / goal) * 100)));
}

function hms(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${h}:${pad(m)}:${pad(sec)}`;
}

// category rollups
const categorySummary$ = computed(() => {
  const ids = tasks$.order.get();
  const map: Record<string, { goal: number; spent: number; tasks: string[] }> = {};
  ids.forEach((id) => {
    const t = tasks$.byId[id].get();
    if (!map[t.categoryId]) map[t.categoryId] = { goal: 0, spent: 0, tasks: [] };
    map[t.categoryId].goal += t.goalSeconds;
    map[t.categoryId].spent += t.spentSeconds;
    map[t.categoryId].tasks.push(id);
  });
  return map;
});

// ---------- UI ----------
const CurrentTaskView = observer(function CurrentTaskView() {
  const rt$ = runningTask$.get();
  if (!rt$) {
    return (
      <View style={{ width: '100%', paddingHorizontal: 30, marginTop: 12 }}>
        <View style={[taskStyles.container, { backgroundColor: '#d1d5db' }]}>
          <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: 6 }}>No Task Running</Text>
          <Text>Start a task to see it running here!</Text>
        </View>
      </View>
    );
  }

  const id = rt$.id.peek();
  const live = liveSpentSeconds(id);

  const spent = live.get();
  const goal = rt$.goalSeconds.get();
  const pct = percentOf(spent, goal);

  return (
    <View style={{ width: '100%', paddingHorizontal: 30, marginTop: 12 }}>
      <View style={[taskStyles.container, { backgroundColor: '#e11d48' }]}>
        <Text style={{ color: 'white', fontWeight: '700', textAlign: 'center' }}>{rt$.title.get()}</Text>
        <Text style={{ color: 'white', fontWeight: '800', fontSize: 32, textAlign: 'center', marginTop: 6 }}>
          {hms(spent)}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 2 }}>
          {hms(goal)}
        </Text>

        {/* progress bar */}
        <View style={{ marginTop: 10, alignItems: 'center' }}>
          <View style={barStyles.track}>
            <View style={[barStyles.fill, { width: `${pct}%` }]} />
          </View>
          <Text style={{ color: 'white', marginTop: 4 }}>{pct}%</Text>
        </View>
      </View>
    </View>
  );
});

const Section = observer(function Section({ categoryId }: { categoryId: string }) {
  const cat = tasks$.categories[categoryId].get();
  const rollup = categorySummary$.get()[categoryId] ?? { goal: 0, spent: 0, tasks: [] };

  const pct = percentOf(rollup.spent, rollup.goal);
  const total = hms(rollup.goal);

  return (
    <View style={{ paddingHorizontal: 22, marginTop: 16, width: '100%' }}>
      <View style={sectionStyles.header}>
        <Text style={[sectionStyles.heading, { color: cat.color }]}>{cat.name}</Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Text>({pct}%)</Text>
          <Text style={{ fontWeight: '600' }}>{total}</Text>
        </View>
      </View>

      <View style={sectionStyles.card}>
        {rollup.tasks.map((id) => (
          <TaskRow key={id} taskId={id} />
        ))}
      </View>
    </View>
  );
});

const TaskRow = observer(function TaskRow({ taskId }: { taskId: string }) {
  const t$ = tasks$.byId[taskId];
  const live = liveSpentSeconds(taskId);
  const spent = live.get();
  const goal = t$.goalSeconds.get();
  const pct = percentOf(spent, goal);

  const isRunning = t$.status.get() === 'running';

  return (
    <Pressable onPress={() => toggleTask(taskId)} style={rowStyles.row}>
      {/* status pill */}
      <View style={[rowStyles.pill, { backgroundColor: isRunning ? '#16a34a' : '#ef4444' }]} />

      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700' }}>{t$.title.get()}</Text>
        <Text style={{ opacity: 0.6, marginTop: 2 }}>
          {dayjs(t$.dueISO.peek() ?? Date.now()).format('MMMM D, YYYY')}
        </Text>
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontWeight: '700' }}>
          {hms(spent)} / {Math.floor(goal / 3600) > 0 ? `${Math.floor(goal / 3600)}:00:00` : hms(goal)}
        </Text>
        <Text style={{ opacity: 0.6, marginTop: 2 }}>{pct}%</Text>
      </View>
    </Pressable>
  );
});

export default function TabOneScreen() {
  const insets = useSafeAreaInsets();

  // mount/unmount safety for the ticking interval
  useEffect(() => {
    return () => {
      if (tick) clearInterval(tick);
    };
  }, []);

  return (
    <ScreenView style={styles.container}>
      <View style={[styles.titleContainer, { paddingTop: insets.top }]}>
        <Text style={[styles.title]}>Home</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <CurrentTaskView />

        {/* Tasks header */}
        <Text style={{ fontWeight: '800', fontSize: 18, marginTop: 16, marginLeft: 22 }}>Tasks</Text>

        <Section categoryId="school" />
        <Section categoryId="chores" />
        <View style={{ height: 28 }} />
      </ScrollView>
    </ScreenView>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
  titleContainer: { width: '100%' },
  title: { left: horizontalPadding, color: '#000', fontSize: 28, marginLeft: 0, fontWeight: 'bold' },
});

const taskStyles = StyleSheet.create({
  container: {
    maxWidth: 500,
    width: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    height: 150,
  },
});

const barStyles = StyleSheet.create({
  track: { width: '80%', height: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  fill: { height: 16, borderRadius: 8, backgroundColor: 'white' },
});

const sectionStyles = StyleSheet.create({
  header: { paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  heading: { fontWeight: '800' },
  card: { backgroundColor: 'white', borderRadius: 14, paddingVertical: 6, overflow: 'hidden' },
});

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, gap: 10 },
  pill: { width: 6, height: 22, borderRadius: 3 },
});