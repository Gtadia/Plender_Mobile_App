import { AppState, AppStateStatus, Alert, Platform } from 'react-native';
import moment from 'moment';
import { CurrentTaskID$, tasks$ } from './stateManager';
import { updateEvent } from './database';
import { activeTimer$, hydrateActiveTimer, clearActiveTimerState } from './activeTimerStore';
import { ensureDirtyTasksHydrated, markTaskDirty } from './dirtyTaskStore';
import { observable } from '@legendapp/state';

type RunningTimer = {
  taskId: number;
  startedAt: number;
  baseSeconds: number;
};

class TimerManager {
  private ticker?: ReturnType<typeof setInterval>;
  private running?: RunningTimer;
  private initialized = false;
  private watchdog?: ReturnType<typeof setInterval>;
  private heartbeat?: ReturnType<typeof setInterval>;

  constructor() {
    AppState.addEventListener('change', this.handleAppStateChange);
    // Global heartbeat to keep UI in sync even if ticker gets cleared
    this.heartbeat = setInterval(() => {
      uiTick$.set((v) => v + 1);
      if (this.running) {
        this.pushUpdate();
      }
    }, 1000);
  }

  private handleAppStateChange = (_state: AppStateStatus) => {
    // Keep ticker alive across inactive/background to avoid pauses when switching tabs
    if (this.running) {
      this.startTicker();
      this.pushUpdate();
    }
  };

  async init() {
    if (this.initialized) return;
    this.initialized = true;
    await ensureDirtyTasksHydrated();
    await hydrateActiveTimer();
    const row = activeTimer$.get();
    if (row) {
      this.running = row;
      CurrentTaskID$.set(row.taskId);
      this.startTicker();
      this.pushUpdate();
    }
    // Watchdog to restart ticker if it ever gets cleared unexpectedly
    this.watchdog = setInterval(() => {
      if (this.running && !this.ticker) {
        this.startTicker();
        this.pushUpdate();
      }
    }, 3000);
  }

  private startTicker() {
    this.stopTicker();
    this.ticker = setInterval(() => this.pushUpdate(), 1000);
  }

  private stopTicker() {
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = undefined;
    }
  }

  private computeTotalSeconds(): number {
    if (!this.running) return 0;
    const elapsed = Math.max(0, Math.floor((Date.now() - this.running.startedAt) / 1000));
    return this.running.baseSeconds + elapsed;
  }

  forceSync() {
    if (!this.running) return;
    this.startTicker();
    this.pushUpdate();
  }

  private pushUpdate() {
    if (!this.running) return;
    const total = this.computeTotalSeconds();
    const node = tasks$.entities[this.running.taskId];
    const { startKey, startDaySeconds, todayKey, todaySeconds } = this.computeDaySplit(total);
    // Keep entity showing total for general views
    node?.timeSpent?.set?.(total);
    // Persist per-day
    if (todaySeconds > 0) {
      markTaskDirty(this.running.taskId, todaySeconds, todayKey);
    }
    markTaskDirty(this.running.taskId, startDaySeconds, startKey);
  }

  async start(taskId: number) {
    await this.init();
    await this.finalizeRunning({ preserveCurrentId: true });

    const node = tasks$.entities[taskId];
    const baseSeconds = node?.timeSpent?.get?.() ?? 0;
    const startedAt = Date.now();
    this.running = { taskId, baseSeconds, startedAt };
    activeTimer$.set(this.running);
    CurrentTaskID$.set(taskId);
    this.startTicker();
    this.pushUpdate();
  }

  async stop(opts?: { splitAcrossDays?: boolean }) {
    await this.init();
    await this.finalizeRunning(opts);
  }

  private computeDaySplit(totalSeconds: number) {
    if (!this.running) {
      const todayKey = moment().format('YYYY-MM-DD');
      return { startKey: todayKey, todayKey, startDaySeconds: totalSeconds, todaySeconds: 0 };
    }
    const startMoment = moment(this.running.startedAt);
    const nowMoment = moment();
    const startKey = startMoment.format('YYYY-MM-DD');
    const todayKey = nowMoment.format('YYYY-MM-DD');
    const elapsed = Math.max(0, Math.floor((Date.now() - this.running.startedAt) / 1000));
    const endOfStart = startMoment.clone().endOf('day');
    const secondsToMidnight = Math.max(0, Math.floor(endOfStart.diff(startMoment, 'seconds')));
    if (startKey === todayKey || elapsed <= secondsToMidnight) {
      return { startKey, todayKey, startDaySeconds: totalSeconds, todaySeconds: 0 };
    }
    const startDaySeconds = this.running.baseSeconds + secondsToMidnight;
    const todaySeconds = Math.max(0, totalSeconds - startDaySeconds);
    return { startKey, todayKey, startDaySeconds, todaySeconds };
  }

  private async finalizeRunning(opts?: { preserveCurrentId?: boolean; splitAcrossDays?: boolean }) {
    if (!this.running) return;
    const total = this.computeTotalSeconds();
    const finishedTaskId = this.running.taskId;
    const split = opts?.splitAcrossDays ?? false;

    const { startKey, todayKey, startDaySeconds, todaySeconds } = this.computeDaySplit(total);
    if (split && todaySeconds > 0) {
      // store per-day values
      markTaskDirty(finishedTaskId, startDaySeconds, startKey);
      markTaskDirty(finishedTaskId, todaySeconds, todayKey);
      // persist sum to DB so total stays accurate
      await updateEvent({
        id: finishedTaskId,
        timeSpent: startDaySeconds + todaySeconds,
      });
      const node = tasks$.entities[finishedTaskId];
      node?.timeSpent?.set?.(startDaySeconds + todaySeconds);
    } else {
      // no split, all time goes to start day
      markTaskDirty(finishedTaskId, total, startKey);
      await updateEvent({
        id: finishedTaskId,
        timeSpent: total,
      });
      const node = tasks$.entities[finishedTaskId];
      node?.timeSpent?.set?.(total);
    }
    this.stopTicker();
    this.running = undefined;
    clearActiveTimerState();
    if (!opts?.preserveCurrentId) {
      CurrentTaskID$.set(-1);
    }
  }
}

const manager = new TimerManager();

export const initTimerService = () => manager.init();
export const startTaskTimer = (taskId: number) => manager.start(taskId);
export const stopTaskTimer = (opts?: { splitAcrossDays?: boolean }) => manager.stop(opts);
export const syncRunningTimer = () => manager.forceSync();
export const uiTick$ = observable(0);
