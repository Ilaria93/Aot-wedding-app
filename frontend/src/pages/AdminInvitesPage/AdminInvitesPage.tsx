import { MessageCircle, Phone, RotateCw, Send, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AdminModal } from '@/components/AdminModal';
import { FilterPills } from '@/components/FilterPills';
import { LoadingScreen } from '@/components/LoadingScreen';
import { PageAlert } from '@/components/PageShell';
import { SearchBar } from '@/components/SearchBar';
import { useI18n } from '@/contexts/I18nContext';
import { getApiStatusCode } from '@/services/apiErrors';
import {
  approveInviteRequest,
  fetchAdminInvites,
  fetchPendingInviteRequests,
  markInviteSent,
  rejectInviteRequest,
  type AdminInviteItem,
  type InviteRequestItem,
} from '@/services/adminInvitesApi';
import { INVITE_REQUESTS_CHANGED, countInvites, filterInvites, type InviteFilter } from './inviteFilters';
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
  const [invites, setInvites] = useState<AdminInviteItem[]>([]);
  const [filter, setFilter] = useState<InviteFilter>('to_send');
  const [search, setSearch] = useState('');
  const [sendingId, setSendingId] = useState<number | null>(null);

  const counts = useMemo(() => countInvites(invites), [invites]);
  const visibleInvites = useMemo(() => filterInvites(invites, filter, search), [invites, filter, search]);

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString(locale);

  const reload = useCallback(async () => {
    try {
      const [nextRequests, nextInvites] = await Promise.all([fetchPendingInviteRequests(), fetchAdminInvites()]);
      setRequests(nextRequests);
      setInvites(nextInvites);
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
    setError(null);
    setBusyId(request.id);
    try {
      let result;
      try {
        result = await approveInviteRequest(request.id);
      } catch (caughtError) {
        whatsappTab?.close();
        reportActionError(caughtError);
        return;
      }
      try {
        if (whatsappTab) {
          whatsappTab.location.href = result.whatsapp_url;
          await markInviteSent(result.invite_link_id);
        } else {
          // Popup blocked: mark as sent before navigating away from this page.
          await markInviteSent(result.invite_link_id);
          window.location.href = result.whatsapp_url;
        }
      } catch {
        setError(t('admin.invites.markSentFailed'));
      }
    } finally {
      setBusyId(null);
      await afterDecision();
    }
  }

  async function confirmReject() {
    if (!rejectTarget) return;
    const target = rejectTarget;
    setError(null);
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

  async function handleSent(invite: AdminInviteItem) {
    setError(null);
    setSendingId(invite.id);
    try {
      await markInviteSent(invite.id);
    } catch {
      setError(t('admin.invites.actionFailed'));
    } finally {
      setSendingId(null);
      await reload();
    }
  }

  function answerLabel(invite: AdminInviteItem) {
    if (invite.answer === 'attending') return t('admin.invites.answerAttending');
    if (invite.answer === 'declined') return t('admin.invites.answerDeclined');
    return t('admin.invites.answerNone');
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

      <section className="obw-portal-panel admin-invites__section">
        <h2 className="obw-portal-kicker admin-invites__section-title">{t('admin.invites.listTitle')}</h2>
        <FilterPills<InviteFilter>
          options={[
            { id: 'to_send', label: t('admin.invites.filterToSend', { count: counts.to_send }) },
            { id: 'sent', label: t('admin.invites.filterSent', { count: counts.sent }) },
            { id: 'answered', label: t('admin.invites.filterAnswered', { count: counts.answered }) },
          ]}
          active={filter}
          onChange={setFilter}
        />
        <SearchBar value={search} onChange={setSearch} placeholder={t('admin.invites.searchPlaceholder')} />

        {visibleInvites.length === 0 ? (
          <p className="obw-body obw-body--flush">{t('admin.invites.listEmpty')}</p>
        ) : (
          <ul className="admin-invites__list">
            {visibleInvites.map((invite) => (
              <li key={invite.id} className="obw-portal-card admin-invites__row">
                <div className="admin-invites__row-info">
                  <p className="admin-invites__name">{fullName(invite)}</p>
                  <p className="admin-invites__meta">
                    <Phone size={14} aria-hidden />
                    {invite.phone ?? t('admin.invites.noPhone')}
                  </p>
                  <p className="admin-invites__meta">
                    {invite.sent_at
                      ? t('admin.invites.sentOn', { date: formatDate(invite.sent_at) })
                      : t('admin.invites.notSent')}
                    {' · '}
                    {answerLabel(invite)}
                  </p>
                </div>
                <a
                  className={`obw-portal-btn${invite.sent_at ? ' obw-portal-btn--secondary' : ''}`}
                  href={invite.whatsapp_url}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={sendingId === invite.id}
                  onClick={(event) => {
                    if (sendingId !== null) {
                      event.preventDefault();
                      return;
                    }
                    void handleSent(invite);
                  }}>
                  {invite.sent_at ? <RotateCw size={14} aria-hidden /> : <Send size={14} aria-hidden />}
                  {invite.sent_at ? t('admin.invites.resend') : t('admin.invites.send')}
                </a>
              </li>
            ))}
          </ul>
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
