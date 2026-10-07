import { StyleSheet, View } from 'react-native';
import { ProgressBar, Text, useTheme } from 'react-native-paper';

import { SubjectAvatar } from './SubjectAvatar';

type SubjectProgressRowProps = {
  name: string;
  index: number;
  minutes: number;
  goalMinutes: number;
};

/** How far a subject has got toward today's goal, as an MD3 progress row. */
export function SubjectProgressRow({
  name,
  index,
  minutes,
  goalMinutes,
}: SubjectProgressRowProps) {
  const theme = useTheme();
  const progress = goalMinutes > 0 ? Math.min(1, minutes / goalMinutes) : 0;

  return (
    <View style={styles.row}>
      <View style={styles.top}>
        <SubjectAvatar name={name} index={index} size={40} />
        <View style={styles.titles}>
          <Text variant="titleSmall">{name}</Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {Math.floor(minutes)} of {goalMinutes} min today
          </Text>
        </View>
      </View>
      {/* Paper sizes ProgressBar's wrapper to 100% height on web, so the slot
          pins it to the bar's own height. */}
      <View style={styles.barSlot}>
        <ProgressBar progress={progress} style={styles.bar} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  bar: {
    height: 6,
    borderRadius: 3,
  },
  barSlot: {
    height: 6,
  },
});
