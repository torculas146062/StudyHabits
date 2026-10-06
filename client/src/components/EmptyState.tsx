import { StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';

type EmptyStateProps = {
  icon?: string;
  title: string;
  detail: string;
};

/** MD3 empty state: a tonal icon medallion over a title and a supporting line. */
export function EmptyState({
  icon = 'sprout-outline',
  title,
  detail,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.medallion,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        <Icon source={icon} size={24} color={theme.colors.onSurfaceVariant} />
      </View>
      <Text variant="titleMedium">{title}</Text>
      <Text
        variant="bodyMedium"
        style={[styles.detail, { color: theme.colors.onSurfaceVariant }]}
      >
        {detail}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  medallion: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  detail: {
    textAlign: 'center',
  },
});
