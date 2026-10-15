import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import {
  Button,
  Icon,
  IconButton,
  Menu,
  SegmentedButtons,
  Text,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useStudy } from '../../context/StudyContext';
import { usePreferences } from '../../context/PreferencesContext';
import { DndPromptDialog } from '../../components/DndPromptDialog';
import { openDoNotDisturbSettings } from '../../notifications/dnd';
import {
  FOCUS_DURATIONS,
  POMODOROS_PER_LONG_BREAK,
  formatClock,
  phaseMinutes,
  setProgress,
  type TimerPhase,
} from '../../study/timer';

const PHASE_TITLES: Record<TimerPhase, string> = {
  focus: 'Focus',
  shortBreak: 'Short break',
  longBreak: 'Long break',
};

/**
 * The focus timer on its own screen, following the pomodoro cycle: a focus
 * block, a short break, and a long break every fourth block — advancing on its
 * own. It covers the tabs and header so the countdown is all that is in view,
 * and the timer keeps running from the shared context if the user leaves.
 */
export function Focus() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { data, timer, setTimerSubject, setTimerMinutes, toggleTimer } =
    useStudy();
  const { dndMode, setDndMode } = usePreferences();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dndPromptOpen, setDndPromptOpen] = useState(false);

  const openDndSettings = () => {
    openDoNotDisturbSettings().catch(() => undefined);
  };

  const handleTimerPress = () => {
    if (timer.isRunning) {
      toggleTimer();
      return;
    }

    const startingFocus = timer.phase === 'focus';
    const freshFocus =
      timer.secondsLeft >= phaseMinutes(timer.phase, timer.minutes) * 60;

    // Prompt once per fresh focus block, not every time a paused block resumes.
    // DND is a device setting; there is nothing to prompt for on web.
    if (startingFocus && freshFocus && Platform.OS !== 'web') {
      if (dndMode === 'ask') {
        setDndPromptOpen(true);
        return;
      }

      if (dndMode === 'always') {
        openDndSettings();
      }
    }

    toggleTimer();
  };

  const chooseDnd = (enable: boolean, remember: boolean) => {
    setDndPromptOpen(false);

    if (remember) {
      setDndMode(enable ? 'always' : 'never');
    }

    if (enable) {
      openDndSettings();
    }

    toggleTimer();
  };

  const isBreak = timer.phase !== 'focus';
  const subject = data.subjects.find((item) => item.id === timer.subjectId);
  const hasSubjects = data.subjects.length > 0;
  const phaseTotal = phaseMinutes(timer.phase, timer.minutes) * 60;
  const started = timer.secondsLeft < phaseTotal;
  const done = setProgress(timer.completedPomodoros, timer.phase);

  const subtitle = timer.isRunning
    ? isBreak
      ? 'Step away from the screen'
      : 'Focusing now'
    : started
      ? 'Paused'
      : 'One thing at a time';

  const action = timer.isRunning
    ? isBreak
      ? 'Pause break'
      : 'Pause session'
    : started
      ? isBreak
        ? 'Resume break'
        : 'Resume session'
      : isBreak
        ? 'Start break'
        : 'Start focusing';

  return (
    <SafeAreaView
      edges={['top', 'left', 'right', 'bottom']}
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.topBar}>
        <IconButton
          icon="close"
          size={24}
          accessibilityLabel="Close focus timer"
          onPress={() => navigation.goBack()}
        />
      </View>

      <View style={styles.body}>
        <View
          style={[
            styles.medallion,
            {
              backgroundColor: isBreak
                ? theme.colors.secondaryContainer
                : theme.colors.tertiaryContainer,
            },
          ]}
        >
          <Icon
            source={isBreak ? 'coffee-outline' : 'timer-outline'}
            size={28}
            color={
              isBreak
                ? theme.colors.onSecondaryContainer
                : theme.colors.onTertiaryContainer
            }
          />
        </View>

        <Text variant="titleMedium">{PHASE_TITLES[timer.phase]}</Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {subtitle}
        </Text>

        <Text variant="displayLarge" style={styles.digits}>
          {formatClock(timer.secondsLeft)}
        </Text>

        <View style={styles.round}>
          {Array.from({ length: POMODOROS_PER_LONG_BREAK }, (_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index < done
                      ? theme.colors.primary
                      : theme.colors.surfaceVariant,
                },
              ]}
            />
          ))}
          <Text
            variant="labelMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {isBreak
              ? `${done} of ${POMODOROS_PER_LONG_BREAK} done`
              : `Pomodoro ${done + 1} of ${POMODOROS_PER_LONG_BREAK}`}
          </Text>
        </View>

        {!isBreak ? (
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {subject
              ? `Studying ${subject.name}`
              : hasSubjects
                ? 'Choose a subject to begin'
                : 'Add a subject to begin'}
          </Text>
        ) : (
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {subject ? `Break from ${subject.name}` : 'Rest up'}
          </Text>
        )}
      </View>

      <View style={styles.controls}>
        {!isBreak && (
          <>
            <Menu
              visible={menuOpen}
              onDismiss={() => setMenuOpen(false)}
              anchor={
                <Button
                  mode="outlined"
                  icon="book-open-variant"
                  onPress={() => setMenuOpen(true)}
                  disabled={!hasSubjects}
                >
                  {subject?.name ?? 'Choose subject'}
                </Button>
              }
            >
              {data.subjects.map((item) => (
                <Menu.Item
                  key={item.id}
                  title={item.name}
                  onPress={() => {
                    setTimerSubject(item.id);
                    setMenuOpen(false);
                  }}
                />
              ))}
            </Menu>

            <SegmentedButtons
              value={String(timer.minutes)}
              onValueChange={(value) => setTimerMinutes(Number(value))}
              buttons={FOCUS_DURATIONS.map((minutes) => ({
                value: String(minutes),
                label: `${minutes}m`,
              }))}
            />
          </>
        )}

        <Button
          mode="contained"
          icon={timer.isRunning ? 'pause' : 'play'}
          onPress={handleTimerPress}
          disabled={!hasSubjects && !isBreak}
          contentStyle={styles.startButton}
          labelStyle={styles.startLabel}
        >
          {action}
        </Button>
      </View>

      <DndPromptDialog
        visible={dndPromptOpen}
        onChoose={chooseDnd}
        onDismiss={() => chooseDnd(false, false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
  },
  body: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  medallion: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  digits: {
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  round: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  controls: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  startButton: {
    height: 56,
  },
  startLabel: {
    fontSize: 18,
  },
});
