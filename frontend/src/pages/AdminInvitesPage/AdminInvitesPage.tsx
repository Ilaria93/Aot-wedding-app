import { MessageCircle, Phone, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { AdminModal } from '@/components/AdminModal';
import { LoadingScreen } from '@/components/LoadingScreen';
import { PageAlert } from '@/components/PageShell';
import { useI18n } from '@/contexts/I18nContext';
import { getApiStatusCode } from '@/services/apiErrors';
import {
  approveInviteRequest,
  fetchPendingInviteRequests,
  markInviteSent,
  rejectInviteRequest,
  type InviteRequestItem,
} from '@/services/adminInvitesApi';
import { INVITE_REQUESTS_CHANGED } from './inviteFilters';
import './styles/AdminInvitesPage.scss';

function fullName(person: { first_name: string; last_name: string }) {
  return `${person.first_name} ${person.last_name}`;
}

/** Admin section: approve invite requests from the site and send invites on WhatsApp. */
export function AdminInvitesPage() {
  const { t, locale } = useI18n();
  const [requests, setRequests] = useState<InviteRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<InviteRequestItem | null>(null);

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString(locale);

  const reload = useCallback(async () => {
    try {
      setRequests(await fetchPendingInviteRequests());
      setError(null);
    } catch {
      setError(t('admin.invites.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // After approve/reject: refresh the lists and tell the nav badge to refetch.
  async function afterDecision() {
    window.dispatchEvent(new Event(INVITE_REQUESTS_CHANGED));
    await reload();
  }

  function reportActionError(caughtError: unknown) {
    setError(
      getApiStatusCode(caughtError) === 409 ? t('admin.invites.alreadyDecided') : t('admin.invites.actionFailed'),
    );
  }

  async function handleApprove(request: InviteRequestItem) {
    // Open the tab inside the click: browsers block window.open after an await.
    const whatsappTab = window.open('', '_blank');
    setBusyId(request.id);
    try {
      const result = await approveInviteRequest(request.id);
      if (whatsappTab) whatsappTab.location.href = result.whatsapp_url;
      else window.location.href = result.whatsapp_url;
      await markInviteSent(result.invite_link_id);
    } catch (caughtError) {
      whatsappTab?.close();
      reportActionError(caughtError);
    } finally {
      setBusyId(null);
      await afterDecision();
    }
  }

  async function confirmReject() {
    if (!rejectTarget) return;
    const target = rejectTarget;
    setBusyId(target.id);
    try {
      await rejectInviteRequest(target.id);
      setRejectTarget(null);
    } catch (caughtError) {
      setRejectTarget(null);
      reportActionError(caughtError);
    } finally {
      setBusyId(null);
      await afterDecision();
    }
  }

  if (loading) {
    return <LoadingScreen label={t('common.loading')} />;
  }

  return (
    <>
      {error ? <PageAlert message={error} /> : null}

      <section className="obw-portal-panel admin-invites__section">
        <h2 className="obw-portal-kicker admin-invites__section-title">{t('admin.invites.requestsTitle')}</h2>
        {requests.length === 0 ? (
          <p className="obw-body obw-body--flush">{t('admin.invites.requestsEmpty')}</p>
        ) : (
          <div className="admin-invites__grid">
            {requests.map((request) => (
              <article key={request.id} className="obw-portal-card admin-invites__card">
                <p className="admin-invites__name">{fullName(request)}</p>
                <p className="admin-invites__meta">
                  <Phone size={14} aria-hidden />
                  {request.phone}
                </p>
                <p className="admin-invites__meta">
                  {t('admin.invites.requestedOn', { date: formatDate(request.created_at) })}
                </p>
                {request.existing_invite ? (
                  <p className="admin-invites__warning">
                    {t('admin.invites.existingInvite', { name: fullName(request.existing_invite) })}
                  </p>
                ) : null}
                <div className="admin-invites__actions">
                  <button
                    type="button"
                    className="obw-portal-btn"
                    disabled={busyId === request.id}
                    onClick={() => void handleApprove(request)}>
                    <MessageCircle size={14} aria-hidden />
                    {busyId === request.id ? t('admin.invites.approving') : t('admin.invites.approve')}
                  </button>
                  <button
                    type="button"
                    className="obw-portal-btn obw-portal-btn--secondary"
                    disabled={busyId === request.id}
                    onClick={() => setRejectTarget(request)}>
                    <X size={14} aria-hidden />
                    {t('admin.invites.reject')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {rejectTarget ? (
        <AdminModal
          titleId="admin-invites-reject-title"
          title={t('admin.invites.rejectConfirmTitle')}
          role="alertdialog"
          onClose={() => setRejectTarget(null)}
          t={t}>
          <p className="admin-modal__body">
            {t('admin.invites.rejectConfirmBody', { name: fullName(rejectTarget) })}
          </p>
          <div className="admin-modal__actions">
            <button
              type="button"
              className="obw-portal-btn"
              disabled={busyId === rejectTarget.id}
              onClick={() => void confirmReject()}>
              {t('admin.invites.reject')}
            </button>
            <button
              type="button"
              className="obw-portal-btn obw-portal-btn--secondary"
              onClick={() => setRejectTarget(null)}>
              {t('common.cancel')}
            </button>
          </div>
        </AdminModal>
      ) : null}
    </>
  );
}
