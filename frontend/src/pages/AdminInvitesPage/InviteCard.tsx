import { Copy, MessageCircle, Pencil, Phone, RotateCw, Send, Trash2, UserPlus } from 'lucide-react';

import { useI18n } from '@/contexts/I18nContext';
import type { AdminInviteItem, InviteMember } from '@/services/adminInvitesApi';
import { RELATION_KEYS } from './inviteForm';

type InviteCardProps = {
  invite: AdminInviteItem;
  busy: boolean;
  formatDate: (iso: string) => string;
  onSend: (invite: AdminInviteItem) => void;
  onSendToMember: (invite: AdminInviteItem, member: InviteMember) => void;
  onCopy: (invite: AdminInviteItem) => void;
  onEdit: (invite: AdminInviteItem) => void;
  onEditMember: (invite: AdminInviteItem, member: InviteMember) => void;
  onAddMember: (invite: AdminInviteItem) => void;
  onDelete: (invite: AdminInviteItem) => void;
};

/** One guest group: the head who receives the invite, and the people linked to them. */
export function InviteCard({
  invite,
  busy,
  formatDate,
  onSend,
  onSendToMember,
  onCopy,
  onEdit,
  onEditMember,
  onAddMember,
  onDelete,
}: InviteCardProps) {
  const { t } = useI18n();
  const answerLabel =
    invite.answer === 'attending'
      ? t('admin.invites.answerAttending')
      : invite.answer === 'declined'
        ? t('admin.invites.answerDeclined')
        : t('admin.invites.answerNone');

  return (
    <li className="obw-portal-card admin-invites__card">
      <div className="admin-invites__card-head">
        <div className="admin-invites__row-info">
          <p className="admin-invites__name">
            {invite.first_name} {invite.last_name}
          </p>
          {/* Only what matters, on one line: phone, party size, sent date, answer. */}
          <p className="admin-invites__meta admin-invites__meta--row">
            <span className="admin-invites__meta-item">
              <Phone size={14} aria-hidden />
              {invite.phone ?? t('admin.invites.noPhone')}
            </span>
            {invite.party_size ? (
              <span className="admin-invites__meta-item">{t('admin.invites.partySize', { count: invite.party_size })}</span>
            ) : null}
            <span className="admin-invites__meta-item">
              {invite.sent_at ? t('admin.invites.sentOn', { date: formatDate(invite.sent_at) }) : t('admin.invites.notSent')}
            </span>
            <span className="admin-invites__meta-item">{answerLabel}</span>
          </p>
        </div>
        <div className="admin-invites__actions">
          <button
            type="button"
            className={`obw-portal-btn${invite.sent_at ? ' obw-portal-btn--secondary' : ''}`}
            disabled={busy}
            onClick={() => onSend(invite)}>
            {invite.sent_at ? <RotateCw size={14} aria-hidden /> : <Send size={14} aria-hidden />}
            {invite.sent_at ? t('admin.invites.resend') : t('admin.invites.send')}
          </button>
          <button type="button" className="obw-portal-btn obw-portal-btn--secondary" onClick={() => onCopy(invite)}>
            <Copy size={14} aria-hidden />
            {t('admin.invites.copyLink')}
          </button>
          {invite.editable ? (
            <>
              <button type="button" className="obw-portal-btn obw-portal-btn--secondary" onClick={() => onEdit(invite)}>
                <Pencil size={14} aria-hidden />
                {t('admin.invites.edit')}
              </button>
              <button
                type="button"
                className="obw-portal-btn obw-portal-btn--secondary"
                onClick={() => onAddMember(invite)}>
                <UserPlus size={14} aria-hidden />
                {t('admin.invites.addPerson')}
              </button>
            </>
          ) : null}
          <button
            type="button"
            className="obw-portal-btn obw-portal-btn--secondary admin-invites__delete"
            aria-label={t('admin.invites.delete')}
            title={t('admin.invites.delete')}
            disabled={busy}
            onClick={() => onDelete(invite)}>
            <Trash2 size={16} aria-hidden />
          </button>
        </div>
      </div>

      {invite.members.length > 0 ? (
        <div className="admin-invites__members">
          <p className="obw-portal-kicker">{t('admin.invites.groupTitle')}</p>
          <ul>
            {invite.members.map((member) => (
              <li key={member.id}>
                <span>
                  {member.first_name} {member.last_name}
                  <em> · {t(RELATION_KEYS[member.relation])}</em>
                  {member.phone ? <span className="admin-invites__member-phone"> · {member.phone}</span> : null}
                </span>
                <span className="admin-invites__member-actions">
                  {member.phone ? (
                    <button
                      type="button"
                      className="obw-portal-btn obw-portal-btn--secondary"
                      disabled={busy}
                      onClick={() => onSendToMember(invite, member)}>
                      <MessageCircle size={14} aria-hidden />
                      {t('admin.invites.sendTo', { name: member.first_name })}
                    </button>
                  ) : null}
                  {invite.editable ? (
                    <button
                      type="button"
                      className="obw-portal-btn obw-portal-btn--secondary"
                      onClick={() => onEditMember(invite, member)}>
                      <Pencil size={14} aria-hidden />
                      {t('admin.invites.edit')}
                    </button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

    </li>
  );
}
