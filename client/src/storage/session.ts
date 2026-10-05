import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AuthUser } from '../api/auth';

const SESSION_KEY = 'studyhabits.session';

export type Session = {
  token: string;
  user: AuthUser;
};

export async function saveSession(session: Session): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function loadSession(): Promise<Session | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(raw) as Session;

    // Guard against a partial write or an older shape.
    return session?.token && session?.user ? session : null;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}
