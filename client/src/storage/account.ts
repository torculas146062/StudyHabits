import AsyncStorage from '@react-native-async-storage/async-storage';

import { studyStorageKey } from '../study/asyncStorageStudyRepository';
import { syncStorageKey } from './sync';

/**
 * Removes the local copy of an account's plan and its sync bookkeeping. Used
 * after the server confirms the account is gone, so a stale plan cannot be
 * restored or uploaded again.
 */
export async function clearLocalAccountData(userId: number): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(studyStorageKey(userId)),
    AsyncStorage.removeItem(syncStorageKey(userId)),
  ]);
}
