import AsyncStorage from '@react-native-async-storage/async-storage';

import type { StudyRepository } from './studyRepository';
import { EMPTY_STUDY_DATA, type StudyData } from './types';

/** Each account keeps its own copy, so signing in as someone else starts clean. */
export function studyStorageKey(userId: string | number): string {
  return `studyhabits.study.${userId}`;
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
        const stored = JSON.parse(raw) as Partial<StudyData>;

        // Guard against a partial write or an older shape.
        return {
          ...EMPTY_STUDY_DATA,
          ...stored,
          restDays: stored.restDays ?? [],
        };
      } catch {
        return null;
      }
    },

    async save(data) {
      await AsyncStorage.setItem(storageKey, JSON.stringify(data));
    },
  };
}
