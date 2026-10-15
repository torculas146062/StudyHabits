import { StyleSheet, View } from 'react-native';
import { Chip, IconButton, List, useTheme } from 'react-native-paper';

import { timeLabel } from '../study/date';
import type { SessionStatus } from '../study/types';
import { SubjectAvatar } from './SubjectAvatar';

type TaskListItemProps = {
  title: string;
  subjectName: string;
  subjectIndex: number;
  /** Time the task is planned to take, in minutes. */
  minutes?: number;
  /** Local `HH:mm` reminder, when the task has one. */
  time?: string;
  status?: SessionStatus;
  /** The focus timer owns this task; manual tick/skip actions are hidden. */
  isTimer?: boolean;
  onDone: () => void;
  onSkip: () => void;
  onClear: () => void;
};

/**
 * A task with the subject it belongs to, showing either the tick and skip
 * actions or, once it has been answered, the outcome the user can undo.
 */
export function TaskListItem({
  title,
  subjectName,
  subjectIndex,
  minutes,
  time,
  status,
  isTimer,
  onDone,
  onSkip,
  onClear,
}: TaskListItemProps) {
  const theme = useTheme();
  const description = [
    subjectName,
    minutes ? `${minutes} min` : null,
    time ? timeLabel(time) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const renderTrailing = () => {
    if (isTimer) {
      // The timer logs this task itself, so it is never ticked by hand.
      return (
        <Chip
          icon={status === 'done' ? 'timer-check-outline' : 'timer-outline'}
          accessibilityLabel={
            status === 'done'
              ? `${title} was logged by the focus timer`
              : `${title} is tracked by the focus timer`
          }
          style={styles.chip}
        >
          {status === 'done' ? 'Focused' : 'Timer'}
        </Chip>
      );
    }

    return status ? (
      <Chip
        icon={status === 'done' ? 'check' : 'skip-forward-outline'}
        onPress={onClear}
        accessibilityLabel={`Undo ${title}`}
        style={styles.chip}
      >
        {status === 'done' ? 'Done' : 'Skipped'}
      </Chip>
    ) : (
      <View style={styles.actions}>
        <IconButton
          icon="check"
          mode="contained-tonal"
          size={20}
          accessibilityLabel={`Mark ${title} complete`}
          onPress={onDone}
        />
        <IconButton
          icon="skip-forward-outline"
          size={20}
          iconColor={theme.colors.onSurfaceVariant}
          accessibilityLabel={`Skip ${title}`}
          onPress={onSkip}
        />
      </View>
    );
  };

  return (
    <List.Item
      title={title}
      description={description}
      left={({ style }) => (
        <SubjectAvatar
          name={subjectName}
          index={subjectIndex}
          style={style}
        />
      )}
      right={renderTrailing}
    />
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
