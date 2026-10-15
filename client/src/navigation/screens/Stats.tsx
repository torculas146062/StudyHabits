import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Divider, ProgressBar, Text, useTheme } from 'react-native-paper';

import { BarChart } from '../../components/BarChart';
import { EmptyState } from '../../components/EmptyState';
import { MetricCard } from '../../components/MetricCard';
import { SectionHeader } from '../../components/SectionHeader';
import { useStudy } from '../../context/StudyContext';
import {
  WEEKDAY_LABELS,
  formatShortDay,
  fromDateKey,
  minutesLabel,
  streakLength,
  todayKey,
} from '../../study/date';
import {
  completedSessionCount,
  completedTaskCount,
  recentMinutes,
  studiedDates,
  subjectTotalMinutes,
  tasksOn,
  totalMinutes,
} from '../../study/selectors';

export function Stats() {
  const theme = useTheme();
  const { data } = useStudy();

  const date = todayKey();
  const days = recentMinutes(data.sessions, date, 7);
  const weekMinutes = days.reduce((total, day) => total + day.minutes, 0);
  const average = Math.round(weekMinutes / days.length);
  const studied = totalMinutes(data.sessions);
  const sessions = completedSessionCount(data.sessions);
  const streak = streakLength(studiedDates(data.sessions));
  const planned = tasksOn(data, date);
  const completed = completedTaskCount(data, date);
  const completion = planned.length ? completed / planned.length : 0;

  const subjects = data.subjects
    .map((subject) => ({
      ...subject,
      minutes: subjectTotalMinutes(data.sessions, subject.id),
    }))
    .sort((a, b) => b.minutes - a.minutes);
  const subjectTotal = subjects.reduce(
    (total, subject) => total + subject.minutes,
    0
  );

  const muted = { color: theme.colors.onSurfaceVariant };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.hero}>
        <Text variant="labelLarge" style={muted}>
          Your statistics
        </Text>
        <Text variant="headlineMedium">Progress you can see.</Text>
        <Text variant="bodyMedium" style={muted}>
          A picture of the time you have put in.
        </Text>
      </View>

      <View style={styles.metrics}>
        <MetricCard
          icon="chart-timeline-variant"
          label="Time studied"
          value={minutesLabel(studied)}
          note="all time"
        />
        <MetricCard
          icon="fire"
          label="Streak"
          value={`${streak} day${streak === 1 ? '' : 's'}`}
          note="in a row"
        />
        <MetricCard
          icon="counter"
          label="Sessions"
          value={String(sessions)}
          note="completed"
        />
      </View>

      <SectionHeader
        title="Last seven days"
        hint={`${minutesLabel(weekMinutes)} studied · ${minutesLabel(
          average
        )} a day on average`}
      />
      <Card mode="outlined">
        <Card.Content>
          <BarChart
            data={days.map((day) => ({
              label: WEEKDAY_LABELS[fromDateKey(day.date).getDay()].charAt(0),
              value: day.minutes,
            }))}
            formatValue={(value) => String(value)}
            accessibilityLabel={`Daily study minutes: ${days
              .map(
                (day) =>
                  `${formatShortDay(day.date)} ${minutesLabel(day.minutes)}`
              )
              .join(', ')}`}
          />
          <Divider style={styles.divider} />
          <Text variant="bodySmall" style={muted}>
            Bars show minutes per day; the tallest day sets the scale.
          </Text>
        </Card.Content>
      </Card>

      <SectionHeader
        title="Today's tasks"
        hint={`${completed} of ${planned.length} complete`}
      />
      <Card mode="outlined">
        <Card.Content style={styles.summary}>
          {planned.length ? (
            <>
              <View style={styles.barSlot}>
                <ProgressBar progress={completion} style={styles.bar} />
              </View>
              <Text variant="bodySmall" style={muted}>
                {Math.round(completion * 100)}% of today's tasks are done.
              </Text>
            </>
          ) : (
            <Text variant="bodySmall" style={muted}>
              No tasks scheduled today.
            </Text>
          )}
        </Card.Content>
      </Card>

      <SectionHeader title="By subject" hint="Share of all study time" />
      <Card mode="outlined">
        <Card.Content style={styles.subjects}>
          {subjects.length ? (
            subjects.map((subject) => {
              const share = subjectTotal
                ? subject.minutes / subjectTotal
                : 0;

              return (
                <View key={subject.id} style={styles.subjectRow}>
                  <View style={styles.subjectTitles}>
                    <Text variant="titleSmall">{subject.name}</Text>
                    <Text variant="bodySmall" style={muted}>
                      {minutesLabel(subject.minutes)} ·{' '}
                      {Math.round(share * 100)}%
                    </Text>
                  </View>
                  <View style={styles.barSlot}>
                    <ProgressBar progress={share} style={styles.bar} />
                  </View>
                </View>
              );
            })
          ) : (
            <EmptyState
              title="Nothing to chart yet"
              detail="Add a subject and finish a session to see it here."
            />
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
    // Keep wide tablet/browser windows from stretching every row edge to edge.
    maxWidth: 960,
    alignSelf: 'center',
    gap: 16,
    padding: 16,
    paddingBottom: 32,
  },
  hero: {
    gap: 2,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  divider: {
    marginVertical: 12,
  },
  summary: {
    gap: 8,
  },
  subjects: {
    gap: 16,
  },
  subjectRow: {
    gap: 8,
  },
  subjectTitles: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  bar: {
    height: 6,
    borderRadius: 3,
  },
  barSlot: {
    height: 6,
  },
});
