import {
  useNavigation,
  useRoute,
  type NavigationProp,
} from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Card,
  IconButton,
  List,
  Switch,
  Text,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';

import { EmptyState } from '../../components/EmptyState';
import { EventDialog } from '../../components/EventDialog';
import { ExamProgressRow } from '../../components/ExamProgressRow';
import { SectionHeader } from '../../components/SectionHeader';
import { SubjectAvatar } from '../../components/SubjectAvatar';
import { TaskDialog } from '../../components/TaskDialog';
import { useStudy } from '../../context/StudyContext';
import type { HomeParamList } from '../../navigation/homeParamList';
import {
  WEEKDAY_LABELS,
  dateKey,
  formatDay,
  formatMonth,
  fromDateKey,
  timeLabel,
  todayKey,
  weekOf,
} from '../../study/date';
import {
  eventsOn,
  examPreparedMinutes,
  tasksOn,
  hasPlanOn,
  isRestDay,
} from '../../study/selectors';
import type { StudyEvent } from '../../study/types';

export function Calendar() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp<HomeParamList>>();
  const route = useRoute();
  const { data, toggleRestDay, removeEvent } = useStudy();
  const [eventDialog, setEventDialog] = useState(false);
  const [taskDialog, setTaskDialog] = useState(false);
  const [editing, setEditing] = useState<StudyEvent | undefined>();

  const selected =
    (route.params as { date?: string } | undefined)?.date ?? todayKey();
  const planned = tasksOn(data, selected);
  const events = eventsOn(data, selected);
  const rest = isRestDay(data, selected);
  const weekday = fromDateKey(selected).getDay();
  const taskWeekdays = useMemo(() => [weekday], [weekday]);
  const muted = { color: theme.colors.onSurfaceVariant };

  const openEvent = (event?: StudyEvent) => {
    setEditing(event);
    setEventDialog(true);
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.hero}>
        <Text variant="labelLarge" style={muted}>
          {formatMonth(fromDateKey(selected))}
        </Text>
        <Text variant="headlineMedium">A week with intention.</Text>
        <Text variant="bodyMedium" style={muted}>
          Pick a day to see what it holds.
        </Text>
      </View>

      <Card mode="outlined">
        <Card.Content>
          <View style={styles.week}>
            {weekOf(fromDateKey(selected)).map((day) => {
              const key = dateKey(day);
              const active = key === selected;

              return (
                <TouchableRipple
                  key={key}
                  style={[
                    styles.weekDay,
                    active && {
                      backgroundColor: theme.colors.secondaryContainer,
                    },
                  ]}
                  accessibilityLabel={formatDay(key)}
                  onPress={() => navigation.navigate('Calendar', { date: key })}
                >
                  <View style={styles.weekDayInner}>
                    <Text
                      variant="labelSmall"
                      style={
                        active
                          ? { color: theme.colors.onSecondaryContainer }
                          : muted
                      }
                    >
                      {WEEKDAY_LABELS[day.getDay()].charAt(0)}
                    </Text>
                    <Text
                      variant={active ? 'titleMedium' : 'bodyMedium'}
                      style={
                        active
                          ? { color: theme.colors.onSecondaryContainer }
                          : undefined
                      }
                    >
                      {day.getDate()}
                    </Text>
                    <View
                      style={[
                        styles.dot,
                        hasPlanOn(data, key)
                          ? {
                              backgroundColor: active
                                ? theme.colors.onSecondaryContainer
                                : theme.colors.primary,
                            }
                          : { backgroundColor: 'transparent' },
                      ]}
                    />
                  </View>
                </TouchableRipple>
              );
            })}
          </View>
        </Card.Content>
      </Card>

      <List.Item
        title="Rest day"
        description={rest ? 'Tasks are paused today' : 'Pause tasks for this day'}
        left={(props) => <List.Icon {...props} icon="weather-night" />}
        right={() => (
          <Switch value={rest} onValueChange={() => toggleRestDay(selected)} />
        )}
      />

      <SectionHeader
        title={formatDay(selected)}
        hint={rest ? 'A planned break day' : 'Scheduled tasks and events'}
        icon="calendar-plus"
        action="Add event"
        onAction={() => openEvent()}
        secondaryIcon="plus"
        secondaryAction="Add task"
        onSecondaryAction={() => setTaskDialog(true)}
      />
      <Card mode="outlined">
        <Card.Content style={styles.list}>
          {planned.map((task) => (
            <List.Item
              key={task.id}
              title={task.title}
              description={[
                data.subjects.find((item) => item.id === task.subjectId)
                  ?.name ?? 'Removed subject',
                task.minutes ? `${task.minutes} min` : null,
                task.reminderTime ? timeLabel(task.reminderTime) : null,
              ]
                .filter(Boolean)
                .join(' · ')}
              left={({ style }) => (
                <SubjectAvatar
                  name={
                    data.subjects.find((item) => item.id === task.subjectId)
                      ?.name ?? '?'
                  }
                  index={Math.max(
                    0,
                    data.subjects.findIndex(
                      (item) => item.id === task.subjectId
                    )
                  )}
                  style={style}
                />
              )}
            />
          ))}

          {events.map((event) => {
            const subject = data.subjects.find(
              (item) => item.id === event.subjectId
            );

            return event.kind === 'exam' ? (
              <ExamProgressRow
                key={event.id}
                title={event.title}
                date={event.date}
                subjectName={subject?.name}
                preparedMinutes={examPreparedMinutes(data.sessions, event.id)}
                targetMinutes={event.targetMinutes}
                time={event.reminderTime}
                onEdit={() => openEvent(event)}
                onDelete={() => removeEvent(event.id)}
              />
            ) : (
              <List.Item
                key={event.id}
                title={event.title}
                description={
                  event.reminderTime
                    ? `Reminder at ${timeLabel(event.reminderTime)}`
                    : undefined
                }
                left={(props) => <List.Icon {...props} icon="calendar-check" />}
                right={() => (
                  <View style={styles.actions}>
                    <IconButton
                      icon="pencil-outline"
                      size={20}
                      accessibilityLabel={`Edit ${event.title}`}
                      onPress={() => openEvent(event)}
                    />
                    <IconButton
                      icon="delete-outline"
                      size={20}
                      accessibilityLabel={`Delete ${event.title}`}
                      onPress={() => removeEvent(event.id)}
                    />
                  </View>
                )}
              />
            );
          })}

          {!planned.length && !events.length ? (
            <EmptyState
              icon="calendar-blank-outline"
              title={rest ? 'A rest day' : 'Nothing planned yet'}
              detail={
                rest
                  ? 'Tasks are paused — enjoy the day.'
                  : 'Add a task or event, or enjoy the open space.'
              }
            />
          ) : null}
        </Card.Content>
      </Card>

      <EventDialog
        visible={eventDialog}
        event={editing}
        date={selected}
        onDismiss={() => {
          setEventDialog(false);
          setEditing(undefined);
        }}
      />
      <TaskDialog
        visible={taskDialog}
        initialWeekdays={taskWeekdays}
        onDismiss={() => setTaskDialog(false)}
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
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  weekDay: {
    flex: 1,
    borderRadius: 16,
  },
  weekDayInner: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  list: {
    paddingHorizontal: 0,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
