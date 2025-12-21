import { AppState, AppStateStatus } from 'react-native';
import { CurrentTaskID$, tasks$ } from './stateManager';
import { updateEvent } from './database';
import { activeTimer$, hydrateActiveTimer, clearActiveTimerState } from './activeTimerStore';

type RunningTimer = {
  taskId: number;
  startedAt: number;
  baseSeconds: number;
};

class TimerManager {
  private ticker?: ReturnType<typeof setInterval>;
  private running?: RunningTimer;
  private initialized = false;

  constructor() {
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  private handleAppStateChange = (state: AppStateStatus) => {
    if (state === 'active') {
      if (this.running) {
        this.startTicker();
        this.pushUpdate();
      }
    } else {
      this.stopTicker();
    }
  };

  async init() {
    if (this.initialized) return;
    this.initialized = true;
    await hydrateActiveTimer();
    const row = activeTimer$.get();
    if (row) {
      this.running = row;
      CurrentTaskID$.set(row.taskId);
      this.startTicker();
      this.pushUpdate();
    }
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

  private pushUpdate() {
    if (!this.running) return;
    const total = this.computeTotalSeconds();
    const node = tasks$.entities[this.running.taskId];
    node?.timeSpent?.set?.(total);
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

  async stop() {
    await this.init();
    await this.finalizeRunning();
  }

  private async finalizeRunning(opts?: { preserveCurrentId?: boolean }) {
    if (!this.running) return;
    const total = this.computeTotalSeconds();
    await updateEvent({
      id: this.running.taskId,
      timeSpent: total,
    });
    const node = tasks$.entities[this.running.taskId];
    node?.timeSpent?.set?.(total);
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
export const stopTaskTimer = () => manager.stop();
