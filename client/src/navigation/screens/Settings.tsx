import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Avatar,
  Divider,
  List,
  SegmentedButtons,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import {
  useThemePreference,
  type ThemePreference,
} from '../../context/ThemeContext';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function Settings() {
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const { preference, setPreference } = useThemePreference();

  return (
    // The header already pads the status bar, so only the other edges are added.
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <List.Section>
          <List.Subheader>Appearance</List.Subheader>
          <List.Item
            title="Theme"
            description="System follows your device setting"
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
          />
          <View style={styles.themeOptions}>
            <SegmentedButtons<ThemePreference>
              value={preference}
              onValueChange={setPreference}
              buttons={THEME_OPTIONS}
            />
          </View>
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Account</List.Subheader>
          {user ? (
            <List.Item
              title={user.name}
              description={user.email}
              // List.Item has no left padding of its own — it hands the inset to
              // the left slot through this style. Only that is applied, so the
              // avatar keeps its own colours (`color` is meant for icons).
              left={({ style }) => (
                <Avatar.Text
                  style={style}
                  size={40}
                  label={user.name.trim().charAt(0).toUpperCase()}
                />
              )}
            />
          ) : null}
          <List.Item
            title="Sign out"
            left={(props) => <List.Icon {...props} icon="logout" />}
            onPress={signOut}
          />
        </List.Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  themeOptions: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});
