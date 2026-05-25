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
import { AxiosError } from 'axios';

import { aotTheme } from '@/constants/aotTheme';
import { useAuth } from '@/contexts/AuthContext';
import {
  FactionId,
  fetchGuestByToken,
  fetchRsvpByToken,
  submitRsvpConfirmation,
} from '@/services/guestApi';

const FACTIONS: { id: FactionId; label: string }[] = [
  { id: 'scout_regiment', label: 'Ricognizione' },
  { id: 'military_police', label: 'Gendarmeria' },
  { id: 'garrison', label: 'Guarnigione' },
];

type ConfirmedRsvpState = {
  attending: boolean;
  faction: FactionId | null;
  dietaryNotes: string | null;
};

function isFactionId(value: string | null | undefined): value is FactionId {
  return FACTIONS.some((item) => item.id === value);
}

function getFactionLabel(factionId: FactionId | null) {
  if (!factionId) {
    return null;
  }

  return FACTIONS.find((item) => item.id === factionId)?.label ?? factionId;
}

// RSVP screen opened via /rsvp/{invitation_token}.
export default function RsvpByTokenScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
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
      setError('Link invito non valido.');
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
      setError('Invito non trovato o scaduto.');
    } finally {
      setLoading(false);
    }
  }, [invitationToken]);

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
      const requestError = caughtError as AxiosError<{ detail?: string }>;
      const statusCode = requestError.response?.status;

      if (statusCode === 404) {
        setError('Invito non trovato o scaduto.');
      } else if (statusCode === 409) {
        await loadGuest();
        setError('RSVP già confermato in precedenza.');
      } else if (statusCode === 401) {
        router.push('/auth/login');
      } else {
        setError('Conferma non riuscita. Riprova tra poco.');
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
          <Text style={styles.eyebrow}>RSVP</Text>
          <Text style={styles.title}>{guestName || 'Invitato'}</Text>
          <Text style={styles.subtitle}>
            Conferma la tua presenza in modo semplice e, se parteciperai, scegli la fazione che ti
            rappresenta.
          </Text>
        </View>

        {error ? (
          <View style={styles.alertCard}>
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        {alreadyConfirmed ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>RSVP gia confermato</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Stato</Text>
              <Text style={styles.summaryValue}>
                {confirmedRsvp?.attending ? 'Presente' : 'Non presente'}
              </Text>
            </View>
            {confirmedRsvp?.attending && confirmedRsvp.faction ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fazione</Text>
                <Text style={styles.summaryValue}>{getFactionLabel(confirmedRsvp.faction)}</Text>
              </View>
            ) : null}
            {confirmedRsvp?.attending && confirmedRsvp.dietaryNotes ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Note alimentari</Text>
                <Text style={styles.summaryValue}>{confirmedRsvp.dietaryNotes}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Parteciperai?</Text>
            {!isAuthenticated ? (
              <View style={styles.loginPromptCard}>
                <Text style={styles.helperText}>
                  Per confermare RSVP devi prima accedere con il tuo account.
                </Text>
                <Link href="/auth/login" style={styles.loginLink}>
                  Vai al login
                </Link>
              </View>
            ) : null}
            <View style={styles.segmentRow}>
              <Pressable
                style={[styles.segmentButton, attending && styles.segmentButtonActive]}
                onPress={() => setAttending(true)}
              >
                <Text style={[styles.segmentButtonText, attending && styles.segmentButtonTextActive]}>
                  Si
                </Text>
              </Pressable>
              <Pressable
                style={[styles.segmentButton, !attending && styles.segmentButtonActive]}
                onPress={() => setAttending(false)}
              >
                <Text
                  style={[styles.segmentButtonText, !attending && styles.segmentButtonTextActive]}>
                  No
                </Text>
              </Pressable>
            </View>

            {attending ? (
              <>
                <Text style={styles.label}>Scegli la tua fazione</Text>
                {FACTIONS.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.factionCard, faction === item.id && styles.factionCardActive]}
                    onPress={() => setFaction(item.id)}
                  >
                    <Text style={styles.factionTitle}>{item.label}</Text>
                    <Text style={styles.factionDescription}>
                      Selezione simbolica usata per badge e organizzazione evento.
                    </Text>
                  </Pressable>
                ))}

                <Text style={styles.label}>Note alimentari</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Allergie, intolleranze, vegetariano..."
                  placeholderTextColor={aotTheme.textMuted}
                  value={dietaryNotes}
                  onChangeText={setDietaryNotes}
                />
              </>
            ) : (
              <Text style={styles.helperText}>
                Se selezioni No, non serve indicare nessuna fazione.
              </Text>
            )}

            <Pressable
              style={[styles.primaryButton, submitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.primaryButtonText}>
                {isAuthenticated
                  ? submitting
                    ? 'Invio in corso...'
                    : 'Conferma RSVP'
                  : 'Accedi per confermare RSVP'}
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
