import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import {
  Button,
  Dialog,
  Portal,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import { useStudy } from '../context/StudyContext';
import { formatDay, fromDateKey } from '../study/date';
import type { StudyEvent } from '../study/types';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type EventDialogProps = {
  visible: boolean;
  event?: StudyEvent;
  date: string;
  onDismiss: () => void;
};

export function EventDialog({
  visible,
  event,
  date,
  onDismiss,
}: EventDialogProps) {
  const theme = useTheme();
  const { addEvent, updateEvent } = useStudy();
  const [title, setTitle] = useState('');
  const [value, setValue] = useState(date);

  // Load whatever was opened each time the dialog appears.
  useEffect(() => {
    if (!visible) {
      return;
    }

    setTitle(event?.title ?? '');
    setValue(event?.date ?? date);
  }, [date, event, visible]);

  const isValidDate =
    DATE_PATTERN.test(value) && !Number.isNaN(fromDateKey(value).getTime());

  const save = () => {
    if (!title.trim() || !isValidDate) {
      return;
    }

    const input = { title: title.trim(), date: value };

    if (event) {
      updateEvent(event.id, input);
    } else {
      addEvent(input);
    }

    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{event ? 'Edit event' : 'Add event'}</Dialog.Title>
        <Dialog.Content style={styles.content}>
          <TextInput
            mode="outlined"
            label="Event name"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            mode="outlined"
            label="Date"
            placeholder="YYYY-MM-DD"
            value={value}
            onChangeText={setValue}
            error={!isValidDate}
          />
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {isValidDate ? formatDay(value) : 'Use the YYYY-MM-DD format.'}
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={save} disabled={!title.trim() || !isValidDate}>
            {event ? 'Save changes' : 'Add event'}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
});
