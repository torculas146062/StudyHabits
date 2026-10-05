import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

export function Settings() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Settings Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
});
