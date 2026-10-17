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
import { Calendar } from 'react-native-paper-dates';

import { TimeField } from './TimeField';
import { AppDialog, DialogBody } from './AppDialog';
import { useStudy } from '../context/StudyContext';
import {
  dateKey,
  formatDay,
  fromDateKey,
  isTimeKey,
  todayKey,
} from '../study/date';
import type { StudyEvent, StudyEventKind } from '../study/types';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_REMINDER_TIME = '09:00';
const MAX_TARGET_HOURS = 1000;

/** Minutes as hours for the input, without float noise like `1.6666666666666667`. */
function hoursLabel(minutes: number): string {
  return String(Math.round((minutes / 60) * 100) / 100);
}

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
  // The calendar edits a draft, so cancelling leaves the event's date alone.
  const [draftDate, setDraftDate] = useState(date);

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
      event?.targetMinutes ? hoursLabel(event.targetMinutes) : ''
    );
    setReminderEnabled(Boolean(event?.reminderTime));
    setReminderTime(event?.reminderTime ?? DEFAULT_REMINDER_TIME);
  }, [data.subjects, date, event, visible]);

  const today = todayKey();
  const isValidDate =
    DATE_PATTERN.test(value) && !Number.isNaN(fromDateKey(value).getTime());
  // Events are planned for today or later. A stored past date stays allowed
  // while editing that same event, so older entries remain editable.
  const dateInPast = isValidDate && value < today;
  const dateAllowed = isValidDate && (!dateInPast || event?.date === value);
  const reminderValid = !reminderEnabled || isTimeKey(reminderTime);
  const isExam = kind === 'exam';
  const hours = Number(targetHours.replace(',', '.'));
  const targetValid =
    !isExam ||
    (Number.isFinite(hours) && hours > 0 && hours <= MAX_TARGET_HOURS);
  const canSave =
    title.trim().length > 0 &&
    dateAllowed &&
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
      <DialogBody>
        <TextInput
          mode="outlined"
          label={isExam ? 'Exam name' : 'Event name'}
          value={title}
          onChangeText={setTitle}
        />
        <TouchableRipple
          borderless
          onPress={() => {
            // The picker never shows past days, so start it on today when the
            // field currently holds an earlier date.
            setDraftDate(isValidDate && value >= today ? value : today);
            setDatePickerOpen(true);
          }}
          accessibilityLabel="Choose a date"
        >
          <View pointerEvents="none">
            <TextInput
              mode="outlined"
              label="Date"
              value={value}
              editable={false}
              error={!dateAllowed}
              right={<TextInput.Icon icon="calendar-month-outline" />}
            />
          </View>
        </TouchableRipple>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {!isValidDate
            ? 'Choose a valid date.'
            : dateInPast && !dateAllowed
              ? 'Events can only be planned for today or later.'
              : formatDay(value)}
        </Text>
        <AppDialog
          visible={datePickerOpen}
          onDismiss={() => setDatePickerOpen(false)}
        >
          <Dialog.Title>Choose date</Dialog.Title>
          <DialogBody>
            {/* The calendar's root is `flex: 1`, which collapses to nothing
                inside a scroll view unless something bounds the height. */}
            <View style={styles.calendar}>
              <Calendar
                locale="en"
                mode="single"
                date={fromDateKey(draftDate)}
              validRange={{ startDate: fromDateKey(today) }}
                onChange={({ date: picked }) => {
                  if (picked) {
                    setDraftDate(dateKey(picked));
                  }
                }}
              />
            </View>
          </DialogBody>
          <Dialog.Actions>
            <Button onPress={() => setDatePickerOpen(false)}>Cancel</Button>
            <Button
              onPress={() => {
                setValue(draftDate);
                setDatePickerOpen(false);
              }}
            >
              Done
            </Button>
          </Dialog.Actions>
        </AppDialog>
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
      </DialogBody>
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  calendar: {
    // Tall enough that the month grid never needs to scroll inside the dialog
    // (its pager reports ~400px at the default type scale).
    height: 420,
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
