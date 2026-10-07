import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, ProgressBar, Text, useTheme } from 'react-native-paper';

import { HabitDialog } from '../../components/HabitDialog';
import { HabitList } from '../../components/HabitList';
import { SectionHeader } from '../../components/SectionHeader';
import { useStudy } from '../../context/StudyContext';
import { formatDay, todayKey } from '../../study/date';
import { completedHabitCount, habitsOn } from '../../study/selectors';

export function Todo() {
  const theme = useTheme();
  const { data } = useStudy();
  const [habitDialog, setHabitDialog] = useState(false);

  const date = todayKey();
  const planned = habitsOn(data, date);
  const completed = completedHabitCount(data, date);
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
            {completed} of {planned.length} habits complete
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
        hint={`${planned.length} planned habit${
          planned.length === 1 ? '' : 's'
        }`}
        icon="plus"
        action="Add habit"
        onAction={() => setHabitDialog(true)}
      />
      <Card mode="outlined">
        <Card.Content style={styles.list}>
          <HabitList date={date} />
        </Card.Content>
      </Card>

      <HabitDialog
        visible={habitDialog}
        onDismiss={() => setHabitDialog(false)}
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
