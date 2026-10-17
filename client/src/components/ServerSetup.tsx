import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  HelperText,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  discoverBackendOnLan,
  isBackendAt,
  normalizeBackendUrl,
  saveBackendUrl,
} from '../api/backend';

type ServerSetupProps = {
  /** Called with a verified URL; the app then starts. */
  onConnected: (url: string) => void;
};

const EXAMPLES = 'http://192.168.1.10:3000';

/**
 * Shown when no server answered on the LAN. The splash screen has already been
 * hidden by this point, so this is the whole app until an address works.
 */
export function ServerSetup({ onConnected }: ServerSetupProps) {
  const theme = useTheme();
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    const url = normalizeBackendUrl(value);

    if (!url) {
      setError('Enter the address of the machine running the server.');
      return;
    }

    setBusy(true);
    setError(null);

    const reachable = await isBackendAt(url, 5000);

    setBusy(false);

    if (!reachable) {
      setError(`No server answered at ${url}.`);
      return;
    }

    await saveBackendUrl(url);
    onConnected(url);
  };

  const rescan = async () => {
    setScanning(true);
    setError(null);

    const found = await discoverBackendOnLan();

    setScanning(false);

    if (!found) {
      setError('Still nothing on this network. Enter the address below.');
      return;
    }

    await saveBackendUrl(found);
    onConnected(found);
  };

  const disabled = busy || scanning;

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        <Text variant="headlineSmall">Find your server</Text>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          Study Habits looked for the backend on this network but nothing
          answered. Start the server, or enter its address — usually the
          computer running it, on port 3000.
        </Text>

        <TextInput
          mode="outlined"
          label="Server address"
          placeholder={EXAMPLES}
          value={value}
          onChangeText={setValue}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          disabled={disabled}
          error={Boolean(error)}
          onSubmitEditing={connect}
          returnKeyType="go"
        />
        {error ? (
          <HelperText type="error" visible>
            {error}
          </HelperText>
        ) : (
          <HelperText type="info" visible>
            {`For example ${EXAMPLES}`}
          </HelperText>
        )}

        <Button
          mode="contained"
          onPress={connect}
          loading={busy}
          disabled={disabled}
        >
          Connect
        </Button>
        <Button
          mode="text"
          onPress={rescan}
          loading={scanning}
          disabled={disabled}
        >
          Search the network again
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
});
