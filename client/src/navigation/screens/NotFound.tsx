import { useNavigation } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

export function NotFound() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge">404</Text>
      <Button mode="contained" onPress={() => navigation.navigate('HomeTabs')}>
        Go to Home
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
