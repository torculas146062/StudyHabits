import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import {
  IStudyRepository,
  SaveStudyResult,
  StoredStudyPlan,
  StudyPlanData,
} from '../IStudyRepository';

type StudyPlanRow = RowDataPacket & {
  data: unknown;
  revision: number;
  updated_at: Date | string;
};

const DUPLICATE_ENTRY_CODE = 'ER_DUP_ENTRY';

function isDuplicateEntry(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: string }).code === DUPLICATE_ENTRY_CODE
  );
}

function toPlan(row: StudyPlanRow): StoredStudyPlan {
  return {
    // MySQL may hand JSON columns back parsed or as text depending on options.
    data:
      typeof row.data === 'string'
        ? (JSON.parse(row.data) as StudyPlanData)
        : (row.data as StudyPlanData),
    revision: row.revision,
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

/**
 * MySQL adapter for {@link IStudyRepository}. The plan is stored as one JSON
 * document per user, which keeps the sync protocol simple: a device replaces
 * the whole plan and the revision guards against lost updates.
 */
export class MySqlStudyRepository implements IStudyRepository {
  constructor(private readonly pool: Pool) {}

  async get(userId: number): Promise<StoredStudyPlan | null> {
    const [rows] = await this.pool.execute<StudyPlanRow[]>(
      'SELECT data, revision, updated_at FROM study_plans WHERE user_id = ? LIMIT 1',
      [userId]
    );

    return rows.length > 0 ? toPlan(rows[0]) : null;
  }

  async save(
    userId: number,
    data: StudyPlanData,
    baseRevision: number
  ): Promise<SaveStudyResult> {
    const json = JSON.stringify(data);

    if (baseRevision <= 0) {
      try {
        await this.pool.execute<ResultSetHeader>(
          'INSERT INTO study_plans (user_id, data, revision) VALUES (?, ?, 1)',
          [userId, json]
        );
      } catch (err) {
        // Another device created the plan after this client last synced.
        if (isDuplicateEntry(err)) {
          return { status: 'conflict', current: await this.get(userId) };
        }

        throw err;
      }
    } else {
      const [result] = await this.pool.execute<ResultSetHeader>(
        `UPDATE study_plans
            SET data = ?, revision = revision + 1
          WHERE user_id = ? AND revision = ?`,
        [json, userId, baseRevision]
      );

      if (result.affectedRows === 0) {
        return { status: 'conflict', current: await this.get(userId) };
      }
    }

    const saved = await this.get(userId);

    if (!saved) {
      throw new Error(`Study plan for user ${userId} disappeared after saving`);
    }

    return { status: 'saved', plan: saved };
  }
}
