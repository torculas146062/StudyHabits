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
      <SubjectAvatar name={name} index={index} size={36} />
      <View style={styles.body}>
        <Text variant="titleSmall">{name}</Text>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {minutes} of {goalMinutes} min today
        </Text>
        {/* Paper sizes ProgressBar's wrapper to 100% height on web, so the slot
            pins it to the bar's own height. */}
        <View style={styles.barSlot}>
          <ProgressBar progress={progress} style={styles.bar} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  bar: {
    height: 6,
    borderRadius: 3,
  },
  barSlot: {
    height: 6,
  },
});
