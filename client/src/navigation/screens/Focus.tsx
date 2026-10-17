import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Button,
  Dialog,
  Icon,
  IconButton,
  RadioButton,
  SegmentedButtons,
  Text,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppDialog, DialogBody } from '../../components/AppDialog';
import { DndPromptDialog } from '../../components/DndPromptDialog';
import { usePreferences } from '../../context/PreferencesContext';
import { useStudy } from '../../context/StudyContext';
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
  const {
    data,
    timer,
    setTimerSubject,
    setTimerMinutes,
    toggleTimer,
    resetTimer,
  } = useStudy();
  const { dndMode, setDndMode } = usePreferences();
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  // The dialog edits a draft so cancelling leaves the timer untouched; closing
  // it on the tap itself would also let that tap fall through to the button
  // underneath and reopen it.
  const [draftSubjectId, setDraftSubjectId] = useState<string | null>(null);
  const [dndPromptOpen, setDndPromptOpen] = useState(false);
  // Landscape on a phone leaves very little height, so the readout and the
  // controls sit side by side instead of stacking and being squeezed.
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const closeTimer = () => {
    // Focus can be the entry route (a reload or deep link straight to /focus),
    // where there is nothing to pop.
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('HomeTabs');
    }
  };

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
        {started ? (
          <IconButton
            icon="restart"
            size={24}
            accessibilityLabel="Reset timer"
            onPress={resetTimer}
          />
        ) : null}
        <IconButton
          icon="close"
          size={24}
          accessibilityLabel="Close focus timer"
          onPress={closeTimer}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          isLandscape && styles.contentLandscape,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.readout, isLandscape && styles.readoutLandscape]}>
          {isLandscape ? null : (
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
          )}

          <Text variant="titleMedium">{PHASE_TITLES[timer.phase]}</Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {subtitle}
          </Text>

          <Text
            variant={isLandscape ? 'displayMedium' : 'displayLarge'}
            style={styles.digits}
          >
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

          {hasSubjects ? null : (
            // The selector below shows the subject, so only the empty state
            // needs saying: it explains why the controls are disabled.
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Add a subject to begin
            </Text>
          )}
        </View>

        <View style={[styles.controls, isLandscape && styles.controlsLandscape]}>
          {!isBreak && (
            <>
              <Button
                mode="outlined"
                icon="book-open-variant"
                onPress={() => {
                  setDraftSubjectId(timer.subjectId);
                  setSubjectDialogOpen(true);
                }}
                disabled={!hasSubjects}
              >
                {subject?.name ?? 'Choose subject'}
              </Button>

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
      </ScrollView>

      {/*
        A dialog rather than a menu: the menu could not scroll, so a long
        subject list ran off the screen.
      */}
      <AppDialog
        visible={subjectDialogOpen}
        onDismiss={() => setSubjectDialogOpen(false)}
      >
        <Dialog.Title>Choose subject</Dialog.Title>
        <DialogBody>
          <RadioButton.Group
            value={draftSubjectId ?? ''}
            onValueChange={setDraftSubjectId}
          >
            {data.subjects.map((item) => (
              <RadioButton.Item
                key={item.id}
                label={item.name}
                value={item.id}
                style={styles.radioItem}
                labelVariant="bodyLarge"
                position="leading"
                labelStyle={styles.radioLabel}
              />
            ))}
          </RadioButton.Group>
        </DialogBody>
        <Dialog.Actions>
          <Button onPress={() => setSubjectDialogOpen(false)}>Cancel</Button>
          <Button
            onPress={() => {
              if (draftSubjectId) {
                setTimerSubject(draftSubjectId);
              }

              setSubjectDialogOpen(false);
            }}
            disabled={!draftSubjectId}
          >
            Choose
          </Button>
        </Dialog.Actions>
      </AppDialog>

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
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  // Landscape: readout on the left, controls on the right, so neither is
  // squeezed into the little height a phone has in that orientation.
  contentLandscape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    paddingVertical: 8,
  },
  readout: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
    gap: 12,
  },
  readoutLandscape: {
    flex: 1,
    maxWidth: 420,
    gap: 6,
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
  },
  controlsLandscape: {
    flex: 1,
    maxWidth: 360,
    gap: 12,
  },
  radioItem: {
    paddingHorizontal: 0,
  },
  // Paper right-aligns the label when the radio is leading, which pushes it to
  // the far edge; a picker list reads better with the text beside the control.
  radioLabel: {
    textAlign: 'left',
  },
  startButton: {
    height: 56,
  },
  startLabel: {
    fontSize: 18,
  },
});
