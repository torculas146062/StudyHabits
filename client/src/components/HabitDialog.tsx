import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  Chip,
  Dialog,
  Portal,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import { useStudy } from '../context/StudyContext';
import { WEEKDAY_LABELS } from '../study/date';
import type { Habit } from '../study/types';

const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5];

type HabitDialogProps = {
  visible: boolean;
  habit?: Habit;
  onDismiss: () => void;
};

export function HabitDialog({ visible, habit, onDismiss }: HabitDialogProps) {
  const theme = useTheme();
  const { data, addHabit, updateHabit } = useStudy();
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [weekdays, setWeekdays] = useState<number[]>(DEFAULT_WEEKDAYS);

  // Load whatever was opened each time the dialog appears.
  useEffect(() => {
    if (!visible) {
      return;
    }

    setTitle(habit?.title ?? '');
    setSubjectId(habit?.subjectId ?? data.subjects[0]?.id ?? '');
    setWeekdays(habit?.weekdays ?? DEFAULT_WEEKDAYS);
  }, [data.subjects, habit, visible]);

  const toggleDay = (weekday: number) => {
    setWeekdays((current) =>
      current.includes(weekday)
        ? current.filter((day) => day !== weekday)
        : [...current, weekday]
    );
  };

  const save = () => {
    if (!title.trim() || !subjectId || !weekdays.length) {
      return;
    }

    const input = {
      title: title.trim(),
      subjectId,
      weekdays: [...weekdays].sort((a, b) => a - b),
    };

    if (habit) {
      updateHabit(habit.id, input);
    } else {
      addHabit(input);
    }

    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{habit ? 'Edit habit' : 'Add habit'}</Dialog.Title>
        <Dialog.Content style={styles.content}>
          <TextInput
            mode="outlined"
            label="Habit name"
            value={title}
            onChangeText={setTitle}
          />
          <Text
            variant="labelLarge"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Subject
          </Text>
          {data.subjects.length ? (
            <View style={styles.chips}>
              {data.subjects.map((subject) => (
                <Chip
                  key={subject.id}
                  selected={subject.id === subjectId}
                  showSelectedCheck
                  onPress={() => setSubjectId(subject.id)}
                >
                  {subject.name}
                </Chip>
              ))}
            </View>
          ) : (
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Add a subject first — every habit belongs to one.
            </Text>
          )}
          <Text
            variant="labelLarge"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Study days
          </Text>
          <View style={styles.chips}>
            {WEEKDAY_LABELS.map((label, index) => (
              <Chip
                key={label}
                selected={weekdays.includes(index)}
                showSelectedCheck
                onPress={() => toggleDay(index)}
              >
                {label}
              </Chip>
            ))}
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button
            onPress={save}
            disabled={!title.trim() || !subjectId || !weekdays.length}
          >
            {habit ? 'Save changes' : 'Add habit'}
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
