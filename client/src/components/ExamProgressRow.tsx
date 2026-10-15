import { StyleSheet, View } from 'react-native';
import {
  Icon,
  IconButton,
  ProgressBar,
  Text,
  useTheme,
} from 'react-native-paper';

import { formatShortDay, minutesLabel, timeLabel } from '../study/date';
import { daysUntil } from '../study/selectors';

type ExamProgressRowProps = {
  title: string;
  date: string;
  subjectName?: string;
  preparedMinutes: number;
  targetMinutes?: number;
  /** Local `HH:mm` reminder, when one is set. */
  time?: string;
  onEdit?: () => void;
  onDelete?: () => void;
};

function countdown(date: string): string {
  const days = daysUntil(date);

  if (days === 0) {
    return 'Today';
  }

  if (days === 1) {
    return 'Tomorrow';
  }

  return days > 0 ? `In ${days} days` : 'Past';
}

/** One exam with its countdown and preparation progress. */
export function ExamProgressRow({
  title,
  date,
  subjectName,
  preparedMinutes,
  targetMinutes,
  time,
  onEdit,
  onDelete,
}: ExamProgressRowProps) {
  const theme = useTheme();
  const muted = { color: theme.colors.onSurfaceVariant };
  const progress = targetMinutes
    ? Math.min(1, preparedMinutes / targetMinutes)
    : 0;

  return (
    <View style={styles.row}>
      <View style={styles.top}>
        <View
          style={[
            styles.medallion,
            { backgroundColor: theme.colors.tertiaryContainer },
          ]}
        >
          <Icon
            source="calendar-star"
            size={20}
            color={theme.colors.onTertiaryContainer}
          />
        </View>
        <View style={styles.titles}>
          <Text variant="titleSmall">{title}</Text>
          <Text variant="bodySmall" style={muted}>
            {[subjectName, formatShortDay(date), countdown(date), time ? timeLabel(time) : undefined]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
        {onEdit || onDelete ? (
          <View style={styles.actions}>
            {onEdit ? (
              <IconButton
                icon="pencil-outline"
                size={20}
                accessibilityLabel={`Edit ${title}`}
                onPress={onEdit}
              />
            ) : null}
            {onDelete ? (
              <IconButton
                icon="delete-outline"
                size={20}
                accessibilityLabel={`Delete ${title}`}
                onPress={onDelete}
              />
            ) : null}
          </View>
        ) : null}
      </View>

      {targetMinutes ? (
        <>
          <Text variant="bodySmall" style={muted}>
            {minutesLabel(preparedMinutes)} of {minutesLabel(targetMinutes)}{' '}
            prepared
          </Text>
          {/* Paper sizes ProgressBar's wrapper to 100% height on web, so the
              slot pins it to the bar's own height. */}
          <View style={styles.barSlot}>
            <ProgressBar
              progress={progress}
              style={styles.bar}
              accessibilityLabel={`${title}: ${Math.round(progress * 100)}% prepared`}
            />
          </View>
        </>
      ) : (
        <Text variant="bodySmall" style={muted}>
          No study target set — edit the exam to add study hours.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  medallion: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bar: {
    height: 6,
    borderRadius: 3,
  },
  barSlot: {
    height: 6,
  },
});
