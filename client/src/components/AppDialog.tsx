import type { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  Dialog,
  Portal,
  type DialogProps,
} from 'react-native-paper';

type AppDialogProps = DialogProps & {
  children: ReactNode;
};

/**
 * Dialog wrapper shared by the app.
 *
 * Paper dialogs have no size cap, so on a tablet, in landscape, or on the web
 * they stretch across the screen, and on a phone a tall form runs off the
 * bottom with its actions unreachable. This caps the width, caps the height to
 * the window, and `DialogBody` makes the middle scroll.
 */
export function AppDialog({ children, style, ...props }: AppDialogProps) {
  const { height } = useWindowDimensions();

  return (
    <Portal>
      <Dialog
        {...props}
        style={[styles.dialog, { maxHeight: Math.min(height * 0.9, 720) }, style]}
      >
        {children}
      </Dialog>
    </Portal>
  );
}

type DialogBodyProps = {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * The scrollable middle of a dialog, between its title and its actions.
 * `Dialog.ScrollArea` already shrinks, so the body scrolls once the dialog
 * reaches its maximum height while the title and actions stay put.
 */
export function DialogBody({ children, contentStyle }: DialogBodyProps) {
  return (
    <Dialog.ScrollArea style={styles.scrollArea}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, contentStyle]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </Dialog.ScrollArea>
  );
}

const styles = StyleSheet.create({
  dialog: {
    alignSelf: 'center',
    width: '92%',
    maxWidth: 480,
  },
  scrollArea: {
    // The ScrollView owns the horizontal padding so long fields scroll edge to
    // edge, and the action row sits directly under the content.
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 24,
    gap: 12,
  },
});
