import {
  showPausedSyncNotification,
  updateSyncNotificationProgress,
} from './notifications';

export class EngineController {
  private _isPaused = false;
  private _wasDismissed = false;
  private _resumePromise: Promise<boolean> | null = null;
  private _resumeResolver: ((shouldContinue: boolean) => void) | null = null;
  private _currentProgress = { current: 0, total: 0 };
  private _listeners = new Set<(isPaused: boolean) => void>();

  isPaused(): boolean {
    return this._isPaused;
  }

  wasDismissed(): boolean {
    return this._wasDismissed;
  }

  setProgress(current: number, total: number) {
    this._currentProgress = { current, total };
  }

  getProgress() {
    return this._currentProgress;
  }

  addListener(listener: (isPaused: boolean) => void) {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  private _notify() {
    for (const listener of this._listeners) {
      try {
        listener(this._isPaused);
      } catch (err) {
        console.error('[EngineController] Listener error:', err);
      }
    }
  }

  pause() {
    if (this._isPaused) return;
    this._isPaused = true;
    this._wasDismissed = false;
    this._resumePromise = new Promise<boolean>((resolve) => {
      this._resumeResolver = resolve;
    });
    this._notify();
    void showPausedSyncNotification(this._currentProgress.current, this._currentProgress.total);
    console.log('[EngineController] Engine paused at progress:', this._currentProgress);
  }

  resume() {
    if (!this._isPaused) return;
    this._isPaused = false;
    this._wasDismissed = false;
    const resolver = this._resumeResolver;
    this._resumePromise = null;
    this._resumeResolver = null;
    resolver?.(true);
    this._notify();
    void updateSyncNotificationProgress(this._currentProgress.current, this._currentProgress.total, true);
    console.log('[EngineController] Engine resumed.');
  }

  dismiss() {
    if (!this._isPaused) return;
    this._isPaused = false;
    this._wasDismissed = true;
    const resolver = this._resumeResolver;
    this._resumePromise = null;
    this._resumeResolver = null;
    resolver?.(false);
    this._notify();
    console.log('[EngineController] Paused notification dismissed. Engine stopped.');
  }

  async waitForResume(): Promise<boolean> {
    if (!this._isPaused || !this._resumePromise) {
      return true;
    }
    return await this._resumePromise;
  }

  reset() {
    this._wasDismissed = false;
    if (this._isPaused) {
      this.resume();
    }
  }
}

export const engineControl = new EngineController();
