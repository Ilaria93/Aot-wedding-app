import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { EnvelopeInvite } from '@/components/EnvelopeInvite';
import { useI18n } from '@/contexts/I18nContext';
import { fetchInviteByToken, type InviteLink } from '@/services/inviteApi';

import './styles/InvitePage.scss';

type LoadState = 'loading' | 'ready' | 'error';

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
        const result = await fetchInviteByToken(currentToken);
        if (isMounted) {
          setInvite(result);
          setState('ready');
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
    return (
      <div className="obw-page invite-page invite-page--centered">
        <p className="obw-body">{t('common.loading')}</p>
      </div>
    );
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
      <EnvelopeInvite token={token ?? ''} firstName={invite.first_name} />
    </div>
  );
}
