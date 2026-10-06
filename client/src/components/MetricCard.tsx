import { StyleSheet, View } from 'react-native';
import { Card, Icon, Text, useTheme } from 'react-native-paper';

type MetricCardProps = {
  icon: string;
  label: string;
  value: string;
  note: string;
};

/** One dashboard figure as an MD3 card: icon, label, value and a supporting line. */
export function MetricCard({ icon, label, value, note }: MetricCardProps) {
  const theme = useTheme();

  return (
    <Card mode="contained" style={styles.card}>
      <Card.Content style={styles.content}>
        <View
          style={[
            styles.medallion,
            { backgroundColor: theme.colors.secondaryContainer },
          ]}
        >
          <Icon
            source={icon}
            size={20}
            color={theme.colors.onSecondaryContainer}
          />
        </View>
        <Text
          variant="labelLarge"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {label}
        </Text>
        <Text variant="headlineSmall">{value}</Text>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {note}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
  },
  content: {
    gap: 2,
  },
  medallion: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
});
