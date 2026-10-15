export type Subject = {
  id: string;
  name: string;
  /** Minutes the user aims to study this subject per day. */
  goalMinutes: number;
};

export type Task = {
  id: string;
  title: string;
  subjectId: string;
  /** Weekdays the task repeats on, 0 = Sunday. Empty for a one-off task. */
  weekdays: number[];
  /** Local calendar day for a one-off task, as `YYYY-MM-DD`. */
  date?: string;
  /** Minutes a check-in should log; falls back to the subject's daily goal. */
  minutes?: number;
  /** Set on preparation tasks so they count toward an exam. */
  eventId?: string;
  /** True for the task the focus timer created for a day's session. */
  timer?: boolean;
  /** Local `HH:mm` a reminder should fire at, when one is set. */
  reminderTime?: string;
};

export type SessionStatus = 'done' | 'skipped';

export type Session = {
  id: string;
  subjectId: string;
  /** Set when the session came from ticking a task rather than the timer. */
  taskId?: string;
  /** Set when the session was preparation for an exam. */
  eventId?: string;
  /** Local calendar day as `YYYY-MM-DD`. */
  date: string;
  minutes: number;
  status: SessionStatus;
};

export type StudyEventKind = 'event' | 'exam';

export type StudyEvent = {
  id: string;
  title: string;
  date: string;
  /** `exam` events carry a preparation target and a subject. */
  kind?: StudyEventKind;
  subjectId?: string;
  /** Minutes of study the exam preparation should add up to. */
  targetMinutes?: number;
  /** Local `HH:mm` a reminder should fire at, when one is set. */
  reminderTime?: string;
};

export type StudyData = {
  subjects: Subject[];
  tasks: Task[];
  sessions: Session[];
  events: StudyEvent[];
  /** Days the user marked as a break, so tasks do not apply. */
  restDays: string[];
};

export const EMPTY_STUDY_DATA: StudyData = {
  subjects: [],
  tasks: [],
  sessions: [],
  events: [],
  restDays: [],
};

export const SUBJECT_GOAL_FALLBACK = 30;

export function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
