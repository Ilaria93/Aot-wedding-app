import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { aotTheme } from '@/constants/aotTheme';
import { getFactionLabel, getFactionOptions, isFactionId } from '@/constants/factions';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import {
  FactionId,
  fetchGuestByToken,
  fetchRsvpByToken,
  submitRsvpConfirmation,
} from '@/services/guestApi';
import { getApiStatusCode } from '@/utils/apiErrors';

type ConfirmedRsvpState = {
  attending: boolean;
  faction: FactionId | null;
  dietaryNotes: string | null;
};

// RSVP screen opened via /rsvp/{invitation_token}.
export default function RsvpByTokenScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  const { token } = useLocalSearchParams<{ token: string }>();
  const invitationToken = typeof token === 'string' ? token : '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);
  const [attending, setAttending] = useState(true);
  const [faction, setFaction] = useState<FactionId>('scout_regiment');
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedRsvp, setConfirmedRsvp] = useState<ConfirmedRsvpState | null>(null);

  const loadGuest = useCallback(async () => {
    if (!invitationToken) {
      setError(t('rsvp.invalidLink'));
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [guest, rsvp] = await Promise.all([
        fetchGuestByToken(invitationToken),
        fetchRsvpByToken(invitationToken),
      ]);

      setGuestName(guest.full_name);
      setAlreadyConfirmed(rsvp.has_rsvp);

      if (rsvp.has_rsvp) {
        const confirmedFaction = rsvp.attending && isFactionId(rsvp.faction) ? rsvp.faction : null;

        setAttending(rsvp.attending ?? true);
        if (confirmedFaction) {
          setFaction(confirmedFaction);
        }
        setDietaryNotes(rsvp.dietary_notes ?? '');
        setConfirmedRsvp({
          attending: rsvp.attending ?? true,
          faction: confirmedFaction,
          dietaryNotes: rsvp.dietary_notes ?? null,
        });
      } else {
        setConfirmedRsvp(null);
      }
    } catch {
      setError(t('rsvp.notFound'));
    } finally {
      setLoading(false);
    }
  }, [invitationToken, t]);

  useEffect(() => {
    loadGuest();
  }, [loadGuest]);

  async function handleSubmit() {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const normalizedDietaryNotes = attending ? dietaryNotes.trim() || undefined : undefined;

      await submitRsvpConfirmation({
        invitation_token: invitationToken,
        attending,
        faction: attending ? faction : undefined,
        dietary_notes: normalizedDietaryNotes,
      });

      setConfirmedRsvp({
        attending,
        faction: attending ? faction : null,
        dietaryNotes: normalizedDietaryNotes ?? null,
      });
      setAlreadyConfirmed(true);
    } catch (caughtError) {
      const statusCode = getApiStatusCode(caughtError);

      if (statusCode === 404) {
        setError(t('rsvp.notFound'));
      } else if (statusCode === 409) {
        await loadGuest();
        setError(t('rsvp.alreadyConfirmedError'));
      } else if (statusCode === 401) {
        router.push('/auth/login');
      } else {
        setError(t('rsvp.submitError'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={aotTheme.bronze} size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>{t('rsvp.eyebrow')}</Text>
          <Text style={styles.title}>{guestName || t('rsvp.guestFallbackName')}</Text>
          <Text style={styles.subtitle}>{t('rsvp.subtitle')}</Text>
        </View>

        {error ? (
          <View style={styles.alertCard}>
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        {alreadyConfirmed ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('rsvp.confirmedTitle')}</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('rsvp.statusLabel')}</Text>
              <Text style={styles.summaryValue}>
                {confirmedRsvp?.attending
                  ? t('rsvp.attendingStatus')
                  : t('rsvp.notAttendingStatus')}
              </Text>
            </View>
            {confirmedRsvp?.attending && confirmedRsvp.faction ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('rsvp.factionLabel')}</Text>
                <Text style={styles.summaryValue}>{getFactionLabel(confirmedRsvp.faction, t)}</Text>
              </View>
            ) : null}
            {confirmedRsvp?.attending && confirmedRsvp.dietaryNotes ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('rsvp.dietaryLabel')}</Text>
                <Text style={styles.summaryValue}>{confirmedRsvp.dietaryNotes}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('rsvp.formTitle')}</Text>
            {!isAuthenticated ? (
              <View style={styles.loginPromptCard}>
                <Text style={styles.helperText}>{t('rsvp.loginHint')}</Text>
                <Link href="/auth/login" style={styles.loginLink}>
                  {t('rsvp.loginLink')}
                </Link>
              </View>
            ) : null}
            <View style={styles.segmentRow}>
              <Pressable
                style={[styles.segmentButton, attending && styles.segmentButtonActive]}
                onPress={() => setAttending(true)}
              >
                <Text style={[styles.segmentButtonText, attending && styles.segmentButtonTextActive]}>
                  {t('common.yes')}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.segmentButton, !attending && styles.segmentButtonActive]}
                onPress={() => setAttending(false)}
              >
                <Text
                  style={[styles.segmentButtonText, !attending && styles.segmentButtonTextActive]}>
                  {t('common.no')}
                </Text>
              </Pressable>
            </View>

            {attending ? (
              <>
                <Text style={styles.label}>{t('rsvp.chooseFaction')}</Text>
                {getFactionOptions(t).map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.factionCard, faction === item.id && styles.factionCardActive]}
                    onPress={() => setFaction(item.id)}
                  >
                    <Text style={styles.factionTitle}>{item.label}</Text>
                    <Text style={styles.factionDescription}>{t('rsvp.factionDescription')}</Text>
                  </Pressable>
                ))}

                <Text style={styles.label}>{t('rsvp.dietaryLabel')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('rsvp.dietaryPlaceholder')}
                  placeholderTextColor={aotTheme.textMuted}
                  value={dietaryNotes}
                  onChangeText={setDietaryNotes}
                />
              </>
            ) : (
              <Text style={styles.helperText}>{t('rsvp.notAttendingHint')}</Text>
            )}

            <Pressable
              style={[styles.primaryButton, submitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.primaryButtonText}>
                {isAuthenticated
                  ? submitting
                    ? t('rsvp.submitLoading')
                    : t('rsvp.submitLabel')
                  : t('rsvp.loginSubmitLabel')}
              </Text>
            </Pressable>
          </View>
        )}
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
  container: {
    flexGrow: 1,
    backgroundColor: aotTheme.background,
    padding: 24,
    paddingTop: 32,
    paddingBottom: 48,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 760,
  },
  heroCard: {
    backgroundColor: aotTheme.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: aotTheme.border,
    padding: 28,
    marginBottom: 16,
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
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 10,
  },
  subtitle: {
    color: aotTheme.textMuted,
    fontSize: 16,
    lineHeight: 25,
  },
  alertCard: {
    backgroundColor: '#f7e3e3',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e8c2c2',
    padding: 16,
    marginBottom: 16,
  },
  sectionCard: {
    backgroundColor: aotTheme.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: aotTheme.border,
    padding: 24,
  },
  sectionTitle: {
    color: aotTheme.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 14,
  },
  label: {
    color: aotTheme.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 16,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: aotTheme.border,
    backgroundColor: aotTheme.surfaceMuted,
  },
  segmentButtonActive: {
    backgroundColor: aotTheme.militaryGreen,
    borderColor: aotTheme.militaryGreen,
  },
  segmentButtonText: {
    color: aotTheme.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  segmentButtonTextActive: {
    color: aotTheme.surface,
  },
  factionCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: aotTheme.border,
    backgroundColor: aotTheme.surfaceMuted,
    marginBottom: 10,
  },
  factionCardActive: {
    borderColor: aotTheme.bronze,
    backgroundColor: '#f3e4d3',
  },
  factionTitle: {
    color: aotTheme.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  factionDescription: {
    color: aotTheme.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 14,
    padding: 14,
    color: aotTheme.textPrimary,
    backgroundColor: aotTheme.surfaceMuted,
    minHeight: 52,
  },
  helperText: {
    color: aotTheme.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 16,
  },
  loginPromptCard: {
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 16,
    backgroundColor: aotTheme.surfaceMuted,
    padding: 14,
    marginBottom: 16,
  },
  loginLink: {
    color: aotTheme.bronze,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
  },
  primaryButton: {
    marginTop: 24,
    backgroundColor: aotTheme.bronze,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: aotTheme.surface,
    fontWeight: '700',
    fontSize: 16,
  },
  error: {
    color: aotTheme.danger,
    fontSize: 14,
  },
  summaryRow: {
    borderTopWidth: 1,
    borderTopColor: aotTheme.border,
    paddingVertical: 12,
  },
  summaryLabel: {
    color: aotTheme.textMuted,
    fontSize: 13,
    marginBottom: 4,
  },
  summaryValue: {
    color: aotTheme.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
});
