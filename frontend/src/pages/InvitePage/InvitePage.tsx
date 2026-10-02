import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import { LoadingScreen } from '@/components/LoadingScreen';
import { EnvelopeInvite } from '@/components/EnvelopeInvite';
import { useI18n } from '@/contexts/I18nContext';
import { fetchInviteByToken, fetchInviteRsvp, type InviteLink } from '@/services/inviteApi';

import './styles/InvitePage.scss';

type LoadState = 'loading' | 'ready' | 'error' | 'answered';

/** Landing page for the personalized WhatsApp invite link (`/invito/:token`). */
export function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useI18n();
  const [state, setState] = useState<LoadState>('loading');
  const [invite, setInvite] = useState<InviteLink | null>(null);

  useEffect(() => {
    if (!token) {
      setState('error');
      return;
    }

    let isMounted = true;
    const currentToken = token;

    async function loadInvite() {
      try {
        // The saved answer is optional: if it can't be read, show the envelope as usual.
        const [result, rsvp] = await Promise.all([
          fetchInviteByToken(currentToken),
          fetchInviteRsvp(currentToken).catch(() => null),
        ]);
        if (isMounted) {
          setInvite(result);
          setState(rsvp?.has_rsvp ? 'answered' : 'ready');
        }
      } catch {
        if (isMounted) {
          setState('error');
        }
      }
    }

    void loadInvite();

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (state === 'loading') {
    return <LoadingScreen label={t('common.loading')} />;
  }

  // Already answered: skip the envelope and show what they confirmed.
  if (state === 'answered') {
    return <Navigate to={`/invito/${token}/rsvp`} replace />;
  }

  if (state === 'error' || !invite) {
    return (
      <div className="obw-page invite-page invite-page--centered">
        <div className="invite-page__error-card obw-portal-frame obw-portal-frame--light">
          <h1 className="obw-display obw-display--sm">{t('invite.notFoundTitle')}</h1>
          <p className="obw-body">{t('invite.notFoundBody')}</p>
          <Link className="obw-btn obw-btn--primary obw-btn--block" to="/">
            {t('invite.notFoundBackHome')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="invite-page">
      <EnvelopeInvite
        token={token ?? ''}
        greetingKind={invite.greeting_kind}
        greetingName={invite.greeting_name}
        greetingNames={invite.greeting_names}
      />
    </div>
  );
}
