import { useNavigate, useParams } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';

import { PageAlert, PageHero, PageShell } from '@/components/PageShell';
import { isFactionId } from '@/constants/factions';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { RsvpConfirmedSummary } from '@/pages/RsvpPage/components/RsvpConfirmedSummary';
import { RsvpForm } from '@/pages/RsvpPage/components/RsvpForm';
import {
  type FactionId,
  fetchGuestByToken,
  fetchRsvpByToken,
  submitRsvpConfirmation,
} from '@/services/guestApi';
import { getApiStatusCode } from '@/services/apiErrors';
import type { ConfirmedRsvpState } from '@/pages/RsvpPage/components/RsvpConfirmedSummary';
import './styles/RsvpPage.scss';

/** RSVP screen opened via /rsvp/:token. */
export function RsvpPage() {
  const navigate = useNavigate();
  const { token = '' } = useParams();
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  const invitationToken = decodeURIComponent(token);

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
    void loadGuest();
  }, [loadGuest]);

  async function handleSubmit() {
    if (!isAuthenticated) {
      navigate('/auth/login');
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
        navigate('/auth/login');
      } else {
        setError(t('rsvp.submitError'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell loading={loading}>
      <PageHero
        eyebrow={t('rsvp.eyebrow')}
        title={guestName || t('rsvp.guestFallbackName')}
        subtitle={t('rsvp.subtitle')}
        subtitleFlush
      />

      {error ? <PageAlert message={error} /> : null}

      {alreadyConfirmed ? (
        <RsvpConfirmedSummary confirmedRsvp={confirmedRsvp} />
      ) : (
        <RsvpForm
          isAuthenticated={isAuthenticated}
          attending={attending}
          faction={faction}
          dietaryNotes={dietaryNotes}
          submitting={submitting}
          onAttendingChange={setAttending}
          onFactionChange={setFaction}
          onDietaryNotesChange={setDietaryNotes}
          onSubmit={() => void handleSubmit()}
        />
      )}
    </PageShell>
  );
}
