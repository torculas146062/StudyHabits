import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { AuthLayout } from '../../components/AuthLayout';

export function SignUp() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  // TODO: create the account via the API once the endpoint exists.
  const handleSubmit = () => navigation.navigate('HomeTabs');

  return (
    <AuthLayout
      headline="Start with one small promise."
      onBack={() => navigation.goBack()}
    >
      <TextInput
        mode="outlined"
        label="Your name"
        value={name}
        onChangeText={setName}
        autoComplete="name"
        textContentType="name"
        left={<TextInput.Icon icon="account-outline" />}
      />
      <TextInput
        mode="outlined"
        label="Email address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        left={<TextInput.Icon icon="email-outline" />}
      />
      <TextInput
        mode="outlined"
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!passwordVisible}
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        left={<TextInput.Icon icon="lock-outline" />}
        right={
          <TextInput.Icon
            icon={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
            onPress={() => setPasswordVisible((visible) => !visible)}
            accessibilityLabel={
              passwordVisible ? 'Hide password' : 'Show password'
            }
          />
        }
      />
      <Button mode="contained" onPress={handleSubmit} style={styles.submit}>
        Create account
      </Button>
      <View style={styles.footer}>
        <Text variant="bodyMedium">Already have an account?</Text>
        <Button mode="text" onPress={() => navigation.navigate('Login')}>
          Log in
        </Button>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  submit: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
});
