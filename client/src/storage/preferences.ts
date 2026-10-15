import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDERS_KEY = 'studyhabits.reminders.enabled';
const DND_KEY = 'studyhabits.dnd.mode';

/** How the focus timer should treat the device's Do Not Disturb setting. */
export const DND_MODES = ['ask', 'always', 'never'] as const;

export type DndMode = (typeof DND_MODES)[number];

export const DEFAULT_DND_MODE: DndMode = 'ask';

/** Reminders stay off until the user opts in, so nothing prompts on launch. */
export const DEFAULT_REMINDERS_ENABLED = false;

function isDndMode(value: unknown): value is DndMode {
  return (
    typeof value === 'string' && (DND_MODES as readonly string[]).includes(value)
  );
}

export async function loadRemindersEnabled(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(REMINDERS_KEY);

  return stored === null ? DEFAULT_REMINDERS_ENABLED : stored === 'true';
}

export async function saveRemindersEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(REMINDERS_KEY, String(enabled));
}

export async function loadDndMode(): Promise<DndMode> {
  const stored = await AsyncStorage.getItem(DND_KEY);

  return isDndMode(stored) ? stored : DEFAULT_DND_MODE;
}

export async function saveDndMode(mode: DndMode): Promise<void> {
  await AsyncStorage.setItem(DND_KEY, mode);
}
