import { Assets as NavigationAssets } from '@react-navigation/elements';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  type Theme,
} from '@react-navigation/native';
import { Asset } from 'expo-asset';
import { createURL } from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import {
  MD3DarkTheme,
  MD3LightTheme,
  PaperProvider,
  adaptNavigationTheme,
} from 'react-native-paper';
import { AuthProvider, useAuth } from './context/AuthContext';
import { resetDeepLinkPath } from './navigation/deepLinkPath';
import { AppNavigation, AuthNavigation } from './navigation';

Asset.loadAsync([...NavigationAssets]);

SplashScreen.preventAutoHideAsync();

const linking = {
  enabled: 'auto' as const,
  prefixes: [createURL('/')],
};

// Derive React Navigation themes from React Native Paper's Material Design 3
// colors so both libraries stay in sync.
const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

const hideSplash = () => {
  SplashScreen.hideAsync();
};

/**
 * Picks the navigator for the current session. Swapping navigators rather than
 * redirecting means the app stack only exists for a signed-in user.
 */
function RootNavigation({ theme }: { theme: Theme }) {
  const { user, isRestoring } = useAuth();

  // While signed out, bring the web path back to the auth entry point so it
  // can't be replayed into the app stack on the next sign-in.
  useEffect(() => {
    if (!isRestoring && !user) {
      resetDeepLinkPath();
    }
  }, [isRestoring, user]);

  // Keep the splash screen up until the stored session has been read, so the
  // sign-in screen never flashes for an already signed-in user.
  if (isRestoring) {
    return null;
  }

  if (user) {
    return (
      <AppNavigation theme={theme} linking={linking} onReady={hideSplash} />
    );
  }

  // The auth stack deliberately has no linking: it keeps `/sign-up` out of the
  // URL, which would otherwise be re-read (and 404) when the app stack mounts
  // after a successful sign-up.
  return <AuthNavigation theme={theme} onReady={hideSplash} />;
}

export function App() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <PaperProvider theme={isDark ? MD3DarkTheme : MD3LightTheme}>
      <AuthProvider>
        <RootNavigation theme={isDark ? DarkTheme : LightTheme} />
      </AuthProvider>
    </PaperProvider>
  );
}
