import { Platform } from 'react-native';

/**
 * Clears the current web path so it matches the navigator that is showing.
 *
 * On web the URL doubles as navigation state. The auth screens aren't part of
 * the deep-link config, so a path left over from a signed-in session (say
 * `/settings`) would otherwise be re-applied the next time the app stack
 * mounts — dropping a freshly signed-in user back on that screen.
 */
export function resetDeepLinkPath(): void {
  if (Platform.OS === 'web' && window.location.pathname !== '/') {
    window.history.replaceState(null, '', '/');
  }
}
