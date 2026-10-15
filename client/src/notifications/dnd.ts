import { Linking, Platform } from 'react-native';

/**
 * Opens the closest system surface for Do Not Disturb. Android has a dedicated
 * DND-access screen; iOS only lets an app deep-link to its own settings, which
 * is where Focus access lives.
 */
export async function openDoNotDisturbSettings(): Promise<void> {
  if (Platform.OS === 'android') {
    const IntentLauncher = await import('expo-intent-launcher');

    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.ZEN_MODE_SETTINGS
    );
    return;
  }

  if (Platform.OS === 'ios') {
    await Linking.openSettings();
  }
}
