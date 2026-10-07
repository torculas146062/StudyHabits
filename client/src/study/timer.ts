/** A pomodoro countdown is always in one of these three phases. */
export type TimerPhase = 'focus' | 'shortBreak' | 'longBreak';

/** Focus-block lengths the user can pick, in minutes. */
export const FOCUS_DURATIONS = [25, 45, 60];

export const SHORT_BREAK_MINUTES = 5;
export const LONG_BREAK_MINUTES = 15;
export const POMODOROS_PER_LONG_BREAK = 4;

/** Counts a number of seconds down as `MM:SS`. */
export function formatClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

/** How long a phase runs; only a focus block uses the chosen focus length. */
export function phaseMinutes(phase: TimerPhase, focusMinutes: number): number {
  if (phase === 'longBreak') {
    return LONG_BREAK_MINUTES;
  }

  if (phase === 'shortBreak') {
    return SHORT_BREAK_MINUTES;
  }

  return focusMinutes;
}

/** The break that follows `completed` focus blocks — the long one every fourth. */
export function breakAfter(completed: number): TimerPhase {
  return completed % POMODOROS_PER_LONG_BREAK === 0
    ? 'longBreak'
    : 'shortBreak';
}

/**
 * Focus blocks finished in the current set (0-4). A long break only starts once
 * four are done, so it always reports a full set.
 */
export function setProgress(
  completed: number,
  phase: TimerPhase
): number {
  if (phase === 'longBreak') {
    return POMODOROS_PER_LONG_BREAK;
  }

  return completed % POMODOROS_PER_LONG_BREAK;
}

/**
 * How much of the current focus block has elapsed, in minutes (fractional).
 * Breaks contribute nothing, and an untouched block contributes zero, so this
 * can be added to logged minutes to show a goal filling live while running.
 */
export function liveFocusMinutes(
  phase: TimerPhase,
  focusMinutes: number,
  secondsLeft: number
): number {
  if (phase !== 'focus') {
    return 0;
  }

  const elapsed = phaseMinutes(phase, focusMinutes) * 60 - secondsLeft;

  return Math.max(0, elapsed / 60);
}
