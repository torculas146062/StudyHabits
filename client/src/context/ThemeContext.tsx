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
  DEFAULT_THEME_PREFERENCE,
  loadThemePreference,
  saveThemePreference,
  type ThemePreference,
} from '../storage/theme';

export type { ThemePreference };

type ThemeContextValue = {
  /** The user's choice; `system` follows the device setting. */
  preference: ThemePreference;
  /** False until the stored preference has been read. */
  isReady: boolean;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(
    DEFAULT_THEME_PREFERENCE
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadThemePreference()
      .catch(() => DEFAULT_THEME_PREFERENCE)
      .then((stored) => {
        if (!cancelled) {
          setPreferenceState(stored);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    // Apply straight away so the screen updates instantly; persisting is
    // best-effort, the worst case being a reset back to the default next launch.
    setPreferenceState(next);
    saveThemePreference(next).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ preference, isReady, setPreference }),
    [preference, isReady, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePreference(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useThemePreference must be used inside a ThemePreferenceProvider'
    );
  }

  return context;
}
