import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

export function Updates() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Updates Screen</Text>
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
});
