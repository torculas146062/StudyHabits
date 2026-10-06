export type Subject = {
  id: string;
  name: string;
  /** Minutes the user aims to study this subject per day. */
  goalMinutes: number;
};

export type Habit = {
  id: string;
  title: string;
  subjectId: string;
  /** Weekdays the habit is scheduled on, 0 = Sunday. */
  weekdays: number[];
};

export type SessionStatus = 'done' | 'skipped';

export type Session = {
  id: string;
  subjectId: string;
  /** Set when the session came from ticking a habit rather than the timer. */
  habitId?: string;
  /** Local calendar day as `YYYY-MM-DD`. */
  date: string;
  minutes: number;
  status: SessionStatus;
};

export type StudyEvent = {
  id: string;
  title: string;
  date: string;
};

export type StudyData = {
  subjects: Subject[];
  habits: Habit[];
  sessions: Session[];
  events: StudyEvent[];
  /** Days the user marked as a break, so habits do not apply. */
  restDays: string[];
};

export const EMPTY_STUDY_DATA: StudyData = {
  subjects: [],
  habits: [],
  sessions: [],
  events: [],
  restDays: [],
};

export const SUBJECT_GOAL_FALLBACK = 30;

export function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
