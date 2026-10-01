import { FileUp, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { copyToClipboard } from '@/components/HoneymoonGiftSection/copyToClipboard';
import { FilterPills } from '@/components/FilterPills';
import { LoadingScreen } from '@/components/LoadingScreen';
import { PageAlert } from '@/components/PageShell';
import { SearchBar } from '@/components/SearchBar';
import { useI18n } from '@/contexts/I18nContext';
import {
  fetchAdminInvites,
  fetchPersonWhatsappUrl,
  markInviteSent,
  type AdminInviteItem,
  type InviteMatch,
  type InviteMember,
} from '@/services/adminInvitesApi';
import { InviteCard } from './InviteCard';
import { InviteImportDialog } from './InviteImportDialog';
import { InvitePersonDialog, type PersonDialogMode } from './InvitePersonDialog';
import { EMPTY_INVITE_FORM, parseAddParams, type InviteFormValues } from './inviteForm';
import { countInvites, filterInvites, type InviteFilter } from './inviteFilters';
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
export function AdminInvitesPage() {
  const { t, locale } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [invites, setInvites] = useState<AdminInviteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<InviteFilter>('to_send');
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<PersonDialogMode | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const sendingRef = useRef(false);

  const counts = useMemo(() => countInvites(invites), [invites]);
  const visibleInvites = useMemo(() => filterInvites(invites, filter, search), [invites, filter, search]);
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
  async function sendViaWhatsapp(headId: number, resolveUrl: () => string | Promise<string>) {
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
          await markInviteSent(headId);
        } else {
          // Popup blocked: mark as sent before navigating away from this page.
          await markInviteSent(headId);
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

  function handleSendToMember(invite: AdminInviteItem, member: InviteMember) {
    void sendViaWhatsapp(invite.id, () => fetchPersonWhatsappUrl(invite.id, member.id));
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

  async function handleCopy(invite: AdminInviteItem) {
    setError(null);
    if (await copyToClipboard(invite.invite_url)) {
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
    });
  }

  function handleEditMember(invite: AdminInviteItem, member: InviteMember) {
    setDialog({
      kind: 'edit',
      personId: member.id,
      values: formFromPerson(member, { role: 'member', headId: invite.id, relation: member.relation }),
    });
  }

  function handleAddMember(invite: AdminInviteItem) {
    setDialog({ kind: 'add', prefill: { role: 'member', headId: invite.id } });
  }

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
          </div>
        </div>
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
              <InviteCard
                key={invite.id}
                invite={invite}
                busy={sendingId !== null}
                formatDate={formatDate}
                onSend={handleSend}
                onSendToMember={handleSendToMember}
                onCopy={(target) => void handleCopy(target)}
                onEdit={handleEdit}
                onEditMember={handleEditMember}
                onAddMember={handleAddMember}
              />
            ))}
          </ul>
        )}
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
      {importOpen ? <InviteImportDialog onClose={() => setImportOpen(false)} onImported={reload} /> : null}
    </>
  );
}
