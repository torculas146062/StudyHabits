import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'studyhabits.theme';

export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

/** Follow the device setting unless the user picks something else. */
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';

function isThemePreference(value: unknown): value is ThemePreference {
  return (
    typeof value === 'string' &&
    (THEME_PREFERENCES as readonly string[]).includes(value)
  );
}

export async function loadThemePreference(): Promise<ThemePreference> {
  const stored = await AsyncStorage.getItem(THEME_KEY);

  return isThemePreference(stored) ? stored : DEFAULT_THEME_PREFERENCE;
}

export async function saveThemePreference(
  preference: ThemePreference
): Promise<void> {
  await AsyncStorage.setItem(THEME_KEY, preference);
}
