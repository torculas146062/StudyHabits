import { fromDateKey } from './date';
import type { Habit, Session, SessionStatus, StudyData } from './types';

/** The weekly target the dashboard measures progress against. */
export const WEEKLY_GOAL_MINUTES = 600;

export function isRestDay(data: StudyData, date: string): boolean {
  return data.restDays.includes(date);
}

/** Habits scheduled for a date. A rest day schedules nothing at all. */
export function habitsOn(data: StudyData, date: string): Habit[] {
  if (isRestDay(data, date)) {
    return [];
  }

  const weekday = fromDateKey(date).getDay();

  return data.habits.filter((habit) => habit.weekdays.includes(weekday));
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

export function habitStatusOn(
  sessions: Session[],
  habitId: string,
  date: string
): SessionStatus | undefined {
  return sessionsOn(sessions, date).find(
    (session) => session.habitId === habitId
  )?.status;
}

export function completedHabitCount(
  data: StudyData,
  date: string
): number {
  const sessions = sessionsOn(data.sessions, date);

  return habitsOn(data, date).filter((habit) =>
    sessions.some(
      (session) => session.habitId === habit.id && session.status === 'done'
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

/** A day is worth a marker when habits are scheduled or an event falls on it. */
export function hasPlanOn(data: StudyData, date: string): boolean {
  return (
    data.events.some((event) => event.date === date) ||
    habitsOn(data, date).length > 0
  );
}

export function eventsOn(data: StudyData, date: string) {
  return data.events.filter((event) => event.date === date);
}
