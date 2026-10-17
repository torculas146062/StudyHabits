import { useEffect, useState } from 'react';
import { Button, Dialog, Text, TextInput, useTheme } from 'react-native-paper';

import { AppDialog, DialogBody } from './AppDialog';

import { useStudy } from '../context/StudyContext';
import { SUBJECT_GOAL_FALLBACK, type Subject } from '../study/types';

const MAX_GOAL_MINUTES = 24 * 60;

type SubjectDialogProps = {
  visible: boolean;
  subject?: Subject;
  onDismiss: () => void;
};

export function SubjectDialog({
  visible,
  subject,
  onDismiss,
}: SubjectDialogProps) {
  const theme = useTheme();
  const { addSubject, updateSubject } = useStudy();
  const [name, setName] = useState('');
  const [goal, setGoal] = useState(String(SUBJECT_GOAL_FALLBACK));

  // Load whatever was opened each time the dialog appears.
  useEffect(() => {
    if (!visible) {
      return;
    }

    setName(subject?.name ?? '');
    setGoal(String(subject?.goalMinutes ?? SUBJECT_GOAL_FALLBACK));
  }, [subject, visible]);

  const goalMinutes = Number(goal.trim().replace(',', '.'));
  // A zero, negative or fractional goal would break the progress bars that
  // divide by it, so only a whole number of minutes is accepted.
  const goalValid =
    Number.isInteger(goalMinutes) &&
    goalMinutes > 0 &&
    goalMinutes <= MAX_GOAL_MINUTES;

  const save = () => {
    if (!name.trim() || !goalValid) {
      return;
    }

    const input = { name: name.trim(), goalMinutes };

    if (subject) {
      updateSubject(subject.id, input);
    } else {
      addSubject(input);
    }

    onDismiss();
  };

  return (
    <AppDialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>{subject ? 'Edit subject' : 'Add subject'}</Dialog.Title>
      <DialogBody>
        <TextInput
          mode="outlined"
          label="Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          mode="outlined"
          label="Daily goal in minutes"
          keyboardType="number-pad"
          value={goal}
          onChangeText={setGoal}
          error={!goalValid}
        />
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {goalValid
            ? 'How long you aim to study this subject each day.'
            : `Enter a whole number of minutes between 1 and ${MAX_GOAL_MINUTES}.`}
        </Text>
      </DialogBody>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Cancel</Button>
        <Button onPress={save} disabled={!name.trim() || !goalValid}>
          {subject ? 'Save changes' : 'Add subject'}
        </Button>
      </Dialog.Actions>
    </AppDialog>
  );
}

