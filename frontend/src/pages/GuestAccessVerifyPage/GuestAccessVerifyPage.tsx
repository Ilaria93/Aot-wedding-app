import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { verifyGuestMagicLink } from '@/services/guestAccessApi';

type VerifyState = 'verifying' | 'error';

/** Landing page for the emailed magic-link URL — exchanges the token for a real session. */
export function GuestAccessVerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { applySession } = useAuth();
  const { t } = useI18n();
  const [state, setState] = useState<VerifyState>('verifying');
  // Magic links are mono-use, so a double call burns the token and shows the
  // guest an "invalid link" page. StrictMode's dev double-invoke does exactly
  // that; the ref survives it (state and effect cleanup do not).
  const hasRedeemed = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setState('error');
      return;
    }
    if (hasRedeemed.current) return;
    hasRedeemed.current = true;

    let isMounted = true;
    verifyGuestMagicLink(token)
      .then(async (session) => {
        await applySession(session);
        if (isMounted) {
          navigate('/rsvp', { replace: true });
        }
      })
      .catch(() => {
        if (isMounted) setState('error');
      });

    return () => {
      isMounted = false;
    };
  }, [applySession, navigate, searchParams]);

  if (state === 'verifying') {
    return (
      <div className="obw-page guest-access-verify-page">
        <p className="obw-body">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="obw-page guest-access-verify-page">
      <h1 className="obw-display obw-display--sm">{t('guestAccess.verifyErrorTitle')}</h1>
      <p className="obw-body">{t('guestAccess.verifyErrorBody')}</p>
      <Link className="obw-btn obw-btn--primary" to="/accedi/recupera">
        {t('guestAccess.requestNewLink')}
      </Link>
    </div>
  );
}
