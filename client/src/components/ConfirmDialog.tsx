import { Button, Dialog, Text, useTheme } from 'react-native-paper';

import { AppDialog, DialogBody } from './AppDialog';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Asks before an action that discards saved data. Deleting a subject or task
 * also drops the sessions it logged, so it cannot be undone from the UI.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const theme = useTheme();

  return (
    <AppDialog visible={visible} onDismiss={onCancel}>
      <Dialog.Title>{title}</Dialog.Title>
      <DialogBody>
        <Text variant="bodyMedium">{message}</Text>
      </DialogBody>
      <Dialog.Actions>
        <Button onPress={onCancel}>Cancel</Button>
        <Button onPress={onConfirm} textColor={theme.colors.error}>
          {confirmLabel}
        </Button>
      </Dialog.Actions>
    </AppDialog>
  );
}
