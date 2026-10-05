import { Assets as NavigationAssets } from '@react-navigation/elements';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import { Asset } from 'expo-asset';
import { createURL } from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import {
  MD3DarkTheme,
  MD3LightTheme,
  PaperProvider,
  adaptNavigationTheme,
} from 'react-native-paper';
import { Navigation } from './navigation';

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

export function App() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <PaperProvider theme={isDark ? MD3DarkTheme : MD3LightTheme}>
      <Navigation
        theme={isDark ? DarkTheme : LightTheme}
        linking={linking}
        onReady={() => {
          SplashScreen.hideAsync();
        }}
      />
    </PaperProvider>
  );
}
