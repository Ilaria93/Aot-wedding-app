import { Download, FileUp, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { AdminConfirmDialog } from '@/components/AdminModal';

import { copyToClipboard } from '@/components/HoneymoonGiftSection/copyToClipboard';
import { FilterPills } from '@/components/FilterPills';
import { Pagination } from '@/components/Pagination';
import { LoadingScreen } from '@/components/LoadingScreen';
import { PageAlert } from '@/components/PageShell';
import { SearchBar } from '@/components/SearchBar';
import { useI18n } from '@/contexts/I18nContext';
import {
  deleteInvite,
  deleteInviteMember,
  fetchAdminInvites,
  fetchPersonWhatsappUrl,
  isLockedError,
  makeInviteIndividual,
  markInviteSent,
  type AdminInviteItem,
  type InviteMatch,
  type InviteMember,
  fetchInvitesCsv,
} from '@/services/adminInvitesApi';
import { InviteCard } from './InviteCard';
import { InviteImportDialog } from './InviteImportDialog';
import { InviteSendDialog } from './InviteSendDialog';
import { InvitePersonDialog, type PersonDialogMode } from './InvitePersonDialog';
import { EMPTY_INVITE_FORM, memberRowFromMember, parseAddParams, type InviteFormValues } from './inviteForm';
import { countInvites, countInviteUnits, filterInvites, INVITE_FILTERS, type InviteFilter } from './inviteFilters';
import './styles/AdminInvitesPage.scss';

function formFromPerson(
  person: { first_name: string; last_name: string; phone: string | null; gender: 'm' | 'f' | null },
  extra: Partial<InviteFormValues>,
): InviteFormValues {
  return {
    ...EMPTY_INVITE_FORM,
    firstName: person.first_name,
    lastName: person.last_name,
    phone: person.phone ?? '',
    gender: person.gender ?? '',
    ...extra,
  };
}

/** Admin section: the guest table — add people, link families and couples, send invites on WhatsApp. */
// Cards are tall: a page of them, not the whole guest list at once.
const PAGE_SIZE = 8;

export function AdminInvitesPage() {
  const { t, locale } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [invites, setInvites] = useState<AdminInviteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<InviteFilter>(() => {
    const asked = searchParams.get('filter') as InviteFilter;
    return INVITE_FILTERS.includes(asked) ? asked : 'to_send';
  });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<PersonDialogMode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminInviteItem | null>(null);
  const [memberDeleteTarget, setMemberDeleteTarget] = useState<{ invite: AdminInviteItem; member: InviteMember } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  // Id of the group being sent to: kept here, not in the card, because the card leaves the 'to send' list after the first tap.
  const [sendDialogId, setSendDialogId] = useState<number | null>(null);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const sendingRef = useRef(false);

  const counts = useMemo(() => countInvites(invites), [invites]);
  const visibleInvites = useMemo(() => filterInvites(invites, filter, search), [invites, filter, search]);
  const totalPages = Math.max(1, Math.ceil(visibleInvites.length / PAGE_SIZE));
  // Deleting or filtering can leave the current page past the end.
  const currentPage = Math.min(page, totalPages);
  const pageInvites = useMemo(
    () => visibleInvites.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [visibleInvites, currentPage],
  );
  const editableHeads = useMemo(() => invites.filter((invite) => invite.editable), [invites]);

  const formatDate = useCallback((iso: string) => new Date(iso).toLocaleDateString(locale), [locale]);

  const reload = useCallback(async () => {
    try {
      setInvites(await fetchAdminInvites());
    } catch {
      setError(t('admin.invites.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // The Telegram link (`?add=1&first_name=…`) opens the add form prefilled; then the URL is cleaned.
  useEffect(() => {
    const prefill = parseAddParams(searchParams.toString());
    if (!prefill) return;
    setDialog({ kind: 'add', prefill });
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  // Opens WhatsApp for `headId` and marks the invite sent. The tab is opened inside
  // the click: browsers block window.open after an await.
  async function sendViaWhatsapp(headId: number, resolveUrl: () => string | Promise<string>, personId?: number) {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setError(null);
    setNotice(null);
    setSendingId(headId);
    const whatsappTab = window.open('', '_blank');
    try {
      let url: string;
      try {
        url = await resolveUrl();
      } catch {
        whatsappTab?.close();
        setError(t('admin.invites.actionFailed'));
        return;
      }
      try {
        if (whatsappTab) {
          whatsappTab.location.href = url;
          await markInviteSent(headId, personId);
        } else {
          // Popup blocked: mark as sent before navigating away from this page.
          await markInviteSent(headId, personId);
          window.location.href = url;
        }
      } catch {
        setError(t('admin.invites.markSentFailed'));
      }
    } finally {
      sendingRef.current = false;
      setSendingId(null);
      await reload();
    }
  }

  function handleSend(invite: AdminInviteItem) {
    void sendViaWhatsapp(invite.id, () => invite.whatsapp_url);
  }

  // A member's chat: their own invite in an individual group, otherwise the shared invite sent to their phone.
  function handleSendToMember(invite: AdminInviteItem, member: InviteMember) {
    void sendViaWhatsapp(invite.id, () => fetchPersonWhatsappUrl(invite.id, member.id), invite.individual ? member.id : undefined);
  }

  // First send as one invite per person: everyone gets a link of their own, then the head's goes out right away
  // (the chat tab is opened inside the click, see sendViaWhatsapp).
  function handleSendIndividually(invite: AdminInviteItem) {
    void sendViaWhatsapp(invite.id, async () => {
      await makeInviteIndividual(invite.id);
      return fetchPersonWhatsappUrl(invite.id, invite.id);
    });
  }

  // "Rimanda" from the duplicates panel: the match is a head or someone in their group.
  function handleResendMatch(match: InviteMatch) {
    const head = invites.find((invite) => invite.id === match.head.id);
    if (!head) return;
    setDialog(null);
    if (match.relation) {
      void sendViaWhatsapp(head.id, () => fetchPersonWhatsappUrl(head.id, match.id));
    } else {
      handleSend(head);
    }
  }

  // Deleting is final: an answered invite also loses the answer and the guest's account.
  async function handleDelete(invite: AdminInviteItem) {
    const name = `${invite.first_name} ${invite.last_name}`;
    setDeleteTarget(null);
    setError(null);
    setNotice(null);
    try {
      await deleteInvite(invite.id);
      setNotice(t('admin.invites.deleted', { name }));
    } catch {
      setError(t('admin.invites.actionFailed'));
    }
    await reload();
  }

  async function handleDeleteMember(target: { invite: AdminInviteItem; member: InviteMember }) {
    setMemberDeleteTarget(null);
    setError(null);
    setNotice(null);
    try {
      await deleteInviteMember(target.invite.id, target.member.id);
      setNotice(t('admin.invites.memberDeleted', { name: target.member.first_name }));
    } catch (caughtError) {
      setError(isLockedError(caughtError) ? t('admin.invites.lockedError') : t('admin.invites.actionFailed'));
    }
    await reload();
  }

  async function handleExport() {
    setError(null);
    try {
      const url = URL.createObjectURL(await fetchInvitesCsv());
      const link = document.createElement('a');
      link.href = url;
      link.download = 'invitati.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(t('admin.invites.actionFailed'));
    }
  }

  async function handleCopy(url: string) {
    setError(null);
    if (await copyToClipboard(url)) {
      setNotice(t('admin.invites.linkCopied'));
    } else {
      setError(t('admin.invites.actionFailed'));
    }
  }

  function handleEdit(invite: AdminInviteItem) {
    setDialog({
      kind: 'edit',
      personId: invite.id,
      values: formFromPerson(invite, {
        role: 'head',
        familyName: invite.family_name ?? '',
        partySize: invite.party_size ? String(invite.party_size) : '',
      }),
      members: invite.members.map(memberRowFromMember),
    });
  }

  const sendDialogInvite = invites.find((invite) => invite.id === sendDialogId) ?? null;

  if (loading) {
    return <LoadingScreen label={t('common.loading')} />;
  }

  return (
    <>
      {error ? <PageAlert message={error} /> : null}
      {notice ? (
        <p className="admin-invites__notice" role="status">
          {notice}
        </p>
      ) : null}

      <section className="obw-portal-panel admin-invites__section">
        <div className="admin-invites__toolbar">
          <h2 className="obw-portal-kicker admin-invites__section-title">{t('admin.invites.listTitle')}</h2>
          <div className="admin-invites__toolbar-actions">
            <button type="button" className="obw-portal-btn" onClick={() => setDialog({ kind: 'add' })}>
              <UserPlus size={14} aria-hidden />
              {t('admin.invites.addPerson')}
            </button>
            <button type="button" className="obw-portal-btn obw-portal-btn--secondary" onClick={() => setImportOpen(true)}>
              <FileUp size={14} aria-hidden />
              {t('admin.invites.importCsv')}
            </button>
            <button type="button" className="obw-portal-btn obw-portal-btn--secondary" onClick={handleExport}>
              <Download size={14} aria-hidden />
              {t('admin.invites.exportCsv')}
            </button>
          </div>
        </div>
        <FilterPills<InviteFilter>
          options={[
            { id: 'to_send', label: t('admin.invites.filterToSend', { count: counts.to_send }) },
            { id: 'waiting', label: t('admin.invites.filterWaiting', { count: counts.waiting }) },
            { id: 'answered', label: t('admin.invites.filterAnswered', { count: counts.answered }) },
          ]}
          active={filter}
          onChange={(next) => {
            setFilter(next);
            setPage(1);
          }}
        />
        <p className="obw-body obw-body--flush">{t('admin.invites.totalInvites', { count: countInviteUnits(invites) })}</p>
        <SearchBar
          value={search}
          onChange={(next) => {
            setSearch(next);
            setPage(1);
          }}
          placeholder={t('admin.invites.searchPlaceholder')} />

        {visibleInvites.length === 0 ? (
          <p className="obw-body obw-body--flush">{t('admin.invites.listEmpty')}</p>
        ) : (
          <ul className="admin-invites__list">
            {pageInvites.map((invite) => (
              <InviteCard
                key={invite.id}
                invite={invite}
                busy={sendingId !== null}
                formatDate={formatDate}
                onSend={handleSend}
                onOpenSend={(target) => setSendDialogId(target.id)}
                onCopy={(url) => void handleCopy(url)}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                onDeleteMember={(target, member) => setMemberDeleteTarget({ invite: target, member })}
              />
            ))}
          </ul>
        )}

        {totalPages > 1 ? (
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            label={t('admin.rsvpEntries.pageOf', { page: currentPage, totalPages })}
            prevLabel={t('admin.rsvpEntries.prevPage')}
            nextLabel={t('admin.rsvpEntries.nextPage')}
            onChange={setPage}
          />
        ) : null}
      </section>

      {dialog ? (
        <InvitePersonDialog
          mode={dialog}
          editableHeads={editableHeads}
          formatDate={formatDate}
          onClose={() => setDialog(null)}
          onSaved={reload}
          onResend={handleResendMatch}
        />
      ) : null}
      {deleteTarget ? (
        <AdminConfirmDialog
          titleId="admin-invite-delete-title"
          title={t('admin.invites.delete')}
          message={
            deleteTarget.answer === 'none'
              ? t('admin.invites.confirmDelete', { name: `${deleteTarget.first_name} ${deleteTarget.last_name}` })
              : t('admin.invites.confirmDeleteAnswered', { name: `${deleteTarget.first_name} ${deleteTarget.last_name}` })
          }
          onConfirm={() => void handleDelete(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          t={t}
        />
      ) : null}
      {sendDialogInvite ? (
        <InviteSendDialog
          invite={sendDialogInvite}
          busy={sendingId !== null}
          onSendShared={handleSend}
          onSendIndividually={handleSendIndividually}
          onSendHead={handleSend}
          onSendMember={handleSendToMember}
          onClose={() => setSendDialogId(null)}
        />
      ) : null}
      {memberDeleteTarget ? (
        <AdminConfirmDialog
          titleId="admin-member-delete-title"
          title={t('admin.invites.deleteMember')}
          message={t('admin.invites.confirmDeleteMember', {
            name: `${memberDeleteTarget.member.first_name} ${memberDeleteTarget.member.last_name}`,
            head: `${memberDeleteTarget.invite.first_name} ${memberDeleteTarget.invite.last_name}`,
          })}
          onConfirm={() => void handleDeleteMember(memberDeleteTarget)}
          onClose={() => setMemberDeleteTarget(null)}
          t={t}
        />
      ) : null}
      {importOpen ? <InviteImportDialog onClose={() => setImportOpen(false)} onImported={reload} /> : null}
    </>
  );
}
