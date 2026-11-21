export type FocusPhase = 'ready' | 'running' | 'paused' | 'completed';

export interface FocusTimer {
  phase: FocusPhase;
  durationMs: number;
  remainingMs: number;
  startedAt: number | null;
}

export function validMinutes(minutes: number): boolean {
  return Number.isSafeInteger(minutes) && minutes >= 30 && minutes <= 120 &&
    minutes % 10 === 0 && Number.isSafeInteger(minutes * 60_000);
}

export function createTimer(minutes: number): FocusTimer {
  if (!validMinutes(minutes)) throw new Error('Duración no válida');
  return {
    phase: 'ready',
    durationMs: minutes * 60_000,
    remainingMs: minutes * 60_000,
    startedAt: null,
  };
}

export function advanceTimer(timer: FocusTimer, now: number): FocusTimer {
  if (timer.phase !== 'running' || timer.startedAt === null) return timer;
  const remainingMs = Math.max(0, timer.remainingMs - Math.max(0, now - timer.startedAt));
  return {
    ...timer,
    remainingMs,
    startedAt: remainingMs > 0 ? now : null,
    phase: remainingMs > 0 ? 'running' : 'completed',
  };
}

export function startTimer(timer: FocusTimer, now: number): FocusTimer {
  if (timer.phase !== 'ready' && timer.phase !== 'paused') return timer;
  return { ...timer, phase: 'running', startedAt: now };
}

export function pauseTimer(timer: FocusTimer, now: number): FocusTimer {
  const advanced = advanceTimer(timer, now);
  return advanced.phase === 'running'
    ? { ...advanced, phase: 'paused', startedAt: null }
    : advanced;
}

export function formatCountdown(milliseconds: number): string {
  const seconds = Math.ceil(milliseconds / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
