import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import {
  signIn as signInRequest,
  signUp as signUpRequest,
  type AuthUser,
} from '../api/auth';
import { clearSession, loadSession, saveSession } from '../storage/session';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  /** True while the stored session is being read on launch. */
  isRestoring: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  // Restore any session saved by a previous run.
  useEffect(() => {
    let cancelled = false;

    loadSession()
      .catch(() => null)
      .then((session) => {
        if (cancelled || !session) {
          return;
        }

        setToken(session.token);
        setUser(session.user);
      })
      .finally(() => {
        if (!cancelled) {
          setIsRestoring(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const startSession = useCallback(async (session: { token: string; user: AuthUser }) => {
    await saveSession(session);
    setToken(session.token);
    setUser(session.user);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      startSession(await signInRequest(email, password));
    },
    [startSession]
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      startSession(await signUpRequest(name, email, password));
    },
    [startSession]
  );

  const signOut = useCallback(async () => {
    setToken(null);
    setUser(null);

    // The in-memory session is already gone, so a storage failure shouldn't
    // surface as an error the caller has to handle.
    try {
      await clearSession();
    } catch {
      // Ignore: worst case the next launch restores a stale session.
    }
  }, []);

  const value = useMemo(
    () => ({ user, token, isRestoring, signIn, signUp, signOut }),
    [user, token, isRestoring, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return context;
}
