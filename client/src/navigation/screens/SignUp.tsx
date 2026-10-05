import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { ApiError } from '../../api/client';
import { AuthLayout } from '../../components/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import type { AuthStackParamList } from '../index';

type Navigation = NativeStackNavigationProp<AuthStackParamList>;

export function SignUp() {
  const navigation = useNavigation<Navigation>();
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    try {
      await signUp(name, email, password);
      // The provider swaps in the app navigator on success, so there is
      // nothing to navigate to here.
    } catch (err) {
      if (err instanceof ApiError) {
        const hasFieldErrors = Object.keys(err.fields).length > 0;
        setFieldErrors(err.fields);
        setFormError(hasFieldErrors ? null : err.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
      setSubmitting(false);
    }
  };

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
        error={Boolean(fieldErrors.name)}
        left={<TextInput.Icon icon="account-outline" />}
      />
      {fieldErrors.name ? (
        <HelperText type="error" visible>
          {fieldErrors.name}
        </HelperText>
      ) : null}

      <TextInput
        mode="outlined"
        label="Email address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        error={Boolean(fieldErrors.email)}
        left={<TextInput.Icon icon="email-outline" />}
      />
      {fieldErrors.email ? (
        <HelperText type="error" visible>
          {fieldErrors.email}
        </HelperText>
      ) : null}

      <TextInput
        mode="outlined"
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!passwordVisible}
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        error={Boolean(fieldErrors.password)}
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
      {fieldErrors.password ? (
        <HelperText type="error" visible>
          {fieldErrors.password}
        </HelperText>
      ) : null}

      {formError ? (
        <HelperText type="error" visible>
          {formError}
        </HelperText>
      ) : null}

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={submitting}
        disabled={submitting}
        style={styles.submit}
      >
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
