import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  Dialog,
  Chip,
  Switch,
  Text,
  TextInput,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';

import { TimeField } from './TimeField';
import { AppDialog } from './AppDialog';
import { useStudy } from '../context/StudyContext';
import {
  dateKey,
  formatDay,
  fromDateKey,
  isTimeKey,
} from '../study/date';
import type { StudyEvent, StudyEventKind } from '../study/types';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_REMINDER_TIME = '09:00';
const MAX_TARGET_HOURS = 1000;

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
  const { data, addEvent, planExam, updateEvent } = useStudy();
  const [title, setTitle] = useState('');
  const [value, setValue] = useState(date);
  const [kind, setKind] = useState<StudyEventKind>('event');
  const [subjectId, setSubjectId] = useState('');
  const [targetHours, setTargetHours] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(DEFAULT_REMINDER_TIME);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Load whatever was opened each time the dialog appears.
  useEffect(() => {
    if (!visible) {
      return;
    }

    setTitle(event?.title ?? '');
    setValue(event?.date ?? date);
    setKind(event?.kind === 'exam' ? 'exam' : 'event');
    setSubjectId(
      event?.subjectId &&
        data.subjects.some((subject) => subject.id === event.subjectId)
        ? event.subjectId
        : data.subjects[0]?.id ?? ''
    );
    setTargetHours(
      event?.targetMinutes ? String(event.targetMinutes / 60) : ''
    );
    setReminderEnabled(Boolean(event?.reminderTime));
    setReminderTime(event?.reminderTime ?? DEFAULT_REMINDER_TIME);
  }, [data.subjects, date, event, visible]);

  const isValidDate =
    DATE_PATTERN.test(value) && !Number.isNaN(fromDateKey(value).getTime());
  const reminderValid = !reminderEnabled || isTimeKey(reminderTime);
  const isExam = kind === 'exam';
  const hours = Number(targetHours.replace(',', '.'));
  const targetValid =
    !isExam ||
    (Number.isFinite(hours) && hours > 0 && hours <= MAX_TARGET_HOURS);
  const canSave =
    title.trim().length > 0 &&
    isValidDate &&
    reminderValid &&
    targetValid &&
    (!isExam || subjectId.length > 0);

  const save = () => {
    if (!canSave) {
      return;
    }

    const input = {
      title: title.trim(),
      date: value,
      kind,
      ...(reminderEnabled ? { reminderTime } : {}),
      ...(isExam
        ? {
            subjectId,
            targetMinutes: Math.round(hours * 60),
          }
        : {}),
    };

    if (event) {
      updateEvent(event.id, input);
    } else if (isExam) {
      planExam(input);
    } else {
      addEvent(input);
    }

    onDismiss();
  };

  return (
    <AppDialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>
        {event
          ? isExam
            ? 'Edit exam'
            : 'Edit event'
          : isExam
            ? 'Plan exam'
            : 'Add event'}
      </Dialog.Title>
      <Dialog.Content style={styles.content}>
        <TextInput
          mode="outlined"
          label={isExam ? 'Exam name' : 'Event name'}
          value={title}
          onChangeText={setTitle}
        />
        <TouchableRipple
          borderless
          onPress={() => setDatePickerOpen(true)}
          accessibilityLabel="Choose a date"
        >
          <View pointerEvents="none">
            <TextInput
              mode="outlined"
              label="Date"
              value={value}
              editable={false}
              error={!isValidDate}
              right={<TextInput.Icon icon="calendar-month-outline" />}
            />
          </View>
        </TouchableRipple>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {isValidDate ? formatDay(value) : 'Choose a valid date.'}
        </Text>
        <DatePickerModal
          locale="en"
          mode="single"
          visible={datePickerOpen}
          date={isValidDate ? fromDateKey(value) : new Date()}
          onDismiss={() => setDatePickerOpen(false)}
          onConfirm={({ date }) => {
            if (date) {
              setValue(dateKey(date));
            }

            setDatePickerOpen(false);
          }}
        />
        <View style={styles.reminderRow}>
          <View style={styles.reminderText}>
            <Text variant="labelLarge">This is an exam</Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Adds a study target and daily preparation tasks.
            </Text>
          </View>
          <Switch
            value={isExam}
            onValueChange={(enabled) =>
              setKind(enabled ? 'exam' : 'event')
            }
            accessibilityLabel="Plan this as an exam"
          />
        </View>
        {isExam ? (
          <>
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
                Add a subject first — exam preparation needs one.
              </Text>
            )}
            <TextInput
              mode="outlined"
              label="Study target (hours)"
              placeholder="e.g. 8"
              value={targetHours}
              onChangeText={setTargetHours}
              keyboardType="decimal-pad"
              error={!targetValid}
            />
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {targetValid
                ? event
                  ? 'Changes the target only; existing preparation tasks stay as they are.'
                  : 'Creates daily preparation tasks up to the day before the exam.'
                : 'Enter a number of hours between 0 and 1000.'}
            </Text>
          </>
        ) : null}
        <View style={styles.reminderRow}>
          <View style={styles.reminderText}>
            <Text variant="labelLarge">Remind me</Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              A notification when the event starts.
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
        <Button onPress={save} disabled={!canSave}>
          {event ? 'Save changes' : isExam ? 'Plan exam' : 'Add event'}
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
