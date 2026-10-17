import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { AppState } from 'react-native';

import { ApiError } from '../api/client';
import {
  fetchStudyPlan,
  saveStudyPlan,
  StudyConflictError,
} from '../api/study';
import {
  createAsyncStorageStudyRepository,
  studyStorageKey,
} from '../study/asyncStorageStudyRepository';
import { todayKey } from '../study/date';
import { buildExamPrepTasks } from '../study/exams';
import { decideSync, initialSyncMetadata } from '../study/sync';
import { timerTaskOn } from '../study/selectors';
import { cancelReminders, syncReminders } from '../notifications/reminders';
import {
  createPendingMetadata,
  loadSyncMetadata,
  saveSyncMetadata,
  type SyncMetadata,
} from '../storage/sync';
import {
  breakAfter,
  defaultFocusTimer,
  phaseMinutes,
  type FocusTimer,
} from '../study/timer';
import {
  EMPTY_STUDY_DATA,
  createId,
  type SessionStatus,
  type StudyData,
  type StudyEvent,
  type StudyEventKind,
} from '../study/types';
import { useAuth } from './AuthContext';
import { usePreferences } from './PreferencesContext';

export type SubjectInput = { name: string; goalMinutes: number };

export type TaskInput = {
  title: string;
  subjectId: string;
  weekdays: number[];
  /** Minutes each check-in logs; falls back to the subject goal. */
  minutes?: number;
  reminderTime?: string;
};

export type EventInput = {
  title: string;
  date: string;
  reminderTime?: string;
  kind?: StudyEventKind;
  /** Required when `kind` is `exam`. */
  subjectId?: string;
  /** Preparation target in minutes, for exams. */
  targetMinutes?: number;
};

export type SessionInput = {
  subjectId: string;
  minutes: number;
  status: SessionStatus;
  taskId?: string;
  eventId?: string;
  /**
   * Adds to an existing finished session for the same task and day instead of
   * replacing it, so repeated pomodoros keep adding up.
   */
  accumulate?: boolean;
};

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

export type StudySyncState = {
  status: SyncStatus;
  /** When this account last agreed with the server, ISO timestamp. */
  lastSyncedAt: string | null;
};

type StudyContextValue = {
  data: StudyData;
  /** True while the plan stored for the signed-in account is being read. */
  isRestoring: boolean;
  addSubject: (input: SubjectInput) => void;
  updateSubject: (id: string, input: SubjectInput) => void;
  removeSubject: (id: string) => void;
  addTask: (input: TaskInput) => void;
  updateTask: (id: string, input: TaskInput) => void;
  removeTask: (id: string) => void;
  logSession: (input: SessionInput) => void;
  addEvent: (input: EventInput) => void;
  /** Adds an event and, for an exam, its generated preparation tasks. */
  planExam: (input: EventInput) => void;
  updateEvent: (id: string, input: EventInput) => void;
  removeEvent: (id: string) => void;
  toggleRestDay: (date: string) => void;
  /** Drops today's session for a task, so a mis-tick can be corrected. */
  clearTaskSession: (taskId: string) => void;
  /** The countdown for the subject chosen on the focus screen. */
  timer: FocusTimer & { subjectId: string | null };
  /** The countdown running right now, whichever subject owns it. */
  runningTimer: { subjectId: string; timer: FocusTimer } | null;
  /** Chooses which subject's timer the focus screen shows; nothing is stopped. */
  setTimerSubject: (subjectId: string) => void;
  setTimerMinutes: (minutes: number) => void;
  toggleTimer: () => void;
  /** Abandons the chosen subject's block and returns its timer to a fresh one. */
  resetTimer: () => void;
  sync: StudySyncState;
  /** Runs a sync now; a no-op while signed out or already syncing. */
  syncNow: () => void;
};

/** Turns dialog input into the fields stored on an event. */
function toEventFields(input: EventInput): Omit<StudyEvent, 'id'> {
  const title = input.title.trim();
  const reminder = input.reminderTime
    ? { reminderTime: input.reminderTime }
    : {};

  if (input.kind === 'exam') {
    return {
      title,
      date: input.date,
      kind: 'exam',
      ...(input.subjectId ? { subjectId: input.subjectId } : {}),
      ...(input.targetMinutes && input.targetMinutes > 0
        ? { targetMinutes: input.targetMinutes }
        : {}),
      ...reminder,
    };
  }

  return {
    title,
    date: input.date,
    kind: 'event',
    // Clear exam-only fields when an exam is turned back into a plain event.
    subjectId: undefined,
    targetMinutes: undefined,
    ...reminder,
  };
}

const StudyContext = createContext<StudyContextValue | undefined>(undefined);

export function StudyProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const { remindersEnabled, isReady: preferencesReady } = usePreferences();
  const storageKey = user ? studyStorageKey(user.id) : null;
  const userId = user?.id ?? null;
  const [data, setData] = useState<StudyData>(EMPTY_STUDY_DATA);
  const [isRestoring, setIsRestoring] = useState(true);
  // Only the key whose data is in state may be written back, so switching
  // accounts can never copy one plan over another.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [sync, setSync] = useState<StudySyncState>({
    status: 'idle',
    lastSyncedAt: null,
  });
  // Every subject keeps its own countdown here rather than in a screen, so one
  // subject's timer keeps its place while another is used, and closing the
  // focus screen never discards either of them.
  const [timers, setTimers] = useState<Record<string, FocusTimer>>({});
  // The subject whose timer the focus screen shows. Nothing is stopped when
  // this changes; each subject simply resumes where it was left.
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);

  const repository = useMemo(
    () => (storageKey ? createAsyncStorageStudyRepository(storageKey) : null),
    [storageKey]
  );

  // Sync runs from timers and app-state callbacks, so the latest values are
  // read through refs rather than captured stale in a closure.
  const dataRef = useRef(data);
  const loadedKeyRef = useRef(loadedKey);
  const userRef = useRef(user);
  const tokenRef = useRef(token);
  const repositoryRef = useRef(repository);
  const syncMetadataRef = useRef<SyncMetadata | null>(null);
  const syncingRef = useRef(false);
  const syncRetriesRef = useRef(0);
  // The exact plan object that came from storage or the server. The persist
  // effect uses it to tell an external load apart from a local edit.
  const externalDataRef = useRef<StudyData | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    loadedKeyRef.current = loadedKey;
  }, [loadedKey]);

  useEffect(() => {
    userRef.current = user;
    tokenRef.current = token;
  }, [token, user]);

  useEffect(() => {
    repositoryRef.current = repository;
  }, [repository]);

  useEffect(() => {
    let cancelled = false;

    setSync({ status: 'idle', lastSyncedAt: null });
    syncMetadataRef.current = null;

    if (!repository || !storageKey || userId === null) {
      setData(EMPTY_STUDY_DATA);
      setLoadedKey(null);
      setIsRestoring(false);
      return;
    }

    setIsRestoring(true);

    Promise.all([
      repository.load().catch(() => null),
      loadSyncMetadata(userId).catch(() => null),
    ])
      .then(([stored, metadata]) => {
        if (cancelled) {
          return;
        }

        const loaded = stored ?? EMPTY_STUDY_DATA;
        const nextMetadata = metadata ?? initialSyncMetadata(loaded);

        // Loading is not an edit, so it must not mark the plan as unsynced.
        externalDataRef.current = loaded;
        setData(loaded);
        syncMetadataRef.current = nextMetadata;
        syncRetriesRef.current = 0;
        setSync({ status: 'idle', lastSyncedAt: nextMetadata.lastSyncedAt });
        setLoadedKey(storageKey);

        if (!metadata) {
          saveSyncMetadata(userId, nextMetadata).catch(() => undefined);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsRestoring(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [repository, storageKey, userId]);

  useEffect(() => {
    if (!repository || loadedKey !== storageKey) {
      return;
    }

    repository.save(data).catch(() => undefined);

    if (externalDataRef.current === data) {
      externalDataRef.current = null;
      return;
    }

    const metadata = syncMetadataRef.current;

    if (!metadata || userId === null) {
      return;
    }

    // Record the edit so the sync can tell which side is newer.
    const next = createPendingMetadata(metadata);
    syncMetadataRef.current = next;
    saveSyncMetadata(userId, next).catch(() => undefined);
  }, [data, loadedKey, repository, storageKey, userId]);

  const runSync = useCallback(async () => {
    const currentUser = userRef.current;
    const tokenValue = tokenRef.current;
    const metadata = syncMetadataRef.current;
    const loaded = loadedKeyRef.current;

    if (!currentUser || !tokenValue || !metadata || syncingRef.current) {
      return;
    }

    // Only the plan currently loaded for this user may be synced.
    if (loaded !== studyStorageKey(currentUser.id)) {
      return;
    }

    syncingRef.current = true;
    setSync((current) => ({ ...current, status: 'syncing' }));

    let retry = false;

    try {
      const remote = await fetchStudyPlan(tokenValue);
      const localMetadata = syncMetadataRef.current ?? metadata;
      const decision = decideSync(localMetadata, remote, dataRef.current);

      if (decision === 'pull') {
        // An edit made while the request was in flight must not be discarded.
        if (
          localMetadata.pending &&
          localMetadata.localUpdatedAt !== metadata.localUpdatedAt
        ) {
          retry = true;
        } else if (remote.data) {
          const syncedAt = remote.updatedAt ?? new Date().toISOString();
          const nextMetadata: SyncMetadata = {
            revision: remote.revision,
            lastSyncedAt: syncedAt,
            localUpdatedAt: syncedAt,
            pending: false,
          };

          // Store the plan before its bookkeeping, so a crash can never leave
          // metadata pointing at a revision the local copy does not contain.
          await repositoryRef.current?.save(remote.data);
          syncMetadataRef.current = nextMetadata;
          await saveSyncMetadata(currentUser.id, nextMetadata);
          externalDataRef.current = remote.data;
          setData(remote.data);
          setSync({ status: 'synced', lastSyncedAt: syncedAt });
          syncRetriesRef.current = 0;
        }
      } else if (decision === 'push') {
        const sentUpdatedAt = localMetadata.localUpdatedAt;

        try {
          const saved = await saveStudyPlan(
            tokenValue,
            dataRef.current,
            remote.revision
          );
          const latest = syncMetadataRef.current ?? localMetadata;
          const changedDuringPush = latest.localUpdatedAt !== sentUpdatedAt;
          const syncedAt = new Date().toISOString();
          const nextMetadata: SyncMetadata = {
            revision: saved.revision,
            lastSyncedAt: syncedAt,
            // Compare future edits against the server's clock for this write.
            localUpdatedAt: changedDuringPush
              ? latest.localUpdatedAt
              : saved.updatedAt ?? syncedAt,
            pending: changedDuringPush,
          };

          syncMetadataRef.current = nextMetadata;
          await saveSyncMetadata(currentUser.id, nextMetadata);
          setSync({ status: 'synced', lastSyncedAt: syncedAt });
          syncRetriesRef.current = 0;
          retry = changedDuringPush;
        } catch (err) {
          if (err instanceof StudyConflictError) {
            // Re-fetch: the next pass compares timestamps and picks a winner.
            retry = true;
          } else {
            throw err;
          }
        }
      } else {
        syncRetriesRef.current = 0;
        setSync((current) => ({
          ...current,
          status: 'synced',
          lastSyncedAt: current.lastSyncedAt ?? metadata.lastSyncedAt,
        }));
      }
    } catch (err) {
      // A response means the server was reachable; no response means offline.
      const reachedServer = err instanceof ApiError && err.status !== undefined;

      setSync((current) => ({
        ...current,
        status: reachedServer ? 'error' : 'offline',
      }));
    } finally {
      syncingRef.current = false;

      if (retry && syncRetriesRef.current < 2) {
        syncRetriesRef.current += 1;

        if (retryTimerRef.current) {
          clearTimeout(retryTimerRef.current);
        }

        retryTimerRef.current = setTimeout(() => {
          void runSync();
        }, 900);
      } else if (retry) {
        setSync((current) => ({ ...current, status: 'error' }));
      }
    }
  }, []);

  const syncNow = useCallback(() => {
    syncRetriesRef.current = 0;
    void runSync();
  }, [runSync]);

  useEffect(() => {
    // Pull once the local plan and its sync bookkeeping are both loaded.
    if (!token || !loadedKey || loadedKey !== storageKey) {
      return;
    }

    void runSync();
  }, [loadedKey, runSync, storageKey, token]);

  useEffect(() => {
    // Changes sync shortly after they happen. Failures stay pending and are
    // retried on the next edit, when the app returns to the foreground, or when
    // the user taps Sync now.
    if (!loadedKey || loadedKey !== storageKey) {
      return;
    }

    const timer = setTimeout(() => {
      void runSync();
    }, 1500);

    return () => clearTimeout(timer);
  }, [data, loadedKey, runSync, storageKey]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void runSync();
      }
    });

    return () => subscription.remove();
  }, [runSync]);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Only mirror a plan that has actually been restored for this account.
    if (!preferencesReady || loadedKey !== storageKey) {
      return;
    }

    const reminderSync = remindersEnabled
      ? syncReminders(data)
      : cancelReminders();

    reminderSync.catch(() => undefined);
  }, [data, loadedKey, preferencesReady, remindersEnabled, storageKey]);

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
      // Its countdown has nothing left to log to.
      setTimers((current) => {
        if (!(id in current)) {
          return current;
        }

        const next = { ...current };
        delete next[id];

        return next;
      });

      change((current) => {
        // Sessions logged from this subject's tasks are study time created by
        // those tasks, so they go too. Timer sessions (no task) stay as history.
        const removedTaskIds = new Set(
          current.tasks
            .filter((task) => task.subjectId === id)
            .map((task) => task.id)
        );

        return {
          ...current,
          subjects: current.subjects.filter((subject) => subject.id !== id),
          tasks: current.tasks.filter((task) => task.subjectId !== id),
          sessions: current.sessions.filter(
            (session) => !session.taskId || !removedTaskIds.has(session.taskId)
          ),
          // Exams keep their countdown, but the reference to the gone subject
          // is dropped so no screen has to render a "removed subject" label.
          events: current.events.map((event) =>
            event.subjectId === id ? { ...event, subjectId: undefined } : event
          ),
        };
      });
    },
    [change]
  );

  const addTask = useCallback(
    (input: TaskInput) => {
      change((current) => ({
        ...current,
        tasks: [...current.tasks, { id: createId(), ...input }],
      }));
    },
    [change]
  );

  const updateTask = useCallback(
    (id: string, input: TaskInput) => {
      change((current) => ({
        ...current,
        tasks: current.tasks.map((task) =>
          task.id === id
            ? { ...task, ...input, reminderTime: input.reminderTime }
            : task
        ),
      }));
    },
    [change]
  );

  const removeTask = useCallback(
    (id: string) => {
      change((current) => ({
        ...current,
        tasks: current.tasks.filter((task) => task.id !== id),
        // Deleting a task reverts the study time it logged.
        sessions: current.sessions.filter(
          (session) => session.taskId !== id
        ),
      }));
    },
    [change]
  );

  const logSession = useCallback(
    (input: SessionInput) => {
      const date = todayKey();

      change((current) => {
        const finished =
          input.accumulate && input.taskId
            ? current.sessions.find(
                (session) =>
                  session.taskId === input.taskId &&
                  session.date === date &&
                  session.status === 'done'
              )
            : undefined;

        if (finished) {
          // A second focus block on the same timer task adds to the day's time.
          return {
            ...current,
            sessions: current.sessions.map((session) =>
              session.id === finished.id
                ? {
                    ...session,
                    minutes:
                      session.minutes +
                      (input.status === 'done' ? input.minutes : 0),
                  }
                : session
            ),
          };
        }

        return {
          ...current,
          sessions: [
            // Ticking a task again replaces that task's session for the day.
            ...current.sessions.filter(
              (session) =>
                !input.taskId ||
                !(session.taskId === input.taskId && session.date === date)
            ),
            {
              id: createId(),
              date,
              minutes: input.status === 'done' ? input.minutes : 0,
              status: input.status,
              subjectId: input.subjectId,
              taskId: input.taskId,
              eventId: input.eventId,
            },
          ],
        };
      });
    },
    [change]
  );

  const addEvent = useCallback(
    (input: EventInput) => {
      const fields = toEventFields(input);

      change((current) => ({
        ...current,
        events: [...current.events, { id: createId(), ...fields }],
      }));
    },
    [change]
  );

  const planExam = useCallback(
    (input: EventInput) => {
      const fields = toEventFields({ ...input, kind: 'exam' });

      change((current) => {
        const event: StudyEvent = { id: createId(), ...fields };

        return {
          ...current,
          events: [...current.events, event],
          // The exam defines the plan; the tasks are generated from it.
          tasks: [...current.tasks, ...buildExamPrepTasks(event, todayKey())],
        };
      });
    },
    [change]
  );

  const updateEvent = useCallback(
    (id: string, input: EventInput) => {
      const fields = toEventFields(input);

      change((current) => ({
        ...current,
        events: current.events.map((event) =>
          event.id === id ? { ...event, ...fields } : event
        ),
        tasks:
          fields.kind === 'exam'
            ? current.tasks.map((task) =>
                task.eventId === id
                  ? {
                      ...task,
                      title: `Exam prep: ${fields.title}`,
                      ...(fields.subjectId
                        ? { subjectId: fields.subjectId }
                        : {}),
                    }
                  : task
              )
            : current.tasks.filter((task) => task.eventId !== id),
      }));
    },
    [change]
  );

  const removeEvent = useCallback(
    (id: string) => {
      change((current) => {
        const prepTaskIds = new Set(
          current.tasks
            .filter((task) => task.eventId === id)
            .map((task) => task.id)
        );

        return {
          ...current,
          events: current.events.filter((event) => event.id !== id),
          // Preparation tasks have no meaning without their exam, and the
          // study time they logged is reverted with them.
          tasks: current.tasks.filter((task) => task.eventId !== id),
          sessions: current.sessions.filter(
            (session) =>
              session.eventId !== id &&
              (!session.taskId || !prepTaskIds.has(session.taskId))
          ),
        };
      });
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

  // The subject whose timer the focus screen shows. Falls back to the first
  // subject when the chosen one is gone.
  const timerSubjectId =
    activeSubjectId && data.subjects.some((s) => s.id === activeSubjectId)
      ? activeSubjectId
      : data.subjects[0]?.id ?? null;

  const activeTimer = timerSubjectId
    ? timers[timerSubjectId] ?? defaultFocusTimer()
    : defaultFocusTimer();

  const runningEntry = Object.entries(timers).find(
    ([, state]) => state.isRunning
  );
  const runningTimer = runningEntry
    ? { subjectId: runningEntry[0], timer: runningEntry[1] }
    : null;
  const runningSubjectId = runningEntry?.[0] ?? null;

  // `subjectId:minutes` for every focus block counting down, so the task effect
  // only re-runs when one starts, stops or changes length — not every tick.
  const runningFocusSignature = Object.entries(timers)
    .filter(([, state]) => state.isRunning && state.phase === 'focus')
    .map(([subjectId, state]) => `${subjectId}:${state.minutes}`)
    .sort()
    .join(',');

  const finishedSubjectId = Object.entries(timers).find(
    ([, state]) => state.isRunning && state.secondsLeft === 0
  )?.[0];
  const finishedTimer = finishedSubjectId ? timers[finishedSubjectId] : null;

  useEffect(() => {
    // A running focus block gets a task for its subject and day. Pausing and
    // resuming finds the same task, so a session is never split across
    // duplicates.
    if (!runningFocusSignature) {
      return;
    }

    const date = todayKey();
    const wanted = runningFocusSignature.split(',').map((entry) => {
      const [subjectId, minutes] = entry.split(':');

      return { subjectId, minutes: Number(minutes) };
    });

    change((current) => {
      const missing = wanted.filter(
        ({ subjectId }) =>
          current.subjects.some((subject) => subject.id === subjectId) &&
          !timerTaskOn(current, subjectId, date)
      );

      if (!missing.length) {
        return current;
      }

      return {
        ...current,
        tasks: [
          ...current.tasks,
          ...missing.map(({ subjectId, minutes }) => ({
            id: createId(),
            title: 'Focus session',
            subjectId,
            weekdays: [] as number[],
            date,
            minutes,
            timer: true,
          })),
        ],
      };
    });
  }, [change, runningFocusSignature]);

  useEffect(() => {
    if (!runningSubjectId) {
      return;
    }

    const tick = setInterval(() => {
      setTimers((current) => {
        const running = current[runningSubjectId];

        if (!running?.isRunning) {
          return current;
        }

        return {
          ...current,
          [runningSubjectId]: {
            ...running,
            secondsLeft: Math.max(0, running.secondsLeft - 1),
          },
        };
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [runningSubjectId]);

  useEffect(() => {
    // A finished phase advances that subject's cycle: a focus block logs the
    // session it stood for and leads into a break; a break leads back into the
    // next focus block. The countdown keeps running through both.
    if (!finishedSubjectId || !finishedTimer) {
      return;
    }

    if (finishedTimer.phase === 'focus') {
      const completedPomodoros = finishedTimer.completedPomodoros + 1;
      const phase = breakAfter(completedPomodoros);
      const timerTask = timerTaskOn(data, finishedSubjectId, todayKey());

      logSession({
        subjectId: finishedSubjectId,
        minutes: finishedTimer.minutes,
        status: 'done',
        taskId: timerTask?.id,
        // Several pomodoros on the same task add up on that day's session.
        accumulate: Boolean(timerTask),
      });

      setTimers((current) => ({
        ...current,
        [finishedSubjectId]: {
          ...current[finishedSubjectId],
          phase,
          secondsLeft: phaseMinutes(phase, finishedTimer.minutes) * 60,
          completedPomodoros,
          isRunning: true,
        },
      }));
      return;
    }

    setTimers((current) => ({
      ...current,
      [finishedSubjectId]: {
        ...current[finishedSubjectId],
        phase: 'focus',
        secondsLeft: finishedTimer.minutes * 60,
        isRunning: true,
      },
    }));
  }, [data, finishedSubjectId, finishedTimer, logSession]);

  useEffect(() => {
    // Signing out should not leave a countdown running in the background, and
    // another account's subjects never share these.
    setTimers({});
    setActiveSubjectId(null);
  }, [user?.id]);

  const setTimerSubject = useCallback((subjectId: string) => {
    // Each subject owns its countdown, so this only changes what the focus
    // screen shows — nothing is stopped or reset.
    setActiveSubjectId(subjectId);
  }, []);

  const setTimerMinutes = useCallback(
    (minutes: number) => {
      if (!timerSubjectId) {
        return;
      }

      setTimers((current) => {
        const timer = current[timerSubjectId] ?? defaultFocusTimer();

        return {
          ...current,
          [timerSubjectId]: {
            ...timer,
            minutes,
            // A stopped focus block jumps to the new length; a running
            // countdown or a break keeps its remaining time.
            secondsLeft:
              timer.phase === 'focus' && !timer.isRunning
                ? minutes * 60
                : timer.secondsLeft,
          },
        };
      });
    },
    [timerSubjectId]
  );

  const toggleTimer = useCallback(() => {
    if (!timerSubjectId) {
      return;
    }

    setTimers((current) => {
      const timer = current[timerSubjectId] ?? defaultFocusTimer();
      const next: FocusTimer = timer.isRunning
        ? { ...timer, isRunning: false }
        : {
            ...timer,
            // Resuming a block that already ran out restarts its phase.
            secondsLeft:
              timer.secondsLeft === 0
                ? phaseMinutes(timer.phase, timer.minutes) * 60
                : timer.secondsLeft,
            isRunning: true,
          };

      // Only one countdown runs at a time, so starting one pauses any other.
      // The paused one keeps its seconds, ready to resume later.
      const paused = Object.fromEntries(
        Object.entries(current).map(([id, state]) => [
          id,
          id !== timerSubjectId && state.isRunning
            ? { ...state, isRunning: false }
            : state,
        ])
      );

      return { ...paused, [timerSubjectId]: next };
    });
  }, [timerSubjectId]);

  const resetTimer = useCallback(() => {
    if (!timerSubjectId) {
      return;
    }

    setTimers((current) => {
      const timer = current[timerSubjectId] ?? defaultFocusTimer();

      return {
        ...current,
        [timerSubjectId]: {
          ...timer,
          phase: 'focus',
          secondsLeft: timer.minutes * 60,
          isRunning: false,
          completedPomodoros: 0,
        },
      };
    });
  }, [timerSubjectId]);

  const clearTaskSession = useCallback(
    (taskId: string) => {
      const date = todayKey();

      change((current) => ({
        ...current,
        sessions: current.sessions.filter(
          (session) => !(session.taskId === taskId && session.date === date)
        ),
      }));
    },
    [change]
  );

  const value = useMemo(
    () => ({
      data,
      isRestoring,
      clearTaskSession,
      timer: { ...activeTimer, subjectId: timerSubjectId },
      runningTimer,
      setTimerSubject,
      setTimerMinutes,
      toggleTimer,
      resetTimer,
      addSubject,
      updateSubject,
      removeSubject,
      addTask,
      updateTask,
      removeTask,
      logSession,
      addEvent,
      planExam,
      updateEvent,
      removeEvent,
      toggleRestDay,
      sync,
      syncNow,
    }),
    [
      data,
      isRestoring,
      clearTaskSession,
      activeTimer,
      timers,
      timerSubjectId,
      runningTimer,
      setTimerSubject,
      setTimerMinutes,
      toggleTimer,
      resetTimer,
      addSubject,
      updateSubject,
      removeSubject,
      addTask,
      updateTask,
      removeTask,
      logSession,
      addEvent,
      planExam,
      updateEvent,
      removeEvent,
      toggleRestDay,
      sync,
      syncNow,
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
