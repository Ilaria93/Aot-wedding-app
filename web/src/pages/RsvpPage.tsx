import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';

import { getFactionLabel, getFactionOptions, isFactionId } from '@/constants/factions';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import {
  type FactionId,
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

  if (loading) {
    return <div className="loading-screen">…</div>;
  }

  return (
    <div className="page-shell" style={{ maxWidth: 760 }}>
      <div className="card" style={{ maxWidth: 'none', marginBottom: 20 }}>
        <p className="eyebrow">{t('rsvp.eyebrow')}</p>
        <h1 className="title">{guestName || t('rsvp.guestFallbackName')}</h1>
        <p className="subtitle">{t('rsvp.subtitle')}</p>
      </div>

      {error ? (
        <div className="card" style={{ maxWidth: 'none', marginBottom: 20 }}>
          <p className="error-text">{error}</p>
        </div>
      ) : null}

      {alreadyConfirmed ? (
        <div className="card" style={{ maxWidth: 'none' }}>
          <h2 className="section-heading">{t('rsvp.confirmedTitle')}</h2>
          <p>
            <strong>{t('rsvp.statusLabel')}:</strong>{' '}
            {confirmedRsvp?.attending ? t('rsvp.attendingStatus') : t('rsvp.notAttendingStatus')}
          </p>
          {confirmedRsvp?.attending && confirmedRsvp.faction ? (
            <p>
              <strong>{t('rsvp.factionLabel')}:</strong>{' '}
              {getFactionLabel(confirmedRsvp.faction, t)}
            </p>
          ) : null}
          {confirmedRsvp?.attending && confirmedRsvp.dietaryNotes ? (
            <p>
              <strong>{t('rsvp.dietaryLabel')}:</strong> {confirmedRsvp.dietaryNotes}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="card" style={{ maxWidth: 'none' }}>
          <h2 className="section-heading">{t('rsvp.formTitle')}</h2>
          {!isAuthenticated ? (
            <p className="helper-text">
              {t('rsvp.loginHint')}{' '}
              <Link className="text-link" to="/auth/login">
                {t('rsvp.loginLink')}
              </Link>
            </p>
          ) : null}

          <div style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
            <button
              type="button"
              className={`button ${attending ? 'button-primary' : 'button-secondary'}`}
              onClick={() => setAttending(true)}>
              {t('common.yes')}
            </button>
            <button
              type="button"
              className={`button ${!attending ? 'button-primary' : 'button-secondary'}`}
              onClick={() => setAttending(false)}>
              {t('common.no')}
            </button>
          </div>

          {attending ? (
            <>
              <p className="eyebrow">{t('rsvp.chooseFaction')}</p>
              <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
                {getFactionOptions(t).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`button ${faction === item.id ? 'button-primary' : 'button-secondary'}`}
                    style={{ justifyContent: 'flex-start', borderRadius: 16 }}
                    onClick={() => setFaction(item.id)}>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
              <label className="field">
                <span>{t('rsvp.dietaryLabel')}</span>
                <textarea
                  className="textarea"
                  placeholder={t('rsvp.dietaryPlaceholder')}
                  value={dietaryNotes}
                  onChange={(event) => setDietaryNotes(event.target.value)}
                />
              </label>
            </>
          ) : (
            <p className="helper-text">{t('rsvp.notAttendingHint')}</p>
          )}

          <button
            type="button"
            className="button button-primary"
            disabled={submitting}
            onClick={() => void handleSubmit()}>
            {isAuthenticated
              ? submitting
                ? t('rsvp.submitLoading')
                : t('rsvp.submitLabel')
              : t('rsvp.loginSubmitLabel')}
          </button>
        </div>
      )}
    </div>
  );
}
