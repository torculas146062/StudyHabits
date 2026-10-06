import { StyleSheet, View } from 'react-native';
import { Card, Icon, Text, useTheme } from 'react-native-paper';

import { useStudy } from '../context/StudyContext';
import { formatClock } from '../study/timer';

/**
 * A summary of the focus timer on the Home screen. Tapping it opens the
 * full-screen focus mode, where the countdown and its controls live.
 */
export function FocusTimerCard({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  const { data, timer } = useStudy();

  const subject = data.subjects.find((item) => item.id === timer.subjectId);
  const isBreak = timer.phase !== 'focus';
  const status = timer.isRunning
    ? isBreak
      ? timer.phase === 'longBreak'
        ? 'On a long break'
        : 'On a short break'
      : `Focusing${subject ? ` on ${subject.name}` : ''}`
    : isBreak
      ? 'Break paused'
      : timer.secondsLeft < timer.minutes * 60
        ? 'Session paused'
        : 'Open the focus timer';

  return (
    <Card
      mode="contained"
      onPress={onPress}
      accessibilityLabel="Open the focus timer"
    >
      <Card.Content style={styles.content}>
        <View
          style={[
            styles.medallion,
            { backgroundColor: theme.colors.tertiaryContainer },
          ]}
        >
          <Icon
            source="timer-outline"
            size={20}
            color={theme.colors.onTertiaryContainer}
          />
        </View>
        <View style={styles.titles}>
          <Text variant="titleMedium">Focus timer</Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {status}
          </Text>
        </View>
        <Text variant="titleLarge" style={styles.digits}>
          {formatClock(timer.secondsLeft)}
        </Text>
        <Icon
          source="chevron-right"
          size={24}
          color={theme.colors.onSurfaceVariant}
        />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
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
  },
  digits: {
    fontVariant: ['tabular-nums'],
  },
});
