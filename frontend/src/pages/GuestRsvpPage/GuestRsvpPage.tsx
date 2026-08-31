import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { RsvpPartyForm } from '@/components/Rsvp/RsvpPartyForm';
import { useI18n } from '@/contexts/I18nContext';
import { fetchInviteByToken, type InviteLink } from '@/services/inviteApi';
import { useGuestRsvpDraft } from '@/pages/GuestRsvpPage/useGuestRsvpDraft';
import './styles/GuestRsvpPage.scss';

type LoadState = 'loading' | 'ready' | 'error';

/** First, unauthenticated RSVP confirmation reached from the WhatsApp invite link. */
export function GuestRsvpPage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useI18n();
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [invite, setInvite] = useState<InviteLink | null>(null);

  useEffect(() => {
    if (!token) {
      setLoadState('error');
      return;
    }
    let isMounted = true;
    fetchInviteByToken(token)
      .then((result) => {
        if (isMounted) {
          setInvite(result);
          setLoadState('ready');
        }
      })
      .catch(() => {
        if (isMounted) setLoadState('error');
      });
    return () => {
      isMounted = false;
    };
  }, [token]);

  if (loadState === 'loading') {
    return (
      <div className="obw-page guest-rsvp-page guest-rsvp-page--centered">
        <p className="obw-body">{t('common.loading')}</p>
      </div>
    );
  }

  if (loadState === 'error' || !invite || !token) {
    return (
      <div className="obw-page guest-rsvp-page guest-rsvp-page--centered">
        <h1 className="obw-display obw-display--sm">{t('invite.notFoundTitle')}</h1>
        <p className="obw-body">{t('invite.notFoundBody')}</p>
      </div>
    );
  }

  // Deliberately a child component: useGuestRsvpDraft seeds the account-holder
  // row in a lazy useState initializer that never re-runs, so mounting it
  // before `invite` arrived would lock in empty names — which the form then
  // renders disabled and validation skips, so every submit 422'd server-side.
  return <GuestRsvpConfirmForm token={token} invite={invite} />;
}

function GuestRsvpConfirmForm({ token, invite }: { token: string; invite: InviteLink }) {
  const { t } = useI18n();
  const draft = useGuestRsvpDraft(token, invite, t);

  if (draft.confirmed) {
    return (
      <div className="obw-page guest-rsvp-page guest-rsvp-page--centered">
        <h1 className="obw-display obw-display--lg">{t('guestRsvp.confirmedTitle')}</h1>
        <p className="obw-body">{t('guestRsvp.confirmedBody', { email: draft.email })}</p>
      </div>
    );
  }

  return (
    <div className="obw-page guest-rsvp-page">
      <div className="obw-container guest-rsvp-page__inner">
        <header className="guest-rsvp-page__header">
          <h1 className="obw-display obw-display--lg">
            {invite.first_name} {invite.last_name}
          </h1>
          <p className="obw-body">{t('guestRsvp.intro')}</p>
        </header>

        <label className="obw-field guest-rsvp-page__email" htmlFor="guest-rsvp-email">
          <span className="obw-field-label">{t('guestRsvp.emailLabel')}</span>
          <input
            id="guest-rsvp-email"
            className="obw-input"
            type="email"
            autoComplete="email"
            value={draft.email}
            onChange={(event) => draft.setEmail(event.target.value)}
          />
          <span className="obw-field-hint">{t('guestRsvp.emailHint')}</span>
        </label>

        {draft.error ? <p className="auth-form__error">{draft.error}</p> : null}

        {/* RsvpPartyForm renders its own submit button (labelled via the
            shared rsvp.submitLabel/submitLoading keys) — reused as-is here
            instead of adding a second button; onSubmit reads draft.email
            via the hook's own state, so the button needs no extra prop. */}
        <RsvpPartyForm
          attending={draft.attending}
          guests={draft.guests}
          submitting={draft.submitting}
          isEditMode={false}
          fieldErrors={draft.fieldErrors}
          partyLimits={{ min: invite.min_party_guests, max: invite.max_party_guests }}
          onAttendingChange={draft.setAttending}
          onGuestsChange={draft.setGuests}
          onSubmit={() => void draft.submit()}
        />
      </div>
    </div>
  );
}
