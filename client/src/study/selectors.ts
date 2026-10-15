import { dateKey, fromDateKey, isTimeKey, lastDays, todayKey } from './date';
import type { Session, SessionStatus, StudyData, StudyEvent, Task } from './types';

/** The weekly target the dashboard measures progress against. */
export const WEEKLY_GOAL_MINUTES = 600;

export function isRestDay(data: StudyData, date: string): boolean {
  return data.restDays.includes(date);
}

/** Tasks scheduled for a date. A rest day schedules nothing at all. */
export function tasksOn(data: StudyData, date: string): Task[] {
  if (isRestDay(data, date)) {
    return [];
  }

  const weekday = fromDateKey(date).getDay();

  return data.tasks.filter((task) =>
    task.date ? task.date === date : task.weekdays.includes(weekday)
  );
}

/**
 * The focus timer keeps one task per subject per day, so pausing and resuming
 * never creates a second entry for the same session.
 */
export function timerTaskOn(
  data: StudyData,
  subjectId: string,
  date: string
): Task | undefined {
  return data.tasks.find(
    (task) => task.timer && task.date === date && task.subjectId === subjectId
  );
}

/** Whole days from `from` until `date`; negative when the date has passed. */export function daysUntil(date: string, from = todayKey()): number {
  const difference =
    fromDateKey(date).getTime() - fromDateKey(from).getTime();

  return Math.round(difference / 86400000);
}

/** Exams on or after `from`, soonest first. */
export function upcomingExams(
  data: StudyData,
  from = todayKey(),
  limit = 3
): StudyEvent[] {
  return data.events
    .filter((event) => event.kind === 'exam' && event.date >= from)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

/** Minutes of finished preparation toward an exam. */
export function examPreparedMinutes(
  sessions: Session[],
  eventId: string
): number {
  return completedSessions(
    sessions.filter((session) => session.eventId === eventId)
  ).reduce((total, session) => total + session.minutes, 0);
}

export function sessionsOn(sessions: Session[], date: string): Session[] {
  return sessions.filter((session) => session.date === date);
}

export function completedSessions(sessions: Session[]): Session[] {
  return sessions.filter((session) => session.status === 'done');
}

export function minutesOn(sessions: Session[], date: string): number {
  return completedSessions(sessionsOn(sessions, date)).reduce(
    (total, session) => total + session.minutes,
    0
  );
}

export function subjectMinutesOn(
  sessions: Session[],
  subjectId: string,
  date: string
): number {
  return completedSessions(
    sessionsOn(sessions, date).filter(
      (session) => session.subjectId === subjectId
    )
  ).reduce((total, session) => total + session.minutes, 0);
}

export function taskStatusOn(
  sessions: Session[],
  taskId: string,
  date: string
): SessionStatus | undefined {
  return sessionsOn(sessions, date).find(
    (session) => session.taskId === taskId
  )?.status;
}

export function completedTaskCount(data: StudyData, date: string): number {
  const sessions = sessionsOn(data.sessions, date);

  return tasksOn(data, date).filter((task) =>
    sessions.some(
      (session) => session.taskId === task.id && session.status === 'done'
    )
  ).length;
}

/** Minutes finished in the seven days ending on `date`. */
export function weeklyMinutes(sessions: Session[], date: string): number {
  const end = fromDateKey(date);

  return completedSessions(sessions)
    .filter((session) => {
      const day = fromDateKey(session.date);
      const difference = (end.getTime() - day.getTime()) / 86400000;

      return difference >= 0 && difference < 7;
    })
    .reduce((total, session) => total + session.minutes, 0);
}

export function subjectTotalMinutes(
  sessions: Session[],
  subjectId: string
): number {
  return completedSessions(
    sessions.filter((session) => session.subjectId === subjectId)
  ).reduce((total, session) => total + session.minutes, 0);
}

export function recentSessions(
  sessions: Session[],
  subjectId: string,
  limit = 5
): Session[] {
  return sessions
    .filter((session) => session.subjectId === subjectId)
    .slice(-limit)
    .reverse();
}

export function studiedDates(sessions: Session[]): string[] {
  return completedSessions(sessions).map((session) => session.date);
}

export function hasStudyOn(sessions: Session[], date: string): boolean {
  return sessions.some(
    (session) => session.date === date && session.status === 'done'
  );
}

/** A day is worth a marker when tasks are scheduled or an event falls on it. */
export function hasPlanOn(data: StudyData, date: string): boolean {
  return (
    data.events.some((event) => event.date === date) ||
    tasksOn(data, date).length > 0
  );
}

export function eventsOn(data: StudyData, date: string) {
  return data.events.filter((event) => event.date === date);
}

/** Minutes finished on each of `days`, oldest first. */
export function minutesByDay(
  sessions: Session[],
  days: Date[]
): { date: string; minutes: number }[] {
  return days.map((day) => {
    const key = dateKey(day);

    return { date: key, minutes: minutesOn(sessions, key) };
  });
}

/** Minutes finished on each of the last `count` days, ending on `date`. */
export function recentMinutes(
  sessions: Session[],
  date: string,
  count = 7
): { date: string; minutes: number }[] {
  return minutesByDay(sessions, lastDays(count, fromDateKey(date)));
}

export function totalMinutes(sessions: Session[]): number {
  return completedSessions(sessions).reduce(
    (total, session) => total + session.minutes,
    0
  );
}

export function completedSessionCount(sessions: Session[]): number {
  return completedSessions(sessions).length;
}

export type Reminder = {
  id: string;
  kind: 'task' | 'event';
  title: string;
  /** Local `HH:mm`. */
  time: string;
  detail: string;
  /** A task already answered today still shows, marked as done. */
  done: boolean;
};

/**
 * The timed tasks and events for a date, earliest first. This is what the
 * dashboard lists and what the notification scheduler mirrors.
 */
export function remindersOn(data: StudyData, date: string): Reminder[] {
  const sessions = sessionsOn(data.sessions, date);

  const taskReminders = tasksOn(data, date)
    .filter((task) => task.reminderTime && isTimeKey(task.reminderTime))
    .map<Reminder>((task) => {
      const subject = data.subjects.find((item) => item.id === task.subjectId);

      return {
        id: task.id,
        kind: 'task',
        title: task.title,
        time: task.reminderTime as string,
        detail: subject ? `Task · ${subject.name}` : 'Task',
        done: sessions.some(
          (session) => session.taskId === task.id && session.status === 'done'
        ),
      };
    });

  const eventReminders = eventsOn(data, date)
    .filter((event) => event.reminderTime && isTimeKey(event.reminderTime))
    .map<Reminder>((event) => ({
      id: event.id,
      kind: 'event',
      title: event.title,
      time: event.reminderTime as string,
      detail: 'Event',
      done: false,
    }));

  return [...taskReminders, ...eventReminders].sort((a, b) =>
    a.time.localeCompare(b.time)
  );
}
