import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Avatar,
  Button,
  Dialog,
  Divider,
  IconButton,
  List,
  SegmentedButtons,
  Switch,
  Text,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppDialog } from '../../components/AppDialog';
import { useAuth } from '../../context/AuthContext';
import {
  usePreferences,
  type DndMode,
} from '../../context/PreferencesContext';
import { useStudy, type StudySyncState } from '../../context/StudyContext';
import {
  useThemePreference,
  type ThemePreference,
} from '../../context/ThemeContext';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const DND_OPTIONS: { value: DndMode; label: string }[] = [
  { value: 'ask', label: 'Ask' },
  { value: 'always', label: 'Always' },
  { value: 'never', label: 'Never' },
];

const DND_HINTS: Record<DndMode, string> = {
  ask: 'Prompt each time a focus block starts',
  always: 'Open Do Not Disturb settings when focus starts',
  never: 'Start focusing without the prompt',
};

function syncDescription({ status, lastSyncedAt }: StudySyncState): string {
  switch (status) {
    case 'syncing':
      return 'Syncing changes with the server…';
    case 'synced':
      return lastSyncedAt
        ? `Synced ${new Date(lastSyncedAt).toLocaleString()}`
        : 'Up to date';
    case 'offline':
      return 'Offline — changes are saved on this device';
    case 'error':
      return 'Sync failed — check the server or sign in again';
    default:
      return lastSyncedAt
        ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}`
        : 'Waiting for the first sync';
  }
}

export function Settings() {
  const theme = useTheme();
  const { user, signOut, deleteAccount } = useAuth();
  const { preference, setPreference } = useThemePreference();
  const {
    remindersEnabled,
    setRemindersEnabled,
    dndMode,
    setDndMode,
  } = usePreferences();
  const { sync, syncNow } = useStudy();
  const [reminderDenied, setReminderDenied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const toggleReminders = async (enabled: boolean) => {
    const applied = await setRemindersEnabled(enabled);

    setReminderDenied(enabled && !applied);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteAccount();
      setDeleteOpen(false);
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : 'Could not delete the account. Please try again.'
      );
    } finally {
      setDeleting(false);
    }
  };

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
          <List.Subheader>Focus and reminders</List.Subheader>
          <List.Item
            title="Task and event reminders"
            description={
              reminderDenied
                ? 'Notifications are blocked — allow them in device settings'
                : 'Notify me when a timed task or event is due'
            }
            left={(props) => <List.Icon {...props} icon="bell-outline" />}
            right={() => (
              <Switch
                value={remindersEnabled}
                onValueChange={toggleReminders}
                accessibilityLabel="Enable task and event reminders"
              />
            )}
          />
          <List.Item
            title="Do Not Disturb"
            description={DND_HINTS[dndMode]}
            left={(props) => <List.Icon {...props} icon="minus-circle-outline" />}
          />
          <View style={styles.themeOptions}>
            <SegmentedButtons<DndMode>
              value={dndMode}
              onValueChange={setDndMode}
              buttons={DND_OPTIONS}
            />
          </View>
          <Text
            variant="bodySmall"
            style={[styles.note, { color: theme.colors.onSurfaceVariant }]}
          >
            The device owns Do Not Disturb, so Study Habits only opens the
            setting for you. The pomodoro timer never changes it on its own.
          </Text>
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Cloud sync</List.Subheader>
          <List.Item
            title="Study plan"
            description={syncDescription(sync)}
            left={(props) => <List.Icon {...props} icon="cloud-sync-outline" />}
            right={() => (
              <IconButton
                icon="sync"
                accessibilityLabel="Sync now"
                disabled={sync.status === 'syncing'}
                onPress={syncNow}
              />
            )}
          />
          <Text
            variant="bodySmall"
            style={[styles.note, { color: theme.colors.onSurfaceVariant }]}
          >
            Every change is saved on this device first. When the server is
            reachable, the plan uploads and your other devices pick it up.
          </Text>
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
          <List.Item
            title="Delete account"
            description="Permanently remove the account and its synced plan"
            titleStyle={{ color: theme.colors.error }}
            left={(props) => (
              <List.Icon
                {...props}
                icon="account-remove-outline"
                color={theme.colors.error}
              />
            )}
            onPress={() => {
              setDeleteError(null);
              setDeleteOpen(true);
            }}
          />
        </List.Section>
      </ScrollView>

      <AppDialog
      visible={deleteOpen}
      dismissable={!deleting}
      onDismiss={() => setDeleteOpen(false)}
      >
        <Dialog.Title>Delete account?</Dialog.Title>
        <Dialog.Content style={styles.deleteContent}>
          <Text variant="bodyMedium">
            This permanently deletes your account and its synced study plan
            from the server, and removes this device's copy. It cannot be
            undone.
          </Text>
          {deleteError ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
              {deleteError}
            </Text>
          ) : null}
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            onPress={() => setDeleteOpen(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onPress={confirmDelete}
            loading={deleting}
            disabled={deleting}
            textColor={theme.colors.error}
          >
            Delete account
          </Button>
        </Dialog.Actions>
      </AppDialog>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingBottom: 24,
  },
  themeOptions: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  note: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  deleteContent: {
    gap: 12,
  },
});
