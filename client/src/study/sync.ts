import {
  EMPTY_SYNC_METADATA,
  type SyncMetadata,
} from '../storage/sync';
import type { StudyData } from './types';

export type SyncDecision = 'push' | 'pull' | 'none';

export type RemotePlanSummary = {
  data: StudyData | null;
  revision: number;
  updatedAt: string | null;
};

/** Timestamp given to local data that predates sync, so any remote plan wins. */
const LEGACY_PLAN_TIMESTAMP = new Date(0).toISOString();

export function hasPlanContent(data: StudyData): boolean {
  return (
    data.subjects.length > 0 ||
    data.tasks.length > 0 ||
    data.sessions.length > 0 ||
    data.events.length > 0 ||
    data.restDays.length > 0
  );
}

/**
 * Metadata for a plan that has never synced. A plan created before sync
 * existed is uploaded when the account has no remote plan, but loses to an
 * existing remote plan so it cannot clobber another device.
 */
export function initialSyncMetadata(data: StudyData): SyncMetadata {
  if (!hasPlanContent(data)) {
    return EMPTY_SYNC_METADATA;
  }

  return {
    revision: 0,
    lastSyncedAt: null,
    localUpdatedAt: LEGACY_PLAN_TIMESTAMP,
    pending: true,
  };
}

function isLocalEditNewer(
  metadata: SyncMetadata,
  remote: RemotePlanSummary
): boolean {
  if (!metadata.localUpdatedAt) {
    return false;
  }

  if (!remote.updatedAt) {
    return true;
  }

  const local = Date.parse(metadata.localUpdatedAt);
  const remoteTime = Date.parse(remote.updatedAt);

  if (Number.isNaN(local) || Number.isNaN(remoteTime)) {
    return false;
  }

  // A tie goes to the server, which also serialises edits from other devices.
  return local > remoteTime;
}

/**
 * Decides how to reconcile the local plan with the server copy.
 *
 * - `push` when local edits are newer, there is no remote plan yet, or the
 *   server copy is somehow older than this device.
 * - `pull` when another device saved something this device has not seen.
 * - `none` when both sides already agree.
 */
export function decideSync(
  metadata: SyncMetadata,
  remote: RemotePlanSummary,
  local: StudyData
): SyncDecision {
  if (remote.revision < metadata.revision) {
    return 'push';
  }

  if (remote.revision === 0 || !remote.data) {
    return metadata.pending || hasPlanContent(local) ? 'push' : 'none';
  }

  if (!metadata.pending) {
    return remote.revision === metadata.revision ? 'none' : 'pull';
  }

  if (remote.revision === metadata.revision) {
    return 'push';
  }

  return isLocalEditNewer(metadata, remote) ? 'push' : 'pull';
}
