import { useI18n } from '@/contexts/I18nContext';
import { AdminModal } from '@/components/AdminModal';
import type { AdminInviteItem, InviteMember } from '@/services/adminInvitesApi';

type InviteSendDialogProps = {
  invite: AdminInviteItem;
  busy: boolean;
  /** One shared invite for the whole group, sent from the head's phone. */
  onSendShared: (invite: AdminInviteItem) => void;
  /** Switches the group to one invite per person and sends the head's own. */
  onSendIndividually: (invite: AdminInviteItem) => void;
  onSendHead: (invite: AdminInviteItem) => void;
  onSendMember: (invite: AdminInviteItem, member: InviteMember) => void;
  onClose: () => void;
};

/**
 * "Send on WhatsApp" for a group. Before the first send the admin chooses how: one invite for the whole group
 * (shared greeting and answer) or one invite each (own greeting, link and answer). Once individual, the dialog lists
 * everyone with a button each: one chat per tap, which also works on a phone where WhatsApp opens.
 */
export function InviteSendDialog({ invite, busy, onSendShared, onSendIndividually, onSendHead, onSendMember, onClose }: InviteSendDialogProps) {
  const { t, locale } = useI18n();
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString(locale);

  if (!invite.individual) {
    return (
      <AdminModal titleId="invite-send-title" title={t('admin.invites.sendChoiceTitle')} onClose={onClose} t={t}>
        <div className="admin-invites__send-options">
          <button
            type="button"
            className="obw-portal-btn obw-portal-btn--secondary admin-invites__send-option"
            disabled={busy}
            onClick={() => {
              onSendShared(invite);
              onClose();
            }}>
            <strong>{t('admin.invites.sendGroupOption')}</strong>
            <span>{t('admin.invites.sendGroupHint', { name: invite.first_name })}</span>
          </button>
          <button
            type="button"
            className="obw-portal-btn admin-invites__send-option"
            disabled={busy}
            onClick={() => onSendIndividually(invite)}>
            <strong>{t('admin.invites.sendIndividualOption')}</strong>
            <span>{t('admin.invites.sendIndividualHint')}</span>
          </button>
        </div>
      </AdminModal>
    );
  }

  const people = [
    {
      id: invite.id,
      name: `${invite.first_name} ${invite.last_name}`,
      phone: invite.phone,
      sentAt: invite.own_sent_at,
      send: () => onSendHead(invite),
    },
    ...invite.members.map((member) => ({
      id: member.id,
      name: `${member.first_name} ${member.last_name}`,
      phone: member.phone,
      sentAt: member.sent_at,
      send: () => onSendMember(invite, member),
    })),
  ];

  return (
    <AdminModal titleId="invite-send-title" title={t('admin.invites.sendChoiceTitle')} onClose={onClose} t={t}>
      <p className="admin-modal__body">{t('admin.invites.sendListHint')}</p>
      <ul className="admin-invites__send-list">
        {people.map((person) => (
          <li key={person.id}>
            <span>
              {person.name}
              <em>{person.sentAt ? t('admin.invites.sentOn', { date: formatDate(person.sentAt) }) : t('admin.invites.notSent')}</em>
            </span>
            {person.phone ? (
              <button
                type="button"
                className={`obw-portal-btn${person.sentAt ? ' obw-portal-btn--secondary' : ''}`}
                disabled={busy}
                onClick={person.send}>
                {person.sentAt ? t('admin.invites.resend') : t('admin.invites.sendShort')}
              </button>
            ) : (
              <small>{t('admin.invites.noPhone')}</small>
            )}
          </li>
        ))}
      </ul>
      <div className="admin-modal__actions">
        <button type="button" className="obw-portal-btn obw-portal-btn--secondary" onClick={onClose}>
          {t('admin.invites.close')}
        </button>
      </div>
    </AdminModal>
  );
}
