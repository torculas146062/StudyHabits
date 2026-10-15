import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  Dialog,
  Chip,
  SegmentedButtons,
  Switch,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import { TimeField } from './TimeField';
import { AppDialog } from './AppDialog';
import { useStudy } from '../context/StudyContext';
import { WEEKDAY_LABELS, formatDay, isTimeKey, minutesLabel } from '../study/date';
import type { Task } from '../study/types';

const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5];
const DEFAULT_REMINDER_TIME = '09:00';
const DEFAULT_TASK_MINUTES = 30;
const MAX_TASK_MINUTES = 24 * 60;

type DurationUnit = 'minutes' | 'hours';

const DURATION_UNITS: { value: DurationUnit; label: string }[] = [
  { value: 'minutes', label: 'Min' },
  { value: 'hours', label: 'Hours' },
];

type TaskDialogProps = {
  visible: boolean;
  task?: Task;
  /** Weekday to preselect when the dialog is opened from a calendar day. */
  initialWeekdays?: number[];
  onDismiss: () => void;
};

export function TaskDialog({
  visible,
  task,
  initialWeekdays,
  onDismiss,
}: TaskDialogProps) {
  const theme = useTheme();
  const { data, addTask, updateTask } = useStudy();
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [weekdays, setWeekdays] = useState<number[]>(DEFAULT_WEEKDAYS);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(DEFAULT_REMINDER_TIME);
  const [duration, setDuration] = useState(String(DEFAULT_TASK_MINUTES));
  const [durationUnit, setDurationUnit] =
    useState<DurationUnit>('minutes');

  // Load whatever was opened each time the dialog appears.
  useEffect(() => {
    if (!visible) {
      return;
    }

    setTitle(task?.title ?? '');
    setSubjectId(task?.subjectId ?? data.subjects[0]?.id ?? '');
    setWeekdays(task?.weekdays ?? initialWeekdays ?? DEFAULT_WEEKDAYS);
    setReminderEnabled(Boolean(task?.reminderTime));
    setReminderTime(task?.reminderTime ?? DEFAULT_REMINDER_TIME);

    // A new task starts at the subject's daily goal, which is a sensible
    // default length for one study block.
    const defaultMinutes =
      task?.minutes ??
      data.subjects.find((subject) => subject.id === task?.subjectId)
        ?.goalMinutes ??
      data.subjects[0]?.goalMinutes ??
      DEFAULT_TASK_MINUTES;

    setDuration(String(defaultMinutes));
    setDurationUnit('minutes');
  }, [data.subjects, initialWeekdays, task, visible]);

  const toggleDay = (weekday: number) => {
    setWeekdays((current) =>
      current.includes(weekday)
        ? current.filter((day) => day !== weekday)
        : [...current, weekday]
    );
  };

  const reminderValid = !reminderEnabled || isTimeKey(reminderTime);
  // One-off tasks (such as exam preparation) are pinned to a date instead of
  // repeating weekly, so their weekday selection is not editable here.
  const oneOff = Boolean(task?.date);
  const amount = Number(duration.replace(',', '.'));
  const durationMinutes = Math.round(
    amount * (durationUnit === 'hours' ? 60 : 1)
  );
  const durationValid =
    Number.isFinite(amount) &&
    amount > 0 &&
    durationMinutes > 0 &&
    durationMinutes <= MAX_TASK_MINUTES;
  const canSave =
    title.trim().length > 0 &&
    Boolean(subjectId) &&
    (oneOff || weekdays.length > 0) &&
    reminderValid &&
    durationValid;

  const save = () => {
    if (!canSave) {
      return;
    }

    const input = {
      title: title.trim(),
      subjectId,
      weekdays: [...weekdays].sort((a, b) => a - b),
      minutes: durationMinutes,
      ...(reminderEnabled ? { reminderTime } : {}),
    };

    if (task) {
      updateTask(task.id, input);
    } else {
      addTask(input);
    }

    onDismiss();
  };

  return (
    <AppDialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>{task ? 'Edit task' : 'Add task'}</Dialog.Title>
      <Dialog.Content style={styles.content}>
        <TextInput
          mode="outlined"
          label="Task name"
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
            Add a subject first — every task belongs to one.
          </Text>
        )}
        <Text
          variant="labelLarge"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {oneOff ? 'Scheduled for' : 'Scheduled days'}
        </Text>
        {oneOff && task?.date ? (
          <Text variant="bodyMedium">{formatDay(task.date)}</Text>
        ) : (
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
        )}
        <Text
          variant="labelLarge"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          Study time
        </Text>
        <View style={styles.durationRow}>
          <TextInput
            mode="outlined"
            label="Duration"
            value={duration}
            onChangeText={setDuration}
            keyboardType="decimal-pad"
            error={!durationValid}
            style={styles.durationInput}
          />
          <SegmentedButtons<DurationUnit>
            value={durationUnit}
            onValueChange={setDurationUnit}
            buttons={DURATION_UNITS}
          />
        </View>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {durationValid
            ? `Each check-in logs ${minutesLabel(durationMinutes)}.`
            : 'Enter a duration between 1 minute and 24 hours.'}
        </Text>
        <View style={styles.reminderRow}>
          <View style={styles.reminderText}>
            <Text variant="labelLarge">Remind me</Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              A notification on each scheduled day.
            </Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={setReminderEnabled}
            accessibilityLabel="Add a reminder"
          />
        </View>
        {reminderEnabled ? (
          <TimeField
            label="Reminder time"
            value={reminderTime}
            error={!reminderValid}
            onChange={setReminderTime}
          />
        ) : null}
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Cancel</Button>
        <Button
          onPress={save}
          disabled={!canSave}
        >
          {task ? 'Save changes' : 'Add task'}
        </Button>
      </Dialog.Actions>
    </AppDialog>
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
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationInput: {
    flex: 1,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reminderText: {
    flex: 1,
    gap: 2,
  },
});
