import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Avatar,
  Card,
  Divider,
  Icon,
  Menu,
  Text,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';

import { EmptyState } from '../../components/EmptyState';
import { ExamProgressRow } from '../../components/ExamProgressRow';
import { TaskList } from '../../components/TaskList';
import { MetricCard } from '../../components/MetricCard';
import { ReminderList } from '../../components/ReminderList';
import { SectionHeader } from '../../components/SectionHeader';
import { SubjectDialog } from '../../components/SubjectDialog';
import { SubjectProgressRow } from '../../components/SubjectProgressRow';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import type { HomeParamList } from '../../navigation/homeParamList';
import {
  WEEKDAY_LABELS,
  dateKey,
  formatDay,
  formatMonth,
  greeting,
  minutesLabel,
  streakLength,
  todayKey,
  weekOf,
} from '../../study/date';
import {
  WEEKLY_GOAL_MINUTES,
  completedTaskCount,
  examPreparedMinutes,
  hasStudyOn,
  minutesOn,
  studiedDates,
  subjectMinutesOn,
  tasksOn,
  upcomingExams,
  weeklyMinutes,
} from '../../study/selectors';
import { liveFocusMinutes } from '../../study/timer';

export function Home() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp<HomeParamList>>();
  const { user, signOut } = useAuth();
  const { data, timer } = useStudy();
  const [subjectDialog, setSubjectDialog] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const date = todayKey();
  const planned = tasksOn(data, date);
  const completed = completedTaskCount(data, date);
  // Elapsed time in the running focus block shows live; banked on finish.
  const liveMinutes = liveFocusMinutes(
    timer.phase,
    timer.minutes,
    timer.secondsLeft
  );
  const minutes = minutesOn(data.sessions, date) + liveMinutes;
  const streak = streakLength(studiedDates(data.sessions));
  const exams = upcomingExams(data, date, 3);
  const weekMinutes = weeklyMinutes(data.sessions, date) + liveMinutes;
  const goalProgress = Math.min(
    100,
    Math.round((weekMinutes / WEEKLY_GOAL_MINUTES) * 100)
  );
  const firstName = user?.name.trim().split(/\s+/)[0] ?? 'there';

  const muted = { color: theme.colors.onSurfaceVariant };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.hero}>
        <View style={styles.heroText}>
          <Text variant="labelLarge" style={muted}>
            {formatDay(date)}
          </Text>
          <Text variant="headlineMedium">
            {greeting()}, {firstName}
          </Text>
          <Text variant="bodyMedium" style={muted}>
            A little structure goes a long way.
          </Text>
        </View>
        <Menu
          visible={accountMenuOpen}
          onDismiss={() => setAccountMenuOpen(false)}
          anchor={
            <TouchableRipple
              accessibilityLabel="Open account menu"
              onPress={() => setAccountMenuOpen(true)}
              style={styles.avatarAnchor}
            >
              <Avatar.Text
                size={40}
                label={firstName.charAt(0).toUpperCase() || '?'}
              />
            </TouchableRipple>
          }
        >
          <Menu.Item
            leadingIcon="logout"
            title="Log out"
            onPress={() => {
              setAccountMenuOpen(false);
              signOut();
            }}
          />
        </Menu>
      </View>

      <Card mode="contained" style={styles.streak}>
        <Card.Content style={styles.streakContent}>
          <Icon source="fire" size={24} color={theme.colors.primary} />
          <View style={styles.streakText}>
            <Text variant="titleMedium">
              {streak === 0
                ? 'No streak yet'
                : `${streak} day${streak === 1 ? '' : 's'} in a row`}
            </Text>
            <Text variant="bodySmall" style={muted}>
              {streak === 0
                ? 'Finish a session to start one.'
                : 'Keep it going — today counts too.'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.metrics}>
        <MetricCard
          icon="clock-outline"
          label="Study time"
          value={minutesLabel(Math.floor(minutes))}
          note="studied today"
        />
        <MetricCard
          icon="check-circle-outline"
          label="Completed"
          value={`${completed} / ${planned.length}`}
          note="tasks today"
        />
        <MetricCard
          icon="target"
          label="Weekly goal"
          value={`${goalProgress}%`}
          note={`of ${minutesLabel(WEEKLY_GOAL_MINUTES)}`}
        />
      </View>

      <SectionHeader
        title="Reminders"
        hint="Timed tasks and events for today"
        action="See tasks"
        onAction={() => navigation.navigate('Tasks')}
      />
      <Card mode="outlined">
        <Card.Content style={styles.list}>
          <ReminderList date={date} />
        </Card.Content>
      </Card>

      {exams.length ? (
        <>
          <SectionHeader
            title="Exam countdown"
            hint="Study targets and preparation progress"
          />
          <Card mode="outlined">
            <Card.Content style={styles.list}>
              {exams.map((exam) => (
                <ExamProgressRow
                  key={exam.id}
                  title={exam.title}
                  date={exam.date}
                  subjectName={
                    data.subjects.find((item) => item.id === exam.subjectId)
                      ?.name
                  }
                  preparedMinutes={examPreparedMinutes(
                    data.sessions,
                    exam.id
                  )}
                  targetMinutes={exam.targetMinutes}
                  time={exam.reminderTime}
                />
              ))}
            </Card.Content>
          </Card>
        </>
      ) : null}

      <SectionHeader
        title="Today's plan"
        hint={`${planned.length} task${planned.length === 1 ? '' : 's'} on your schedule`}
        action="See all"
        onAction={() => navigation.navigate('Tasks')}
      />
      <Card mode="outlined">
        <Card.Content style={styles.list}>
          <TaskList date={date} />
        </Card.Content>
      </Card>

      <SectionHeader
        title="Your subjects"
        hint="Progress toward today's goals"
        icon="plus"
        action="Add subject"
        onAction={() => setSubjectDialog(true)}
      />
      <Card mode="outlined">
        <Card.Content style={styles.subjectList}>
          {data.subjects.length ? (
            data.subjects.map((subject, index) => (
              <SubjectProgressRow
                key={subject.id}
                name={subject.name}
                index={index}
                minutes={
                  subjectMinutesOn(data.sessions, subject.id, date) +
                  (timer.subjectId === subject.id ? liveMinutes : 0)
                }
                goalMinutes={subject.goalMinutes}
              />
            ))
          ) : (
            <EmptyState
              title="Start with a subject"
              detail="Add what you are studying to build a routine."
            />
          )}
        </Card.Content>
      </Card>

      <SectionHeader title={formatMonth()} hint="Your week at a glance" />
      <Card mode="outlined">
        <Card.Content>
          <View style={styles.week}>
            {weekOf().map((day) => {
              const key = dateKey(day);
              const studied = hasStudyOn(data.sessions, key);
              const isToday = key === date;

              return (
                <TouchableRipple
                  key={key}
                  style={styles.weekDay}
                  accessibilityLabel={`Open ${formatDay(key)}`}
                  onPress={() => navigation.navigate('Calendar', { date: key })}
                >
                  <View style={styles.weekDayInner}>
                    <Text variant="labelSmall" style={muted}>
                      {WEEKDAY_LABELS[day.getDay()].charAt(0)}
                    </Text>
                    <Text variant={isToday ? 'titleMedium' : 'bodyMedium'}>
                      {day.getDate()}
                    </Text>
                    <View
                      style={[
                        styles.dot,
                        studied
                          ? { backgroundColor: theme.colors.primary }
                          : { backgroundColor: 'transparent' },
                      ]}
                    />
                  </View>
                </TouchableRipple>
              );
            })}
          </View>
          <Divider style={styles.divider} />
          <Text variant="bodySmall" style={muted}>
            {data.sessions.filter((session) => session.status === 'done').length}{' '}
            sessions logged
          </Text>
        </Card.Content>
      </Card>

      <SubjectDialog
        visible={subjectDialog}
        onDismiss={() => setSubjectDialog(false)}
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  heroText: {
    flex: 1,
    gap: 2,
  },
  avatarAnchor: {
    borderRadius: 20,
  },
  streak: {
    marginTop: -4,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  streakText: {
    flex: 1,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  list: {
    paddingHorizontal: 0,
  },
  subjectList: {
    paddingHorizontal: 0,
    paddingVertical: 4,
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
  divider: {
    marginVertical: 12,
  },
});
