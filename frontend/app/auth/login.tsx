import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { aotTheme } from '@/constants/aotTheme';
import { useAuth } from '@/contexts/AuthContext';

// Login screen for returning guests and admin users.
export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    try {
      setSubmitting(true);
      setError(null);
      await signIn({
        email: email.trim(),
        password,
        remember_me: rememberMe,
      });
      router.replace('/profile');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Accesso non riuscito.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Accesso</Text>
        <Text style={styles.title}>Rientra nell’app del matrimonio.</Text>
        <Text style={styles.subtitle}>
          Accedi con email e password. Se vuoi, puoi restare connessa/o anche dopo la chiusura
          dell’app.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={aotTheme.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={aotTheme.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable style={styles.inlineToggle} onPress={() => setRememberMe((current) => !current)}>
          <View style={[styles.checkbox, rememberMe && styles.checkboxActive]} />
          <Text style={styles.inlineToggleText}>Resta connesso</Text>
        </Pressable>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={[styles.primaryButton, submitting && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={submitting}>
          <Text style={styles.primaryButtonText}>
            {submitting ? 'Accesso in corso...' : 'Accedi'}
          </Text>
        </Pressable>

        <Link href="/auth/register" style={styles.link}>
          Non hai ancora un account? Registrati
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: aotTheme.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: aotTheme.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: aotTheme.border,
    padding: 24,
  },
  eyebrow: {
    color: aotTheme.bronze,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '700',
  },
  title: {
    color: aotTheme.textPrimary,
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 38,
    marginBottom: 10,
  },
  subtitle: {
    color: aotTheme.textMuted,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 14,
    padding: 14,
    color: aotTheme.textPrimary,
    backgroundColor: aotTheme.surfaceMuted,
    marginBottom: 12,
  },
  inlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: aotTheme.border,
    backgroundColor: aotTheme.surfaceMuted,
  },
  checkboxActive: {
    backgroundColor: aotTheme.bronze,
    borderColor: aotTheme.bronze,
  },
  inlineToggleText: {
    color: aotTheme.textPrimary,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: aotTheme.bronze,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: aotTheme.surface,
    fontWeight: '700',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: aotTheme.danger,
    marginBottom: 12,
  },
  link: {
    color: aotTheme.bronze,
    fontSize: 14,
    fontWeight: '600',
  },
});
