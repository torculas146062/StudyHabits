import { useNavigation } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

export function Home() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Home Screen</Text>
      <Text variant="bodyMedium">
        Open up 'src/App.tsx' to start working on your app!
      </Text>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('Profile', { user: 'jane' })}
      >
        Go to Profile
      </Button>
      <Button mode="outlined" onPress={() => navigation.navigate('Settings')}>
        Go to Settings
      </Button>
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
