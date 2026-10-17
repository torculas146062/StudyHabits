import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

type BarChartProps = {
  data: { label: string; value: number }[];
  /** Renders a bar's value; minutes by default. */
  formatValue?: (value: number) => string;
  accessibilityLabel: string;
};

/**
 * A small view-based column chart. Drawn with plain Views rather than an SVG
 * dependency so it renders identically on native and web.
 */
export function BarChart({
  data,
  formatValue = String,
  accessibilityLabel,
}: BarChartProps) {
  const theme = useTheme();
  const max = Math.max(1, ...data.map((item) => item.value));

  return (
    <View
      style={styles.chart}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {data.map((item, index) => {
        const ratio = item.value > 0 ? item.value / max : 0;

        return (
          // Labels repeat (two "S" and two "T" in a week), so the index keeps keys unique.
          <View key={`${item.label}-${index}`} style={styles.column}>
            <Text
              variant="labelSmall"
              numberOfLines={1}
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {item.value > 0 ? formatValue(item.value) : ''}
            </Text>
            <View
              style={[
                styles.track,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <View
                style={[
                  styles.bar,
                  {
                    backgroundColor: theme.colors.primary,
                    // A tiny stub keeps a non-zero day visible at a glance.
                    height: ratio > 0 ? `${Math.max(ratio * 100, 4)}%` : 0,
                  },
                ]}
              />
            </View>
            <Text
              variant="labelSmall"
              numberOfLines={1}
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  track: {
    height: 120,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 8,
  },
});
