import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { LoadingScreen } from '@/components/LoadingScreen';
import { RsvpConfirmedSummary } from '@/components/Rsvp/RsvpConfirmedSummary';
import { RsvpPartyForm } from '@/components/Rsvp/RsvpPartyForm';
import { useI18n } from '@/contexts/I18nContext';
import { fetchInviteByToken, fetchInviteRsvp, type InviteLink } from '@/services/inviteApi';
import type { RsvpMe } from '@/services/rsvpApi';
import { useGuestRsvpDraft } from '@/pages/GuestRsvpPage/useGuestRsvpDraft';
// The home's section/card/button look lives here; imported so a direct load of the invite link has it too.
import '@/pages/HomePage/styles/HomePage.scss';
import './styles/GuestRsvpPage.scss';

type LoadState = 'loading' | 'ready' | 'error';

/** Same page frame as the home's sections: artwork + veil, one centred column. */
function GuestRsvpShell({ children, pinned = false }: { children: ReactNode; pinned?: boolean }) {
  return (
    <div className={`landing-page guest-rsvp-page${pinned ? ' guest-rsvp-page--pinned' : ''}`}>
      <div className="landing-veil" style={{ '--veil': 0.6 } as CSSProperties} aria-hidden />
      <div className="landing-page__body">
        <section className="obw-section obw-fade-up">
          <div className="obw-container obw-container--narrow obw-stack-center">{children}</div>
        </section>
      </div>
    </div>
  );
}

/** First, unauthenticated RSVP confirmation reached from the WhatsApp invite link. */
export function GuestRsvpPage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const startAttending = searchParams.get('risposta') !== 'no';
  const { t } = useI18n();
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [invite, setInvite] = useState<InviteLink | null>(null);
  const [existingRsvp, setExistingRsvp] = useState<RsvpMe | null>(null);

  useEffect(() => {
    if (!token) {
      setLoadState('error');
      return;
    }
    let isMounted = true;
    // The saved answer is optional: if it can't be read, the guest just sees the empty form.
    Promise.all([fetchInviteByToken(token), fetchInviteRsvp(token).catch(() => null)])
      .then(([result, rsvp]) => {
        if (isMounted) {
          setInvite(result);
          setExistingRsvp(rsvp);
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
    return <LoadingScreen label={t('common.loading')} />;
  }

  if (loadState === 'error' || !invite || !token) {
    return (
      <GuestRsvpShell>
        <h1 className="obw-display obw-display--lg">{t('invite.notFoundTitle')}</h1>
        <div className="obw-rule obw-rule--center" aria-hidden="true" />
        <div className="obw-card obw-card--dark landing-box">
          <p className="obw-body obw-body--flush">{t('invite.notFoundBody')}</p>
        </div>
      </GuestRsvpShell>
    );
  }

  // Deliberately a child component: useGuestRsvpDraft seeds the account-holder
  // row in a lazy useState initializer that never re-runs, so mounting it
  // before `invite` arrived would lock in empty names — which the form then
  // renders disabled and validation skips, so every submit 422'd server-side.
  return <GuestRsvpConfirmForm token={token} invite={invite} existingRsvp={existingRsvp} startAttending={startAttending} />;
}

function GuestRsvpConfirmForm({
  token,
  invite,
  existingRsvp,
  startAttending,
}: {
  token: string;
  invite: InviteLink;
  existingRsvp: RsvpMe | null;
  startAttending: boolean;
}) {
  const { t } = useI18n();
  const draft = useGuestRsvpDraft(token, invite, t, existingRsvp, startAttending);

  // The two ways to land on a saved answer: right after sending it (thanks and
  // a single "Go to the site" button, nothing else) or by reopening the
  // WhatsApp link later (the answer itself, which can be edited).
  if (draft.viewMode === 'summary') {
    if (draft.justSubmitted) {
      return (
        <GuestRsvpShell pinned>
          <h1 className="obw-display obw-display--lg">{t('guestRsvp.confirmedTitle')}</h1>
          <div className="obw-rule obw-rule--center" aria-hidden="true" />
          <div className="obw-card obw-card--dark landing-box">
            <p className="obw-body obw-body--flush">
              {draft.confirmedRsvp?.attending ? t('guestRsvp.confirmedBody') : t('guestRsvp.declinedBody')}
            </p>
          </div>
          <Link className="obw-btn guest-rsvp-page__cta guest-rsvp-page__cta--wide" to="/">
            {t('invite.moreInfo.cta')}
          </Link>
        </GuestRsvpShell>
      );
    }

    return (
      <GuestRsvpShell pinned>
        <header className="guest-rsvp-page__header">
          <p className="obw-kicker">RSVP</p>
          <h1 className="obw-display obw-display--lg">
            {invite.first_name} {invite.last_name}
          </h1>
          <span className="obw-rule obw-rule--center" aria-hidden="true" />
        </header>
        <RsvpConfirmedSummary
          confirmedRsvp={draft.confirmedRsvp}
          editable={draft.editable}
          declinedGuest={{ first_name: invite.first_name, last_name: invite.last_name }}
        />
        <div className="guest-rsvp-page__actions">
          {draft.editable ? (
            <button type="button" className="obw-btn guest-rsvp-page__edit" onClick={draft.beginEdit}>
              {t('rsvp.editButton')}
            </button>
          ) : null}
          <Link className="obw-btn guest-rsvp-page__cta" to="/">
            {t('invite.moreInfo.cta')}
          </Link>
        </div>
      </GuestRsvpShell>
    );
  }

  const isEditMode = draft.confirmedRsvp !== null;

  return (
    <GuestRsvpShell pinned>
      <header className="guest-rsvp-page__header">
        <p className="obw-kicker">RSVP</p>
        <h1 className="obw-display obw-display--lg">
          {invite.first_name} {invite.last_name}
        </h1>
        <span className="obw-rule obw-rule--center" aria-hidden="true" />
        <p className="obw-body obw-body--flush">{t('guestRsvp.intro')}</p>
      </header>

      {draft.error ? <p className="auth-form__error">{draft.error}</p> : null}

      {/* RsvpPartyForm renders its own submit button (labelled via the
          shared rsvp.submitLabel/submitLoading keys) — reused as-is here
          instead of adding a second button. */}
      <RsvpPartyForm
        attending={draft.attending}
        guests={draft.guests}
        submitting={draft.submitting}
        isEditMode={isEditMode}
        fieldErrors={draft.fieldErrors}
        partyLimits={{ min: invite.min_party_guests, max: invite.max_party_guests }}
        guestsHint={t('guestRsvp.guestsHint')}
        addGuestLabel={`+ ${t('guestRsvp.addGuest')}`}
        notAttendingHint={t('guestRsvp.notAttendingHint')}
        onAttendingChange={draft.setAttending}
        onGuestsChange={draft.setGuests}
        onSubmit={() => void draft.submit()}
        onCancelEdit={isEditMode ? draft.cancelEdit : undefined}
      />
    </GuestRsvpShell>
  );
}
