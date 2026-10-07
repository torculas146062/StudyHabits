import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Card,
  Divider,
  Icon,
  IconButton,
  Text,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';

import { EmptyState } from '../../components/EmptyState';
import { FocusTimerCard } from '../../components/FocusTimerCard';
import { HabitList } from '../../components/HabitList';
import { MetricCard } from '../../components/MetricCard';
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
  completedHabitCount,
  habitsOn,
  hasStudyOn,
  minutesOn,
  studiedDates,
  subjectMinutesOn,
  weeklyMinutes,
} from '../../study/selectors';

export function Home() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp<HomeParamList>>();
  const { user } = useAuth();
  const { data } = useStudy();
  const [subjectDialog, setSubjectDialog] = useState(false);

  const date = todayKey();
  const planned = habitsOn(data, date);
  const completed = completedHabitCount(data, date);
  const minutes = minutesOn(data.sessions, date);
  const streak = streakLength(studiedDates(data.sessions));
  const weekMinutes = weeklyMinutes(data.sessions, date);
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
        <IconButton
          icon="account-circle"
          size={32}
          accessibilityLabel="Open profile"
          onPress={() =>
            navigation.getParent()?.navigate('Profile', { user: firstName })
          }
        />
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
          value={minutesLabel(minutes)}
          note="studied today"
        />
        <MetricCard
          icon="check-circle-outline"
          label="Completed"
          value={`${completed} / ${planned.length}`}
          note="habits today"
        />
        <MetricCard
          icon="target"
          label="Weekly goal"
          value={`${goalProgress}%`}
          note={`of ${minutesLabel(WEEKLY_GOAL_MINUTES)}`}
        />
      </View>

      <SectionHeader
        title="Today's plan"
        hint={`${planned.length} habit${planned.length === 1 ? '' : 's'} on your schedule`}
        action="See all"
        onAction={() => navigation.navigate('Todo')}
      />
      <Card mode="outlined">
        <Card.Content style={styles.list}>
          <HabitList date={date} />
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
        <Card.Content style={styles.list}>
          {data.subjects.length ? (
            data.subjects.map((subject, index) => (
              <SubjectProgressRow
                key={subject.id}
                name={subject.name}
                index={index}
                minutes={subjectMinutesOn(data.sessions, subject.id, date)}
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

      <FocusTimerCard
        onPress={() => navigation.getParent()?.navigate('Focus')}
      />

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
