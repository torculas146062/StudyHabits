import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Bookkeeping for one account's sync, kept next to (but separate from) the plan
 * itself so the plan's storage format stays exactly what the server stores.
 */
export type SyncMetadata = {
  /** Server revision this device last saw. */
  revision: number;
  /** When the last successful sync happened, ISO timestamp. */
  lastSyncedAt: string | null;
  /** When the local plan last changed, used to resolve conflicts. */
  localUpdatedAt: string | null;
  /** True while local edits have not reached the server. */
  pending: boolean;
};

export const EMPTY_SYNC_METADATA: SyncMetadata = {
  revision: 0,
  lastSyncedAt: null,
  localUpdatedAt: null,
  pending: false,
};

export function syncStorageKey(userId: string | number): string {
  return `studyhabits.sync.${userId}`;
}

export function createPendingMetadata(
  metadata: SyncMetadata = EMPTY_SYNC_METADATA
): SyncMetadata {
  return {
    ...metadata,
    pending: true,
    localUpdatedAt: new Date().toISOString(),
  };
}

export async function loadSyncMetadata(
  userId: string | number
): Promise<SyncMetadata | null> {
  const raw = await AsyncStorage.getItem(syncStorageKey(userId));

  if (!raw) {
    return null;
  }

  try {
    const stored = JSON.parse(raw) as Partial<SyncMetadata>;

    return {
      revision:
        typeof stored.revision === 'number' && stored.revision >= 0
          ? stored.revision
          : 0,
      lastSyncedAt:
        typeof stored.lastSyncedAt === 'string' ? stored.lastSyncedAt : null,
      localUpdatedAt:
        typeof stored.localUpdatedAt === 'string' ? stored.localUpdatedAt : null,
      pending: stored.pending === true,
    };
  } catch {
    return null;
  }
}

export async function saveSyncMetadata(
  userId: string | number,
  metadata: SyncMetadata
): Promise<void> {
  await AsyncStorage.setItem(syncStorageKey(userId), JSON.stringify(metadata));
}
