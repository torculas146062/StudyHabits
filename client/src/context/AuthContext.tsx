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
  deleteAccount as deleteAccountRequest,
  signIn as signInRequest,
  signUp as signUpRequest,
  type AuthUser,
} from '../api/auth';
import { clearLocalAccountData } from '../storage/account';
import { clearSession, loadSession, saveSession } from '../storage/session';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  /** True while the stored session is being read on launch. */
  isRestoring: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /**
   * Deletes the account on the server, then removes its local plan and session.
   * Throws when the server cannot be reached, leaving the account untouched.
   */
  deleteAccount: () => Promise<void>;
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
      // Awaited so a storage failure reaches the caller instead of surfacing as
      // an unhandled rejection after the screen has already moved on.
      await startSession(await signInRequest(email, password));
    },
    [startSession]
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      await startSession(await signUpRequest(name, email, password));
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

  const deleteAccount = useCallback(async () => {
    if (!token || !user) {
      throw new Error('You need to be signed in to delete your account.');
    }

    // Delete remotely first: if the request fails, the local plan and session
    // are left intact and the user can try again.
    await deleteAccountRequest(token);

    // The account is gone, so local cleanup is best-effort.
    await clearLocalAccountData(user.id).catch(() => undefined);

    setToken(null);
    setUser(null);

    try {
      await clearSession();
    } catch {
      // Ignore: the deleted account can no longer be used even if a stale
      // session remains on disk.
    }
  }, [token, user]);

  const value = useMemo(
    () => ({
      user,
      token,
      isRestoring,
      signIn,
      signUp,
      signOut,
      deleteAccount,
    }),
    [user, token, isRestoring, signIn, signUp, signOut, deleteAccount]
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
