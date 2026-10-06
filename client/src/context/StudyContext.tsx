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
  createAsyncStorageStudyRepository,
  studyStorageKey,
} from '../study/asyncStorageStudyRepository';
import { todayKey } from '../study/date';
import {
  FOCUS_DURATIONS,
  breakAfter,
  phaseMinutes,
  type TimerPhase,
} from '../study/timer';
import {
  EMPTY_STUDY_DATA,
  createId,
  type SessionStatus,
  type StudyData,
} from '../study/types';
import { useAuth } from './AuthContext';

export type SubjectInput = { name: string; goalMinutes: number };

export type HabitInput = {
  title: string;
  subjectId: string;
  weekdays: number[];
};

export type EventInput = { title: string; date: string };

export type SessionInput = {
  subjectId: string;
  minutes: number;
  status: SessionStatus;
  habitId?: string;
};

type StudyContextValue = {
  data: StudyData;
  /** True while the plan stored for the signed-in account is being read. */
  isRestoring: boolean;
  addSubject: (input: SubjectInput) => void;
  updateSubject: (id: string, input: SubjectInput) => void;
  removeSubject: (id: string) => void;
  addHabit: (input: HabitInput) => void;
  updateHabit: (id: string, input: HabitInput) => void;
  removeHabit: (id: string) => void;
  logSession: (input: SessionInput) => void;
  addEvent: (input: EventInput) => void;
  updateEvent: (id: string, input: EventInput) => void;
  removeEvent: (id: string) => void;
  toggleRestDay: (date: string) => void;
  /** Drops today's session for a habit, so a mis-tick can be corrected. */
  clearHabitSession: (habitId: string) => void;
  timer: FocusTimer;
  setTimerSubject: (subjectId: string) => void;
  setTimerMinutes: (minutes: number) => void;
  toggleTimer: () => void;
};

export type FocusTimer = {
  subjectId: string | null;
  minutes: number;
  secondsLeft: number;
  isRunning: boolean;
  phase: TimerPhase;
  /** Focus blocks finished within the current set. */
  completedPomodoros: number;
};

const DEFAULT_FOCUS_MINUTES = FOCUS_DURATIONS[0];

const StudyContext = createContext<StudyContextValue | undefined>(undefined);

export function StudyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storageKey = user ? studyStorageKey(user.id) : null;
  const [data, setData] = useState<StudyData>(EMPTY_STUDY_DATA);
  const [isRestoring, setIsRestoring] = useState(true);
  // Only the key whose data is in state may be written back, so switching
  // accounts can never copy one plan over another.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  // The focus timer lives here rather than in a screen so it keeps counting
  // while the user moves around the app.
  const [timer, setTimer] = useState<FocusTimer>({
    subjectId: null,
    minutes: DEFAULT_FOCUS_MINUTES,
    secondsLeft: DEFAULT_FOCUS_MINUTES * 60,
    isRunning: false,
    phase: 'focus',
    completedPomodoros: 0,
  });

  const repository = useMemo(
    () => (storageKey ? createAsyncStorageStudyRepository(storageKey) : null),
    [storageKey]
  );

  useEffect(() => {
    let cancelled = false;

    if (!repository || !storageKey) {
      setData(EMPTY_STUDY_DATA);
      setLoadedKey(null);
      setIsRestoring(false);
      return;
    }

    setIsRestoring(true);

    repository
      .load()
      .catch(() => null)
      .then((stored) => {
        if (cancelled) {
          return;
        }

        setData(stored ?? EMPTY_STUDY_DATA);
        setLoadedKey(storageKey);
      })
      .finally(() => {
        if (!cancelled) {
          setIsRestoring(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [repository, storageKey]);

  useEffect(() => {
    if (!repository || loadedKey !== storageKey) {
      return;
    }

    repository.save(data).catch(() => undefined);
  }, [data, loadedKey, repository, storageKey]);

  const change = useCallback(
    (update: (current: StudyData) => StudyData) => {
      setData((current) => update(current));
    },
    [setData]
  );

  const addSubject = useCallback(
    (input: SubjectInput) => {
      change((current) => ({
        ...current,
        subjects: [...current.subjects, { id: createId(), ...input }],
      }));
    },
    [change]
  );

  const updateSubject = useCallback(
    (id: string, input: SubjectInput) => {
      change((current) => ({
        ...current,
        subjects: current.subjects.map((subject) =>
          subject.id === id ? { ...subject, ...input } : subject
        ),
      }));
    },
    [change]
  );

  const removeSubject = useCallback(
    (id: string) => {
      // Sessions stay behind so the streak and study time keep their history.
      change((current) => ({
        ...current,
        subjects: current.subjects.filter((subject) => subject.id !== id),
        habits: current.habits.filter((habit) => habit.subjectId !== id),
      }));
    },
    [change]
  );

  const addHabit = useCallback(
    (input: HabitInput) => {
      change((current) => ({
        ...current,
        habits: [...current.habits, { id: createId(), ...input }],
      }));
    },
    [change]
  );

  const updateHabit = useCallback(
    (id: string, input: HabitInput) => {
      change((current) => ({
        ...current,
        habits: current.habits.map((habit) =>
          habit.id === id ? { ...habit, ...input } : habit
        ),
      }));
    },
    [change]
  );

  const removeHabit = useCallback(
    (id: string) => {
      change((current) => ({
        ...current,
        habits: current.habits.filter((habit) => habit.id !== id),
      }));
    },
    [change]
  );

  const logSession = useCallback(
    (input: SessionInput) => {
      const date = todayKey();

      change((current) => ({
        ...current,
        sessions: [
          // Ticking a habit again replaces that habit's session for the day.
          ...current.sessions.filter(
            (session) =>
              !input.habitId ||
              !(session.habitId === input.habitId && session.date === date)
          ),
          {
            id: createId(),
            date,
            minutes: input.status === 'done' ? input.minutes : 0,
            status: input.status,
            subjectId: input.subjectId,
            habitId: input.habitId,
          },
        ],
      }));
    },
    [change]
  );

  const addEvent = useCallback(
    (input: EventInput) => {
      change((current) => ({
        ...current,
        events: [...current.events, { id: createId(), ...input }],
      }));
    },
    [change]
  );

  const updateEvent = useCallback(
    (id: string, input: EventInput) => {
      change((current) => ({
        ...current,
        events: current.events.map((event) =>
          event.id === id ? { ...event, ...input } : event
        ),
      }));
    },
    [change]
  );

  const removeEvent = useCallback(
    (id: string) => {
      change((current) => ({
        ...current,
        events: current.events.filter((event) => event.id !== id),
      }));
    },
    [change]
  );

  const toggleRestDay = useCallback(
    (date: string) => {
      change((current) => ({
        ...current,
        restDays: current.restDays.includes(date)
          ? current.restDays.filter((restDay) => restDay !== date)
          : [...current.restDays, date],
      }));
    },
    [change]
  );

  // Fall back to the first subject whenever the chosen one is gone.
  const timerSubjectId =
    timer.subjectId && data.subjects.some((s) => s.id === timer.subjectId)
      ? timer.subjectId
      : data.subjects[0]?.id ?? null;

  useEffect(() => {
    if (!timer.isRunning) {
      return;
    }

    const tick = setInterval(() => {
      setTimer((current) => ({
        ...current,
        secondsLeft: Math.max(0, current.secondsLeft - 1),
      }));
    }, 1000);

    return () => clearInterval(tick);
  }, [timer.isRunning]);

  useEffect(() => {
    // A finished phase advances the cycle: a focus block logs the session it
    // stood for and leads into a break; a break leads back into the next focus
    // block. The countdown keeps running through both.
    if (timer.secondsLeft > 0 || !timer.isRunning) {
      return;
    }

    if (timer.phase === 'focus') {
      const completedPomodoros = timer.completedPomodoros + 1;
      const phase = breakAfter(completedPomodoros);

      if (timerSubjectId) {
        logSession({
          subjectId: timerSubjectId,
          minutes: timer.minutes,
          status: 'done',
        });
      }

      setTimer((current) => ({
        ...current,
        phase,
        secondsLeft: phaseMinutes(phase, current.minutes) * 60,
        completedPomodoros,
        isRunning: true,
      }));
      return;
    }

    setTimer((current) => ({
      ...current,
      phase: 'focus',
      secondsLeft: current.minutes * 60,
      isRunning: true,
    }));
  }, [
    logSession,
    timer.completedPomodoros,
    timer.isRunning,
    timer.minutes,
    timer.phase,
    timer.secondsLeft,
    timerSubjectId,
  ]);

  useEffect(() => {
    // Signing out should not leave a countdown running in the background.
    setTimer((current) =>
      current.isRunning ? { ...current, isRunning: false } : current
    );
  }, [user?.id]);

  const setTimerSubject = useCallback((subjectId: string) => {
    setTimer((current) => ({ ...current, subjectId }));
  }, []);

  const setTimerMinutes = useCallback((minutes: number) => {
    setTimer((current) => ({
      ...current,
      minutes,
      // A stopped focus block jumps to the new length; a running countdown or a
      // break keeps its remaining time.
      secondsLeft:
        current.phase === 'focus' && !current.isRunning
          ? minutes * 60
          : current.secondsLeft,
    }));
  }, []);

  const toggleTimer = useCallback(() => {
    setTimer((current) => {
      if (!current.isRunning && current.secondsLeft === 0) {
        return {
          ...current,
          secondsLeft: phaseMinutes(current.phase, current.minutes) * 60,
          isRunning: true,
        };
      }

      return { ...current, isRunning: !current.isRunning };
    });
  }, []);

  const clearHabitSession = useCallback(
    (habitId: string) => {
      const date = todayKey();

      change((current) => ({
        ...current,
        sessions: current.sessions.filter(
          (session) => !(session.habitId === habitId && session.date === date)
        ),
      }));
    },
    [change]
  );

  const value = useMemo(
    () => ({
      data,
      isRestoring,
      clearHabitSession,
      timer: { ...timer, subjectId: timerSubjectId },
      setTimerSubject,
      setTimerMinutes,
      toggleTimer,
      addSubject,
      updateSubject,
      removeSubject,
      addHabit,
      updateHabit,
      removeHabit,
      logSession,
      addEvent,
      updateEvent,
      removeEvent,
      toggleRestDay,
    }),
    [
      data,
      isRestoring,
      clearHabitSession,
      timer,
      timerSubjectId,
      setTimerSubject,
      setTimerMinutes,
      toggleTimer,
      addSubject,
      updateSubject,
      removeSubject,
      addHabit,
      updateHabit,
      removeHabit,
      logSession,
      addEvent,
      updateEvent,
      removeEvent,
      toggleRestDay,
    ]
  );

  return (
    <StudyContext.Provider value={value}>{children}</StudyContext.Provider>
  );
}

export function useStudy(): StudyContextValue {
  const context = useContext(StudyContext);

  if (!context) {
    throw new Error('useStudy must be used inside a StudyProvider');
  }

  return context;
}
