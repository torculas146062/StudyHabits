import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

/**
 * An earthy, calming green take on Material Design 3. The roles follow the
 * MD3 tonal structure (40/80 primaries, 90/30 containers, sage-tinted
 * neutrals), so every component that reads `theme.colors` picks the palette
 * up with no other changes.
 */
export const GreenLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#406838',
    onPrimary: '#ffffff',
    primaryContainer: '#c6edc1',
    onPrimaryContainer: '#0e200a',
    secondary: '#55624c',
    onSecondary: '#ffffff',
    secondaryContainer: '#d8e7cb',
    onSecondaryContainer: '#121f0e',
    tertiary: '#7a5a3a',
    onTertiary: '#ffffff',
    tertiaryContainer: '#f0dcc2',
    onTertiaryContainer: '#2a1a08',
    surface: '#f7faf3',
    surfaceVariant: '#dee5d8',
    surfaceDisabled: 'rgba(25, 29, 22, 0.12)',
    background: '#f7faf3',
    onSurface: '#191d16',
    onSurfaceVariant: '#42493e',
    onSurfaceDisabled: 'rgba(25, 29, 22, 0.38)',
    onBackground: '#191d16',
    outline: '#72796e',
    outlineVariant: '#c1c9b8',
    inverseSurface: '#2e322b',
    inverseOnSurface: '#f0f2e9',
    inversePrimary: '#a9d39b',
    backdrop: 'rgba(26, 32, 24, 0.4)',
    elevation: {
      level0: 'transparent',
      // Opaque mixes of the primary over the surface, matching how Paper
      // derives its own levels (solid backgrounds avoid shadow transfer).
      level1: 'rgb(238, 243, 234)', // primary, alpha 0.05
      level2: 'rgb(232, 238, 228)', // primary, alpha 0.08
      level3: 'rgb(227, 234, 222)', // primary, alpha 0.11
      level4: 'rgb(225, 232, 221)', // primary, alpha 0.12
      level5: 'rgb(221, 230, 217)', // primary, alpha 0.14
    },
  },
};

export const GreenDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#a9d39b',
    onPrimary: '#173a10',
    primaryContainer: '#2a4f22',
    onPrimaryContainer: '#c6edc1',
    secondary: '#bdcbb0',
    onSecondary: '#283420',
    secondaryContainer: '#3e4a36',
    onSecondaryContainer: '#d8e7cb',
    tertiary: '#d9b98c',
    onTertiary: '#402d0d',
    tertiaryContainer: '#5a4225',
    onTertiaryContainer: '#f0dcc2',
    surface: '#10140e',
    surfaceVariant: '#42493e',
    surfaceDisabled: 'rgba(226, 228, 218, 0.12)',
    background: '#10140e',
    onSurface: '#e2e4da',
    onSurfaceVariant: '#c1c9b8',
    onSurfaceDisabled: 'rgba(226, 228, 218, 0.38)',
    onBackground: '#e2e4da',
    outline: '#8b938a',
    outlineVariant: '#42493e',
    inverseSurface: '#e2e4da',
    inverseOnSurface: '#2e322b',
    inversePrimary: '#406838',
    backdrop: 'rgba(8, 11, 7, 0.4)',
    elevation: {
      level0: 'transparent',
      level1: 'rgb(24, 30, 21)', // primary, alpha 0.05
      level2: 'rgb(28, 35, 25)', // primary, alpha 0.08
      level3: 'rgb(33, 41, 30)', // primary, alpha 0.11
      level4: 'rgb(34, 43, 31)', // primary, alpha 0.12
      level5: 'rgb(37, 47, 34)', // primary, alpha 0.14
    },
  },
};
