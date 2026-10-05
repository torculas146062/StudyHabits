import { StyleSheet, View } from 'react-native';
import { Button, Divider, Text } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

export function Settings() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Settings Screen</Text>

      {user ? (
        <View style={styles.account}>
          <Text variant="labelLarge">Signed in as</Text>
          <Text variant="bodyMedium">{user.name}</Text>
          <Text variant="bodySmall">{user.email}</Text>
        </View>
      ) : null}

      <Divider style={styles.divider} />

      <Button mode="outlined" icon="logout" onPress={signOut}>
        Sign out
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
    padding: 24,
  },
  account: {
    alignItems: 'center',
    gap: 2,
  },
  divider: {
    alignSelf: 'stretch',
    marginVertical: 8,
  },
});
