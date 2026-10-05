import { StaticScreenProps } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';
import { Avatar, Text } from 'react-native-paper';

type Props = StaticScreenProps<{
  user: string;
}>;

export function Profile({ route }: Props) {
  const { user } = route.params;

  return (
    <View style={styles.container}>
      <Avatar.Text label={user.charAt(0).toUpperCase()} size={64} />
      <Text variant="headlineSmall">{user}'s Profile</Text>
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
