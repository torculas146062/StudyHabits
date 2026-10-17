import { dateKey, fromDateKey } from './date';
import { createId, type StudyEvent, type Task } from './types';

/** A study block shorter than this is not worth scheduling. */
const MIN_TASK_MINUTES = 5;
/** Preferred length, used to decide how many prep days to use. */
const SESSION_MINUTES = 45;
const ROUND_TO_MINUTES = 5;
/** Only the month before an exam is planned, so far-off exams stay tidy. */
const MAX_PREP_DAYS = 30;

function roundUpMinutes(minutes: number): number {
  return (
    Math.max(
      MIN_TASK_MINUTES,
      Math.ceil(minutes / ROUND_TO_MINUTES) * ROUND_TO_MINUTES
    ) || MIN_TASK_MINUTES
  );
}

/**
 * Turns an exam's target into one-off preparation tasks, one per day, ending
 * the day before the exam. The days closest to the exam are used, so a target
 * that only needs a few sessions is not spread thinly over a month.
 */
export function buildExamPrepTasks(
  event: StudyEvent,
  from: string
): Task[] {
  const { id, title, date, subjectId, targetMinutes } = event;

  if (!subjectId || !targetMinutes || targetMinutes <= 0) {
    return [];
  }

  const examDate = fromDateKey(date);
  const startDate = fromDateKey(from);

  if (examDate.getTime() < startDate.getTime()) {
    return [];
  }

  const earliestStart = new Date(examDate);
  earliestStart.setDate(earliestStart.getDate() - (MAX_PREP_DAYS - 1));

  const cursor = new Date(
    Math.max(startDate.getTime(), earliestStart.getTime())
  );
  const lastPrepDay = new Date(examDate);
  lastPrepDay.setDate(lastPrepDay.getDate() - 1);

  const days: string[] = [];

  while (cursor.getTime() <= lastPrepDay.getTime()) {
    days.push(dateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  // An exam today still gets one prep task today.
  if (days.length === 0) {
    days.push(from);
  }

  const sessionCount = Math.min(
    days.length,
    Math.max(1, Math.round(targetMinutes / SESSION_MINUTES))
  );
  // Preparation is only ever scheduled from `from` (today) onwards. `days`
  // already starts there; filtering again keeps that guarantee explicit if the
  // window maths above ever drifts, and never emits a past-dated task.
  const chosenDays = days
    .slice(days.length - sessionCount)
    .filter((day) => day >= from);

  if (chosenDays.length === 0) {
    return [];
  }

  const minutes = roundUpMinutes(targetMinutes / chosenDays.length);

  return chosenDays.map((day) => ({
    id: createId(),
    title: `Exam prep: ${title}`,
    subjectId,
    weekdays: [],
    date: day,
    minutes,
    eventId: id,
  }));
}
