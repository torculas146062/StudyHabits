import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppDialog } from './AppDialog';
import {
  Button,
  Dialog,
  Checkbox,
  Text,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';

type DndPromptDialogProps = {
  visible: boolean;
  /** The user's choice and whether they asked to remember it. */
  onChoose: (enable: boolean, remember: boolean) => void;
  onDismiss: () => void;
};

/**
 * Reminds the user that focus time works best with device Do Not Disturb on.
 * The OS does not let an app toggle DND itself, so the prompt explains what to
 * change and opens the closest settings screen.
 */
export function DndPromptDialog({
  visible,
  onChoose,
  onDismiss,
}: DndPromptDialogProps) {
  const theme = useTheme();
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    if (visible) {
      setRemember(false);
    }
  }, [visible]);

  return (
    <AppDialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>Silence interruptions?</Dialog.Title>
      <Dialog.Content style={styles.content}>
        <Text variant="bodyMedium">
          Do Not Disturb mutes calls and alerts while the pomodoro timer runs.
          Your device controls the setting, so enable it once in system
          settings.
        </Text>
        <TouchableRipple
          accessibilityRole="checkbox"
          accessibilityState={{ checked: remember }}
          onPress={() => setRemember((current) => !current)}
          style={styles.remember}
        >
          <View style={styles.rememberInner}>
            <Checkbox status={remember ? 'checked' : 'unchecked'} />
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Remember my choice
            </Text>
          </View>
        </TouchableRipple>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={() => onChoose(false, remember)}>Not now</Button>
        <Button onPress={() => onChoose(true, remember)}>
          Enable in settings
        </Button>
      </Dialog.Actions>
    </AppDialog>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 8,
  },
  remember: {
    borderRadius: 8,
    paddingVertical: 4,
  },
  rememberInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
