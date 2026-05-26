import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { aotTheme } from '@/constants/aotTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { formatUserRoleLabel } from '@/services/authApi';

// Dedicated profile screen for account info, role and session actions.
export default function ProfileScreen() {
  const { user, isAuthenticated, isBootstrapping, signOut, saveProfile } = useAuth();
  const { t } = useI18n();
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setFirstName(user?.first_name || '');
    setLastName(user?.last_name || '');
  }, [user]);

  async function handleSaveProfile() {
    try {
      setSaving(true);
      setMessage(null);
      await saveProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      setMessage(t('profile.updatedMessage'));
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : t('profile.updateError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await signOut();
    setMessage(null);
  }

  if (isBootstrapping) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>{t('common.loadingSession')}</Text>
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>{t('profile.eyebrow')}</Text>
          <Text style={styles.title}>{t('profile.guestTitle')}</Text>
          <Text style={styles.subtitle}>{t('profile.guestSubtitle')}</Text>
          <View style={styles.preferenceCard}>
            <LanguageSwitcher />
          </View>
          <Link href="/auth/login" style={styles.primaryLink}>
            {t('profile.loginLink')}
          </Link>
          <Link href="/auth/register" style={styles.secondaryLink}>
            {t('profile.registerLink')}
          </Link>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>{t('profile.eyebrow')}</Text>
        <Text style={styles.title}>
          {user.first_name} {user.last_name}
        </Text>
        <Text style={styles.subtitle}>{t('profile.subtitle')}</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('profile.emailLabel')}</Text>
          <Text style={styles.summaryValue}>{user.email}</Text>
          <Text style={styles.summaryLabel}>{t('profile.roleLabel')}</Text>
          <Text style={styles.summaryValue}>{formatUserRoleLabel(user.role, t)}</Text>
        </View>

        <View style={styles.preferenceCard}>
          <LanguageSwitcher />
        </View>

        <TextInput
          style={styles.input}
          placeholder={t('common.fields.firstName')}
          placeholderTextColor={aotTheme.textMuted}
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder={t('common.fields.lastName')}
          placeholderTextColor={aotTheme.textMuted}
          value={lastName}
          onChangeText={setLastName}
        />

        {message ? <Text style={styles.helperText}>{message}</Text> : null}

        <Pressable
          style={[styles.primaryButton, saving && styles.buttonDisabled]}
          onPress={handleSaveProfile}
          disabled={saving}>
          <Text style={styles.primaryButtonText}>
            {saving ? t('profile.updateLoading') : t('profile.updateButton')}
          </Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={handleLogout}>
          <Text style={styles.secondaryButtonText}>{t('profile.signOut')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: aotTheme.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: aotTheme.textMuted,
    fontSize: 15,
  },
  container: {
    flexGrow: 1,
    backgroundColor: aotTheme.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 640,
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
  summaryCard: {
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 18,
    backgroundColor: aotTheme.surfaceMuted,
    padding: 16,
    marginBottom: 16,
  },
  preferenceCard: {
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 18,
    backgroundColor: aotTheme.surfaceMuted,
    padding: 16,
    marginBottom: 16,
  },
  summaryLabel: {
    color: aotTheme.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: {
    color: aotTheme.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
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
  helperText: {
    color: aotTheme.textMuted,
    fontSize: 14,
    marginBottom: 12,
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
  secondaryButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: aotTheme.border,
    backgroundColor: aotTheme.surfaceMuted,
  },
  secondaryButtonText: {
    color: aotTheme.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryLink: {
    color: aotTheme.bronze,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  secondaryLink: {
    color: aotTheme.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
