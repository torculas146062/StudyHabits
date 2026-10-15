import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import { requestReminderPermission } from '../notifications/reminders';
import {
  DEFAULT_DND_MODE,
  DEFAULT_REMINDERS_ENABLED,
  loadDndMode,
  loadRemindersEnabled,
  saveDndMode,
  saveRemindersEnabled,
  type DndMode,
} from '../storage/preferences';

export type { DndMode };

type PreferencesContextValue = {
  /** False until the stored preferences have been read. */
  isReady: boolean;
  remindersEnabled: boolean;
  /**
   * Turns reminders on or off. Enabling asks for notification permission first;
   * the returned value reports whether reminders ended up on.
   */
  setRemindersEnabled: (enabled: boolean) => Promise<boolean>;
  dndMode: DndMode;
  setDndMode: (mode: DndMode) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | undefined>(
  undefined
);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [remindersEnabled, setRemindersEnabledState] = useState(
    DEFAULT_REMINDERS_ENABLED
  );
  const [dndMode, setDndModeState] = useState<DndMode>(DEFAULT_DND_MODE);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([loadRemindersEnabled(), loadDndMode()])
      .then(([reminders, dnd]) => {
        if (cancelled) {
          return;
        }

        setRemindersEnabledState(reminders);
        setDndModeState(dnd);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setIsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setRemindersEnabled = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestReminderPermission().catch(() => false);

      if (!granted) {
        return false;
      }
    }

    // Apply straight away so the switch updates instantly; persisting is
    // best-effort, the worst case being a reset back to the default next launch.
    setRemindersEnabledState(enabled);
    saveRemindersEnabled(enabled).catch(() => {});

    return enabled;
  }, []);

  const setDndMode = useCallback((mode: DndMode) => {
    setDndModeState(mode);
    saveDndMode(mode).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ isReady, remindersEnabled, setRemindersEnabled, dndMode, setDndMode }),
    [isReady, remindersEnabled, setRemindersEnabled, dndMode, setDndMode]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error('usePreferences must be used inside a PreferencesProvider');
  }

  return context;
}
