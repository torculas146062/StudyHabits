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
  PaperProvider,
  adaptNavigationTheme,
} from 'react-native-paper';
import { en, registerTranslation } from 'react-native-paper-dates';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PreferencesProvider } from './context/PreferencesContext';
import { StudyProvider } from './context/StudyContext';
import {
  ThemePreferenceProvider,
  useThemePreference,
} from './context/ThemeContext';
import { resetDeepLinkPath } from './navigation/deepLinkPath';
import { AppNavigation, AuthNavigation } from './navigation';
import { configureForegroundNotifications } from './notifications/reminders';
import { GreenDarkTheme, GreenLightTheme } from './theme';

Asset.loadAsync([...NavigationAssets]);

registerTranslation('en', en);

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
  materialLight: GreenLightTheme,
  materialDark: GreenDarkTheme,
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
  const { isReady: isThemeReady } = useThemePreference();

  // While signed out, bring the web path back to the auth entry point so it
  // can't be replayed into the app stack on the next sign-in.
  useEffect(() => {
    if (!isRestoring && !user) {
      resetDeepLinkPath();
    }
  }, [isRestoring, user]);

  // Keep the splash screen up until the stored session and theme preference
  // have been read, so neither the sign-in screen nor a light theme flashes.
  if (isRestoring || !isThemeReady) {
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
  useEffect(() => {
    configureForegroundNotifications().catch(() => undefined);
  }, []);

  return (
    <ThemePreferenceProvider>
      <PreferencesProvider>
        <AuthProvider>
          <StudyProvider>
            <ThemedNavigation />
          </StudyProvider>
        </AuthProvider>
      </PreferencesProvider>
    </ThemePreferenceProvider>
  );
}

/**
 * Resolves the theme preference into a concrete scheme — following the device
 * when the preference is `system` — and keeps React Native Paper and React
 * Navigation in sync.
 */
function ThemedNavigation() {
  const systemScheme = useColorScheme();
  const { preference } = useThemePreference();

  const isDark =
    preference === 'system' ? systemScheme === 'dark' : preference === 'dark';

  return (
    <PaperProvider theme={isDark ? GreenDarkTheme : GreenLightTheme}>
      <RootNavigation theme={isDark ? DarkTheme : LightTheme} />
    </PaperProvider>
  );
}
