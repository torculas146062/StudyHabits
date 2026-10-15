import { StyleSheet } from 'react-native';
import { Chip, List, useTheme } from 'react-native-paper';

import { timeLabel, todayKey } from '../study/date';
import { remindersOn, type Reminder } from '../study/selectors';
import { useStudy } from '../context/StudyContext';
import { EmptyState } from './EmptyState';

type ReminderListProps = {
  date: string;
};

function hasPassed(reminder: Reminder, date: string): boolean {
  const today = todayKey();

  if (date !== today) {
    return date < today;
  }

  const now = new Date();
  const current = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  return reminder.time <= current;
}

/**
 * The timed tasks and events for a day. Mirrors what the reminder scheduler
 * posts, so the dashboard shows the same upcoming items as the notifications.
 */
export function ReminderList({ date }: ReminderListProps) {
  const theme = useTheme();
  const { data } = useStudy();
  const reminders = remindersOn(data, date);

  if (!reminders.length) {
    return (
      <EmptyState
        icon="bell-outline"
        title="No reminders today"
        detail="Give a task or event a time to be reminded about it."
      />
    );
  }

  return (
    <>
      {reminders.map((reminder) => (
        <List.Item
          key={`${reminder.kind}-${reminder.id}`}
          title={reminder.title}
          description={`${timeLabel(reminder.time)} · ${reminder.detail}`}
          left={(props) => (
            <List.Icon
              {...props}
              icon={
                reminder.kind === 'task'
                  ? 'clock-outline'
                  : 'calendar-clock-outline'
              }
            />
          )}
          right={() =>
            reminder.done ? (
              <Chip icon="check" style={styles.chip}>
                Done
              </Chip>
            ) : hasPassed(reminder, date) ? (
              <Chip
                style={styles.chip}
                textStyle={{ color: theme.colors.onSurfaceVariant }}
              >
                Due
              </Chip>
            ) : null
          }
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'center',
  },
});
