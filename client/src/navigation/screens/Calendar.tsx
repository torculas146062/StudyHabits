import {
  useNavigation,
  useRoute,
  type NavigationProp,
} from '@react-navigation/native';
import { useState } from 'react';
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
import { SectionHeader } from '../../components/SectionHeader';
import { SubjectAvatar } from '../../components/SubjectAvatar';
import { useStudy } from '../../context/StudyContext';
import type { HomeParamList } from '../../navigation/homeParamList';
import {
  WEEKDAY_LABELS,
  dateKey,
  formatDay,
  formatMonth,
  fromDateKey,
  todayKey,
  weekOf,
} from '../../study/date';
import { eventsOn, habitsOn, hasPlanOn, isRestDay } from '../../study/selectors';
import type { StudyEvent } from '../../study/types';

export function Calendar() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp<HomeParamList>>();
  const route = useRoute();
  const { data, toggleRestDay, removeEvent } = useStudy();
  const [eventDialog, setEventDialog] = useState(false);
  const [editing, setEditing] = useState<StudyEvent | undefined>();

  const selected =
    (route.params as { date?: string } | undefined)?.date ?? todayKey();
  const planned = habitsOn(data, selected);
  const events = eventsOn(data, selected);
  const rest = isRestDay(data, selected);
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
        description={rest ? 'Habits are paused today' : 'Pause habits for this day'}
        left={(props) => <List.Icon {...props} icon="weather-night" />}
        right={() => (
          <Switch value={rest} onValueChange={() => toggleRestDay(selected)} />
        )}
      />

      <SectionHeader
        title={formatDay(selected)}
        hint={rest ? 'A planned break day' : 'Study habits and events'}
        icon="plus"
        action="Add event"
        onAction={() => openEvent()}
      />
      <Card mode="outlined">
        <Card.Content style={styles.list}>
          {planned.map((habit) => (
            <List.Item
              key={habit.id}
              title={habit.title}
              description={
                data.subjects.find((item) => item.id === habit.subjectId)
                  ?.name ?? 'Removed subject'
              }
              left={({ style }) => (
                <SubjectAvatar
                  name={
                    data.subjects.find((item) => item.id === habit.subjectId)
                      ?.name ?? '?'
                  }
                  index={Math.max(
                    0,
                    data.subjects.findIndex(
                      (item) => item.id === habit.subjectId
                    )
                  )}
                  style={style}
                />
              )}
            />
          ))}

          {events.map((event) => (
            <List.Item
              key={event.id}
              title={event.title}
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
          ))}

          {!planned.length && !events.length ? (
            <EmptyState
              icon="calendar-blank-outline"
              title={rest ? 'A rest day' : 'Nothing planned yet'}
              detail={
                rest
                  ? 'Habits are paused — enjoy the day.'
                  : 'Add an event, or enjoy the open space.'
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
