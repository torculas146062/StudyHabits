import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import {
  Dialog,
  Portal,
  type DialogProps,
} from 'react-native-paper';

type AppDialogProps = DialogProps & {
  children: ReactNode;
};

/**
 * Dialog wrapper shared by the app. Paper dialogs have no width cap, so on a
 * tablet, in landscape, or on the web they stretch across the screen; this
 * keeps them to a comfortable reading width and centred.
 */
export function AppDialog({ children, style, ...props }: AppDialogProps) {
  return (
    <Portal>
      <Dialog {...props} style={[styles.dialog, style]}>
        {children}
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    alignSelf: 'center',
    width: '92%',
    maxWidth: 480,
  },
});
