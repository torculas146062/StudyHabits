const pad = (value: number) => String(value).padStart(2, '0');

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** A 24-hour local time of day, as `HH:mm`. */
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isTimeKey(value: string): boolean {
  return TIME_PATTERN.test(value);
}

/** `HH:mm` rendered for the device locale, e.g. `9:30 AM`. */
export function timeLabel(time: string): string {
  if (!isTimeKey(time)) {
    return time;
  }

  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** The local moment a `date` + `HH:mm` reminder fires at. */
export function reminderDate(dateKeyValue: string, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = fromDateKey(dateKeyValue);
  date.setHours(hours, minutes, 0, 0);

  return date;
}

/** The calendar days of the last `count` days, oldest first, ending on `end`. */
export function lastDays(count: number, end = new Date()): Date[] {
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(end);
    day.setDate(end.getDate() - (count - 1 - index));
    return day;
  });
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

/** Midday keeps a date key off the daylight-saving boundaries. */
export function fromDateKey(key: string): Date {
  return new Date(`${key}T12:00:00`);
}

export function formatDay(key: string): string {
  return fromDateKey(key).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function formatShortDay(key: string): string {
  return fromDateKey(key).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatMonth(date = new Date()): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** The Sunday-to-Saturday week containing `date`. */
export function weekOf(date = new Date()): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

export function minutesLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);

  return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

/**
 * Consecutive days with a finished session. An untouched today does not break a
 * run, so the count starts from yesterday when nothing is logged today.
 */
export function streakLength(sessionDates: Iterable<string>): number {
  const studied = new Set(sessionDates);
  const date = new Date();

  if (!studied.has(dateKey(date))) {
    date.setDate(date.getDate() - 1);
  }

  let count = 0;

  while (studied.has(dateKey(date))) {
    count += 1;
    date.setDate(date.getDate() - 1);
  }

  return count;
}

export function greeting(date = new Date()): string {
  const hour = date.getHours();

  if (hour < 12) {
    return 'Good morning';
  }

  return hour < 18 ? 'Good afternoon' : 'Good evening';
}
