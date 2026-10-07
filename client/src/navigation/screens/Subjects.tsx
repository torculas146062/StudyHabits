import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Divider,
  IconButton,
  List,
  ProgressBar,
  Text,
  useTheme,
} from 'react-native-paper';

import { EmptyState } from '../../components/EmptyState';
import { HabitDialog } from '../../components/HabitDialog';
import { SectionHeader } from '../../components/SectionHeader';
import { SubjectAvatar } from '../../components/SubjectAvatar';
import { SubjectDialog } from '../../components/SubjectDialog';
import { useStudy } from '../../context/StudyContext';
import { WEEKDAY_LABELS, formatShortDay, minutesLabel } from '../../study/date';
import { recentSessions, subjectTotalMinutes } from '../../study/selectors';
import type { Habit, Subject } from '../../study/types';

export function Subjects() {
  const theme = useTheme();
  const { data, removeSubject, removeHabit } = useStudy();
  const [subjectDialog, setSubjectDialog] = useState<{
    open: boolean;
    subject?: Subject;
  }>({ open: false });
  const [habitDialog, setHabitDialog] = useState<{
    open: boolean;
    habit?: Habit;
  }>({ open: false });

  const muted = { color: theme.colors.onSurfaceVariant };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.hero}>
        <Text variant="labelLarge" style={muted}>
          Your study space
        </Text>
        <Text variant="headlineMedium">Make each subject yours.</Text>
        <Text variant="bodyMedium" style={muted}>
          See your progress and shape your routine.
        </Text>
      </View>

      <SectionHeader
        title="Subjects"
        hint={`${data.subjects.length} topic${
          data.subjects.length === 1 ? '' : 's'
        } in your study space`}
        icon="plus"
        action="Add subject"
        onAction={() => setSubjectDialog({ open: true })}
      />

      {data.subjects.length ? (
        data.subjects.map((subject, index) => {
          const habits = data.habits.filter(
            (habit) => habit.subjectId === subject.id
          );
          const total = subjectTotalMinutes(data.sessions, subject.id);
          const recent = recentSessions(data.sessions, subject.id);

          return (
            <Card key={subject.id} mode="outlined">
              <Card.Content style={styles.card}>
                <View style={styles.header}>
                  <SubjectAvatar name={subject.name} index={index} />
                  <View style={styles.headerText}>
                    <Text variant="titleMedium">{subject.name}</Text>
                    <Text variant="bodySmall" style={muted}>
                      {habits.length} habit{habits.length === 1 ? '' : 's'} ·{' '}
                      {minutesLabel(total)} studied
                    </Text>
                  </View>
                  <IconButton
                    icon="pencil-outline"
                    size={20}
                    accessibilityLabel={`Edit ${subject.name}`}
                    onPress={() => setSubjectDialog({ open: true, subject })}
                  />
                  <IconButton
                    icon="delete-outline"
                    size={20}
                    accessibilityLabel={`Delete ${subject.name}`}
                    onPress={() => removeSubject(subject.id)}
                  />
                </View>

                <Text variant="labelLarge" style={muted}>
                  Daily goal · {subject.goalMinutes} min
                </Text>
                {/* Paper sizes ProgressBar's wrapper to 100% height on web, so
                    the slot pins it to the bar's own height. */}
                <View style={styles.barSlot}>
                  <ProgressBar
                    progress={
                      subject.goalMinutes
                        ? Math.min(1, total / subject.goalMinutes)
                        : 0
                    }
                    style={styles.bar}
                  />
                </View>

                <Divider style={styles.divider} />

                {habits.map((habit) => (
                  <List.Item
                    key={habit.id}
                    title={habit.title}
                    description={habit.weekdays
                      .map((weekday) => WEEKDAY_LABELS[weekday])
                      .join(' · ')}
                    right={() => (
                      <View style={styles.actions}>
                        <IconButton
                          icon="pencil-outline"
                          size={20}
                          accessibilityLabel={`Edit ${habit.title}`}
                          onPress={() => setHabitDialog({ open: true, habit })}
                        />
                        <IconButton
                          icon="delete-outline"
                          size={20}
                          accessibilityLabel={`Delete ${habit.title}`}
                          onPress={() => removeHabit(habit.id)}
                        />
                      </View>
                    )}
                  />
                ))}
                <Button
                  icon="plus"
                  onPress={() => setHabitDialog({ open: true })}
                >
                  Add a habit
                </Button>

                <Divider style={styles.divider} />

                <Text variant="labelLarge" style={muted}>
                  Recent sessions
                </Text>
                {recent.length ? (
                  recent.map((session) => (
                    <View key={session.id} style={styles.session}>
                      <Text variant="bodyMedium">
                        {formatShortDay(session.date)}
                      </Text>
                      <Text variant="bodyMedium">
                        {session.status === 'done'
                          ? minutesLabel(session.minutes)
                          : '—'}
                      </Text>
                      <Text
                        variant="labelMedium"
                        style={
                          session.status === 'done'
                            ? { color: theme.colors.primary }
                            : muted
                        }
                      >
                        {session.status === 'done' ? 'Done' : 'Skipped'}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text variant="bodySmall" style={muted}>
                    No sessions recorded yet.
                  </Text>
                )}
              </Card.Content>
            </Card>
          );
        })
      ) : (
        <Card mode="outlined">
          <Card.Content>
            <EmptyState
              title="Start with a subject"
              detail="Add what you are studying to build a routine."
            />
          </Card.Content>
        </Card>
      )}

      <SubjectDialog
        visible={subjectDialog.open}
        subject={subjectDialog.subject}
        onDismiss={() => setSubjectDialog({ open: false })}
      />
      <HabitDialog
        visible={habitDialog.open}
        habit={habitDialog.habit}
        onDismiss={() => setHabitDialog({ open: false })}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 16,
    padding: 16,
    paddingBottom: 32,
  },
  hero: {
    gap: 2,
  },
  card: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  bar: {
    height: 6,
    borderRadius: 3,
  },
  barSlot: {
    height: 6,
  },
  divider: {
    marginVertical: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  session: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
  },
});
