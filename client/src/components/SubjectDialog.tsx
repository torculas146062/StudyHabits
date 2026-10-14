import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Dialog, TextInput } from 'react-native-paper';

import { AppDialog } from './AppDialog';

import { useStudy } from '../context/StudyContext';
import { SUBJECT_GOAL_FALLBACK, type Subject } from '../study/types';

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

  const save = () => {
    if (!name.trim()) {
      return;
    }

    const input = {
      name: name.trim(),
      goalMinutes: Number(goal) || SUBJECT_GOAL_FALLBACK,
    };

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
      <Dialog.Content style={styles.content}>
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
        />
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Cancel</Button>
        <Button onPress={save} disabled={!name.trim()}>
          {subject ? 'Save changes' : 'Add subject'}
        </Button>
      </Dialog.Actions>
    </AppDialog>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
});
