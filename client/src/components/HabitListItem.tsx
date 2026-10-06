import { StyleSheet, View } from 'react-native';
import { Chip, IconButton, List, useTheme } from 'react-native-paper';

import type { SessionStatus } from '../study/types';
import { SubjectAvatar } from './SubjectAvatar';

type HabitListItemProps = {
  title: string;
  subjectName: string;
  subjectIndex: number;
  status?: SessionStatus;
  onDone: () => void;
  onSkip: () => void;
  onClear: () => void;
};

/**
 * A habit with the subject it belongs to, showing either the tick and skip
 * actions or, once it has been answered, the outcome the user can undo.
 */
export function HabitListItem({
  title,
  subjectName,
  subjectIndex,
  status,
  onDone,
  onSkip,
  onClear,
}: HabitListItemProps) {
  const theme = useTheme();

  return (
    <List.Item
      title={title}
      description={subjectName}
      left={({ style }) => (
        <SubjectAvatar
          name={subjectName}
          index={subjectIndex}
          style={style}
        />
      )}
      right={() =>
        status ? (
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
        )
      }
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
