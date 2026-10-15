import AsyncStorage from '@react-native-async-storage/async-storage';

import type { StudyRepository } from './studyRepository';
import {
  EMPTY_STUDY_DATA,
  type Session,
  type StudyData,
  type Task,
} from './types';

/** Each account keeps its own copy, so signing in as someone else starts clean. */
export function studyStorageKey(userId: string | number): string {
  return `studyhabits.study.${userId}`;
}

/** The shape stored before habits were renamed to tasks. */
type LegacySession = Session & { habitId?: string };
type LegacyStudyData = Omit<Partial<StudyData>, 'sessions'> & {
  habits?: Task[];
  sessions?: LegacySession[];
};

/**
 * Fills in anything an older or partially written record is missing, including
 * the habits → tasks rename.
 */
export function normalizeStudyData(raw: unknown): StudyData {
  if (!raw || typeof raw !== 'object') {
    return EMPTY_STUDY_DATA;
  }

  const stored = raw as LegacyStudyData;
  const tasks = stored.tasks ?? stored.habits ?? [];

  return {
    subjects: stored.subjects ?? [],
    tasks: tasks.map(
      ({
        id,
        title,
        subjectId,
        weekdays,
        date,
        minutes,
        eventId,
        timer,
        reminderTime,
      }) => ({
        id,
        title,
        subjectId,
        weekdays: weekdays ?? [],
        ...(date ? { date } : {}),
        ...(typeof minutes === 'number' ? { minutes } : {}),
        ...(eventId ? { eventId } : {}),
        ...(timer ? { timer: true } : {}),
        ...(reminderTime ? { reminderTime } : {}),
      })
    ),
    sessions: (stored.sessions ?? []).map((session) => ({
      id: session.id,
      subjectId: session.subjectId,
      date: session.date,
      minutes: session.minutes,
      status: session.status,
      ...((session.taskId ?? session.habitId)
        ? { taskId: session.taskId ?? session.habitId }
        : {}),
      ...(session.eventId ? { eventId: session.eventId } : {}),
    })),
    events: (stored.events ?? []).map(
      ({ id, title, date, kind, subjectId, targetMinutes, reminderTime }) => ({
        id,
        title,
        date,
        kind: kind === 'exam' ? 'exam' : 'event',
        ...(subjectId ? { subjectId } : {}),
        ...(typeof targetMinutes === 'number' ? { targetMinutes } : {}),
        ...(reminderTime ? { reminderTime } : {}),
      })
    ),
    restDays: stored.restDays ?? [],
  };
}

export function createAsyncStorageStudyRepository(
  storageKey: string
): StudyRepository {
  return {
    async load() {
      const raw = await AsyncStorage.getItem(storageKey);

      if (!raw) {
        return null;
      }

      try {
        return normalizeStudyData(JSON.parse(raw));
      } catch {
        return null;
      }
    },

    async save(data) {
      await AsyncStorage.setItem(storageKey, JSON.stringify(data));
    },
  };
}
