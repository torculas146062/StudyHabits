import { normalizeStudyData } from '../study/asyncStorageStudyRepository';
import type { StudyData } from '../study/types';
import { ApiError, apiRequest } from './client';

export type RemoteStudyPlan = {
  data: StudyData | null;
  /** 0 means no plan has been uploaded for this account yet. */
  revision: number;
  updatedAt: string | null;
};

/** Raised when another device saved a newer revision first. */
export class StudyConflictError extends Error {
  constructor(readonly remote: RemoteStudyPlan | null) {
    super('The study plan changed on another device.');
    this.name = 'StudyConflictError';
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function toPlan(payload: unknown): RemoteStudyPlan {
  const body = (payload ?? {}) as Record<string, unknown>;
  const revision =
    typeof body.revision === 'number' && Number.isFinite(body.revision)
      ? body.revision
      : 0;
  const updatedAt = typeof body.updatedAt === 'string' ? body.updatedAt : null;

  return {
    data: body.data ? normalizeStudyData(body.data) : null,
    revision,
    updatedAt,
  };
}

export async function fetchStudyPlan(
  token: string
): Promise<RemoteStudyPlan> {
  const response = await apiRequest('/study', { method: 'GET', token });

  if (!response.ok) {
    throw new ApiError('Could not load the synced study plan.', response.status);
  }

  return toPlan(await readJson(response));
}

/**
 * Uploads the whole plan. `baseRevision` is the revision the edit was based on;
 * a mismatched revision raises `StudyConflictError` with the remote plan so the
 * caller can retry or adopt it.
 */
export async function saveStudyPlan(
  token: string,
  data: StudyData,
  baseRevision: number
): Promise<RemoteStudyPlan> {
  const response = await apiRequest('/study', {
    method: 'PUT',
    token,
    body: { data, baseRevision },
  });

  const payload = await readJson(response);

  if (response.status === 409) {
    const remote = (payload as { remote?: unknown }).remote;

    throw new StudyConflictError(remote ? toPlan(remote) : null);
  }

  if (!response.ok) {
    throw new ApiError('Could not save the study plan.', response.status);
  }

  return toPlan(payload);
}
