import type { StudyData } from './types';

/**
 * Persistence port for the study data. AsyncStorage is the current adapter, and
 * the shape is deliberately what a server-backed one would need too, so the
 * provider can swap implementations without the screens noticing.
 */
export type StudyRepository = {
  load: () => Promise<StudyData | null>;
  save: (data: StudyData) => Promise<void>;
};
