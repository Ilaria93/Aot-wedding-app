import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { aotTheme } from '@/constants/aotTheme';
import { Text, View } from '@/components/Themed';

// Modern fallback screen for unknown routes.
export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Pagina non trovata' }} />
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>404</Text>
          <Text style={styles.title}>Questa pagina non esiste.</Text>
          <Text style={styles.body}>
            Il link potrebbe essere incompleto oppure la pagina non e ancora stata creata.
          </Text>

          <Link href="/" style={styles.link}>
            <Text style={styles.linkText}>Torna alla home</Text>
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
