import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

type SectionHeaderProps = {
  title: string;
  hint?: string;
  icon?: string;
  action?: string;
  onAction?: () => void;
};

/** MD3 section heading: title and supporting line, with the action on the end. */
export function SectionHeader({
  title,
  hint,
  icon,
  action,
  onAction,
}: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.titles}>
        <Text variant="titleMedium">{title}</Text>
        {hint ? (
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {hint}
          </Text>
        ) : null}
      </View>
      {action && onAction ? (
        <Button onPress={onAction} icon={icon} compact>
          {action}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  titles: {
    flex: 1,
  },
});
