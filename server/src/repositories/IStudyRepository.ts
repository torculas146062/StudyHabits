/** A study plan exactly as the client serialises it. */
export type StudyPlanData = Record<string, unknown>;

export type StoredStudyPlan = {
  data: StudyPlanData;
  /** Increments on every successful save, so clients can detect conflicts. */
  revision: number;
  /** ISO timestamp of the last save. */
  updatedAt: string;
};

export type SaveStudyResult =
  | { status: 'saved'; plan: StoredStudyPlan }
  | { status: 'conflict'; current: StoredStudyPlan | null };

/**
 * Port for storing one study plan per user.
 *
 * Saving is optimistic: a client sends the revision it based its edit on, and a
 * mismatch is reported as a conflict rather than overwriting another device.
 */
export interface IStudyRepository {
  get(userId: number): Promise<StoredStudyPlan | null>;
  save(
    userId: number,
    data: StudyPlanData,
    baseRevision: number
  ): Promise<SaveStudyResult>;
}
