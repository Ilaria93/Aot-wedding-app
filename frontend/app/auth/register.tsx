import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { aotTheme } from '@/constants/aotTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { SelectableUserRole } from '@/services/authApi';

function getRoleOptions(t: ReturnType<typeof useI18n>['t']) {
  return [
    { value: 'bride' as const, label: t('common.roles.bride') },
    { value: 'groom' as const, label: t('common.roles.groom') },
    { value: 'invited' as const, label: t('common.roles.invited') },
  ];
}

// Registration screen shared by bride, groom and guests.
export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { t } = useI18n();
  const roleOptions = useMemo(() => getRoleOptions(t), [t]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<SelectableUserRole>('invited');
  const [isRoleSelectOpen, setIsRoleSelectOpen] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRoleOption = roleOptions.find((option) => option.value === role) || roleOptions[2];

  async function handleRegister() {
    try {
      setSubmitting(true);
      setError(null);
      await signUp({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
        role,
        remember_me: rememberMe,
      });
      router.replace('/');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t('register.genericError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>{t('register.eyebrow')}</Text>
        <Text style={styles.title}>{t('register.title')}</Text>
        <Text style={styles.subtitle}>{t('register.subtitle')}</Text>

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
        <TextInput
          style={styles.input}
          placeholder={t('common.fields.email')}
          placeholderTextColor={aotTheme.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder={t('common.fields.password')}
          placeholderTextColor={aotTheme.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Text style={styles.fieldLabel}>{t('register.roleLabel')}</Text>
        <View style={styles.selectWrapper}>
          <Pressable
            style={styles.selectField}
            onPress={() => setIsRoleSelectOpen((current) => !current)}>
            <Text style={styles.selectValue}>{selectedRoleOption.label}</Text>
            <FontAwesome
              name={isRoleSelectOpen ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={aotTheme.textMuted}
            />
          </Pressable>

          {isRoleSelectOpen ? (
            <View style={styles.selectDropdown}>
              {roleOptions.map((option) => {
                const isSelected = option.value === role;

                return (
                  <Pressable
                    key={option.value}
                    style={[styles.selectOption, isSelected && styles.selectOptionSelected]}
                    onPress={() => {
                      setRole(option.value);
                      setIsRoleSelectOpen(false);
                    }}>
                    <Text
                      style={[styles.selectOptionText, isSelected && styles.selectOptionTextSelected]}>
                      {option.label}
                    </Text>
                    {isSelected ? (
                      <FontAwesome name="check" size={12} color={aotTheme.bronze} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        <Pressable style={styles.inlineToggle} onPress={() => setRememberMe((current) => !current)}>
          <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
            {rememberMe ? <FontAwesome name="check" size={11} color={aotTheme.surface} /> : null}
          </View>
          <Text style={styles.inlineToggleText}>{t('register.rememberMe')}</Text>
        </Pressable>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={[styles.primaryButton, submitting && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={submitting}>
          <Text style={styles.primaryButtonText}>
            {submitting ? t('register.submitLoading') : t('register.submitLabel')}
          </Text>
        </Pressable>

        <Link href="/auth/login" style={styles.link}>
          {t('register.loginLink')}
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
  fieldLabel: {
    color: aotTheme.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  selectWrapper: {
    marginBottom: 12,
  },
  selectField: {
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: aotTheme.surfaceMuted,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValue: {
    color: aotTheme.textPrimary,
    fontSize: 15,
  },
  selectDropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 14,
    backgroundColor: aotTheme.surface,
    overflow: 'hidden',
  },
  selectOption: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: aotTheme.border,
  },
  selectOptionSelected: {
    backgroundColor: aotTheme.surfaceMuted,
  },
  selectOptionText: {
    color: aotTheme.textPrimary,
    fontSize: 15,
  },
  selectOptionTextSelected: {
    fontWeight: '700',
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
    alignItems: 'center',
    justifyContent: 'center',
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
