import { useCallback, useEffect, useState } from 'react';

import { PageAlert } from '@/components/PageShell';
import { isFactionId } from '@/constants/factions';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { RsvpConfirmedSummary } from '@/components/Rsvp/RsvpConfirmedSummary';
import { RsvpForm } from '@/components/Rsvp/RsvpForm';
import { RsvpPageSkeleton } from '@/pages/RsvpPage/components/RsvpPageSkeleton';
import { fetchMyRsvp, submitRsvpConfirmation, type FactionId } from '@/services/rsvpApi';
import { getApiStatusCode } from '@/services/apiErrors';
import type { ConfirmedRsvpState } from '@/components/Rsvp/RsvpConfirmedSummary';
import './styles/RsvpPage.scss';

/** RSVP screen for the authenticated user at `/rsvp`. */
export function RsvpPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);
  const [attending, setAttending] = useState(true);
  const [faction, setFaction] = useState<FactionId>('scout_regiment');
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedRsvp, setConfirmedRsvp] = useState<ConfirmedRsvpState | null>(null);

  const loadRsvp = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rsvp = await fetchMyRsvp();
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
      setError(t('rsvp.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadRsvp();
  }, [loadRsvp]);

  async function handleSubmit() {
    try {
      setSubmitting(true);
      setError(null);
      const normalizedDietaryNotes = attending ? dietaryNotes.trim() || undefined : undefined;

      await submitRsvpConfirmation({
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
      if (statusCode === 409) {
        await loadRsvp();
        setError(t('rsvp.alreadyConfirmedError'));
      } else {
        setError(t('rsvp.submitError'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const guestName = user ? `${user.first_name} ${user.last_name}`.trim() : '';

  if (loading) {
    return <RsvpPageSkeleton />;
  }

  return (
    <div className="obw-page rsvp-page">
      <div className="obw-page__grain" aria-hidden="true" />

      <div className="obw-container rsvp-page__inner">
        <header className="obw-card obw-card--interactive rsvp-hero obw-fade-up">
          <p className="obw-kicker">{t('rsvp.eyebrow')}</p>
          <h1 className="obw-display obw-display--lg">{guestName || t('rsvp.guestFallbackName')}</h1>
          <p className="obw-body obw-body--narrow">{t('rsvp.subtitle')}</p>
          <div className="obw-rule" aria-hidden="true" />
        </header>

        {error ? (
          <div className="rsvp-alert-wrap">
            <PageAlert message={error} />
          </div>
        ) : null}

        {alreadyConfirmed ? (
          <RsvpConfirmedSummary confirmedRsvp={confirmedRsvp} />
        ) : (
          <RsvpForm
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
      </div>
    </div>
  );
}
