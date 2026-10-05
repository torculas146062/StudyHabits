import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type AuthLayoutProps = {
  headline: string;
  onBack?: () => void;
  children: ReactNode;
};

/**
 * Shared Material Design 3 shell for the authentication screens: an eyebrow,
 * a hero headline, a supporting line, and a form area.
 */
export function AuthLayout({ headline, onBack, children }: AuthLayoutProps) {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {onBack ? (
            <IconButton
              icon="arrow-left"
              mode="contained-tonal"
              onPress={onBack}
              accessibilityLabel="Go back"
              style={styles.back}
            />
          ) : null}

          <View style={styles.hero}>
            <Text
              variant="labelMedium"
              style={[styles.overline, { color: theme.colors.primary }]}
            >
              A calmer way to keep going
            </Text>
            <Text variant="displaySmall">{headline}</Text>
            <Text
              variant="bodyLarge"
              style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
            >
              A little structure. A lot more room to grow.
            </Text>
          </View>

          <View style={styles.form}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 32,
  },
  back: {
    alignSelf: 'flex-start',
  },
  hero: {
    gap: 12,
  },
  overline: {
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  subtitle: {
    maxWidth: 320,
  },
  form: {
    gap: 16,
  },
});
