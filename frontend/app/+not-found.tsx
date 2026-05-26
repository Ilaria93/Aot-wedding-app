import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { aotTheme } from '@/constants/aotTheme';
import { useI18n } from '@/contexts/I18nContext';

// Modern fallback screen for unknown routes.
export default function NotFoundScreen() {
  const { t } = useI18n();

  return (
    <>
      <Stack.Screen options={{ title: t('navigation.stack.notFound') }} />
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>404</Text>
          <Text style={styles.title}>{t('notFound.title')}</Text>
          <Text style={styles.body}>{t('notFound.body')}</Text>

          <Link href="/" style={styles.link}>
            <Text style={styles.linkText}>{t('notFound.backHome')}</Text>
          </Link>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: aotTheme.background,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: aotTheme.surface,
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 24,
    padding: 28,
  },
  eyebrow: {
    color: aotTheme.bronze,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: aotTheme.textPrimary,
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: aotTheme.textMuted,
  },
  link: {
    marginTop: 18,
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 15,
    color: aotTheme.bronze,
    fontWeight: '700',
  },
});
