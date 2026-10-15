import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, ProgressBar, Text, useTheme } from 'react-native-paper';

import { TaskDialog } from '../../components/TaskDialog';
import { TaskList } from '../../components/TaskList';
import { SectionHeader } from '../../components/SectionHeader';
import { useStudy } from '../../context/StudyContext';
import { formatDay, todayKey } from '../../study/date';
import { completedTaskCount, tasksOn } from '../../study/selectors';

export function Tasks() {
  const theme = useTheme();
  const { data } = useStudy();
  const [taskDialog, setTaskDialog] = useState(false);

  const date = todayKey();
  const planned = tasksOn(data, date);
  const completed = completedTaskCount(data, date);
  const progress = planned.length ? completed / planned.length : 0;
  const muted = { color: theme.colors.onSurfaceVariant };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.hero}>
        <Text variant="labelLarge" style={muted}>
          {formatDay(date)}
        </Text>
        <Text variant="headlineMedium">Your day, at your own pace.</Text>
        <Text variant="bodyMedium" style={muted}>
          Every check-in is a step forward.
        </Text>
      </View>

      <Card mode="contained">
        <Card.Content style={styles.summary}>
          <Text variant="titleMedium">
            {completed} of {planned.length} tasks complete
          </Text>
          {/* Paper sizes the ProgressBar wrapper to 100% height on web, so the
              slot pins it to the bar's own height. The contained card uses the
              same surfaceVariant tone as the default track, so the track is
              repainted to outline to stay visible. */}
          <View style={styles.barSlot}>
            <ProgressBar
              progress={progress}
              style={[styles.bar, { backgroundColor: theme.colors.outline }]}
            />
          </View>
          <Text variant="bodySmall" style={muted}>
            Pick one small thing to begin.
          </Text>
        </Card.Content>
      </Card>

      <SectionHeader
        title="On today's list"
        hint={`${planned.length} planned task${
          planned.length === 1 ? '' : 's'
        }`}
        icon="plus"
        action="Add task"
        onAction={() => setTaskDialog(true)}
      />
      <Card mode="outlined">
        <Card.Content style={styles.list}>
          <TaskList date={date} />
        </Card.Content>
      </Card>

      <TaskDialog
        visible={taskDialog}
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
  summary: {
    gap: 12,
  },
  bar: {
    height: 6,
    borderRadius: 3,
  },
  barSlot: {
    height: 6,
  },
  list: {
    paddingHorizontal: 0,
  },
});
