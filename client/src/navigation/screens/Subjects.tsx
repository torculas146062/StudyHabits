import { useNavigation, type NavigationProp } from '@react-navigation/native';
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
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { TaskDialog } from '../../components/TaskDialog';
import { SectionHeader } from '../../components/SectionHeader';
import { SubjectAvatar } from '../../components/SubjectAvatar';
import { SubjectDialog } from '../../components/SubjectDialog';
import { useStudy } from '../../context/StudyContext';
import type { HomeParamList } from '../../navigation/homeParamList';
import { WEEKDAY_LABELS, formatShortDay, minutesLabel, todayKey } from '../../study/date';
import { recentSessions, subjectMinutesOn, subjectTotalMinutes } from '../../study/selectors';
import { liveFocusMinutes } from '../../study/timer';
import type { Subject, Task } from '../../study/types';

export function Subjects() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp<HomeParamList>>();
  const {
    data,
    removeSubject,
    removeTask,
    setTimerSubject,
    runningTimer,
  } = useStudy();
  const [subjectDialog, setSubjectDialog] = useState<{
    open: boolean;
    subject?: Subject;
  }>({ open: false });
  const [taskDialog, setTaskDialog] = useState<{
    open: boolean;
    task?: Task;
  }>({ open: false });
  // Deleting cascades into tasks and logged time, so it asks first.
  const [confirming, setConfirming] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);
  const closeConfirm = () =>
    setConfirming((current) => current && { ...current, visible: false });

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
          const tasks = data.tasks.filter(
            (task) => task.subjectId === subject.id
          );
          const total = subjectTotalMinutes(data.sessions, subject.id);
          const todayMinutes = subjectMinutesOn(
            data.sessions,
            subject.id,
            todayKey()
          );
          // Elapsed time in a running focus block counts toward the goal live;
          // it is banked as a session when the block finishes.
          const liveMinutes =
            runningTimer?.subjectId === subject.id
              ? liveFocusMinutes(
                  runningTimer.timer.phase,
                  runningTimer.timer.minutes,
                  runningTimer.timer.secondsLeft
                )
              : 0;
          const goalMinutes = todayMinutes + liveMinutes;
          const recent = recentSessions(data.sessions, subject.id);

          return (
            <Card key={subject.id} mode="outlined">
              <Card.Content style={styles.card}>
                <View style={styles.header}>
                  <SubjectAvatar name={subject.name} index={index} />
                  <View style={styles.headerText}>
                    <Text variant="titleMedium">{subject.name}</Text>
                    <Text variant="bodySmall" style={muted}>
                      {tasks.length} task{tasks.length === 1 ? '' : 's'} ·{' '}
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
                    onPress={() =>
                      setConfirming({
                        visible: true,
                        title: `Delete ${subject.name}?`,
                        message:
                          'Its tasks and the study time they logged are removed too. This cannot be undone.',
                        confirmLabel: 'Delete subject',
                        onConfirm: () => removeSubject(subject.id),
                      })
                    }
                  />
                </View>

                <Text variant="labelLarge" style={muted}>
                  Daily goal · {minutesLabel(Math.floor(goalMinutes))} of{' '}
                  {minutesLabel(subject.goalMinutes)}
                </Text>
                {/* Paper sizes ProgressBar's wrapper to 100% height on web, so
                    the slot pins it to the bar's own height. */}
                <View style={styles.barSlot}>
                  <ProgressBar
                    progress={
                      subject.goalMinutes
                        ? Math.min(1, goalMinutes / subject.goalMinutes)
                        : 0
                    }
                    style={styles.bar}
                  />
                </View>

                <Button
                  mode="contained-tonal"
                  icon="timer-outline"
                  accessibilityLabel={`Start focusing on ${subject.name}`}
                  onPress={() => {
                    setTimerSubject(subject.id);
                    navigation.getParent()?.navigate('Focus');
                  }}
                >
                  Start focus
                </Button>

                <Divider style={styles.divider} />

                {tasks.map((task) => (
                  <List.Item
                    key={task.id}
                    title={task.title}
                    description={[
                      task.date
                        ? formatShortDay(task.date)
                        : task.weekdays
                            .map((weekday) => WEEKDAY_LABELS[weekday])
                            .join(' · '),
                      task.minutes ? `${task.minutes} min` : null,
                      task.eventId ? 'Exam prep' : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    right={() => (
                      <View style={styles.actions}>
                        <IconButton
                          icon="pencil-outline"
                          size={20}
                          accessibilityLabel={`Edit ${task.title}`}
                          onPress={() => setTaskDialog({ open: true, task })}
                        />
                        <IconButton
                          icon="delete-outline"
                          size={20}
                          accessibilityLabel={`Delete ${task.title}`}
                          onPress={() =>
                            setConfirming({
                              visible: true,
                              title: `Delete ${task.title}?`,
                              message:
                                'The study time this task logged is removed too. This cannot be undone.',
                              confirmLabel: 'Delete task',
                              onConfirm: () => removeTask(task.id),
                            })
                          }
                        />
                      </View>
                    )}
                  />
                ))}
                <Button
                  icon="plus"
                  onPress={() => setTaskDialog({ open: true })}
                >
                  Add a task
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
      <TaskDialog
        visible={taskDialog.open}
        task={taskDialog.task}
        onDismiss={() => setTaskDialog({ open: false })}
      />
      <ConfirmDialog
        visible={Boolean(confirming?.visible)}
        title={confirming?.title ?? ''}
        message={confirming?.message ?? ''}
        confirmLabel={confirming?.confirmLabel ?? ''}
        onCancel={closeConfirm}
        onConfirm={() => {
          confirming?.onConfirm();
          closeConfirm();
        }}
      />
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
