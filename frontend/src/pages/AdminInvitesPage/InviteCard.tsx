import { Copy, Pencil, Phone, RotateCw, Send, Trash2 } from 'lucide-react';

import { useI18n } from '@/contexts/I18nContext';
import type { AdminInviteItem, InviteMember } from '@/services/adminInvitesApi';
import { RELATION_KEYS } from './inviteForm';

type InviteCardProps = {
  invite: AdminInviteItem;
  busy: boolean;
  formatDate: (iso: string) => string;
  onSend: (invite: AdminInviteItem) => void;
  /** A group opens the 'only the head, or everyone?' dialog (kept by the page: the card leaves this list once sent). */
  onOpenSend: (invite: AdminInviteItem) => void;
  onCopy: (url: string) => void;
  onEdit: (invite: AdminInviteItem) => void;
  onDelete: (invite: AdminInviteItem) => void;
  onDeleteMember: (invite: AdminInviteItem, member: InviteMember) => void;
};

/** One guest group: the head who receives the invite, and the people linked to them. */
export function InviteCard({
  invite,
  busy,
  formatDate,
  onSend,
  onOpenSend,
  onCopy,
  onEdit,
  onDelete,
  onDeleteMember,
}: InviteCardProps) {
  const { t } = useI18n();
  // A group opens the send dialog while there is a choice to make (how to send it) or one chat per person to
  // open; a shared invite that is already out is simply resent, and a single person is sent straight away.
  const opensSendDialog = invite.members.length > 0 && (invite.individual || invite.editable);
  // An individual group is sent person by person: the head's line shows the head's own state.
  const headSentAt = invite.individual ? invite.own_sent_at : invite.sent_at;
  const answerText = (answer: AdminInviteItem['answer']) =>
    answer === 'attending'
      ? t('admin.invites.answerAttending')
      : answer === 'declined'
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
            {invite.party_size && !invite.individual ? (
              <span className="admin-invites__meta-item">
                {t(invite.party_size === 1 ? 'admin.invites.partySizeOne' : 'admin.invites.partySize', { count: invite.party_size })}
              </span>
            ) : null}
            <span className="admin-invites__meta-item">
              {headSentAt ? t('admin.invites.sentOn', { date: formatDate(headSentAt) }) : t('admin.invites.notSent')}
            </span>
            <span className="admin-invites__meta-item">{answerText(invite.answer)}</span>
            {invite.individual ? <span className="admin-invites__meta-item">{t('admin.invites.individualBadge')}</span> : null}
          </p>
        </div>
        <div className="admin-invites__actions">
          <button
            type="button"
            className={`obw-portal-btn${invite.sent_at ? ' obw-portal-btn--secondary' : ''}`}
            disabled={busy}
            onClick={() => (opensSendDialog ? onOpenSend(invite) : onSend(invite))}>
            {invite.sent_at ? <RotateCw size={14} aria-hidden /> : <Send size={14} aria-hidden />}
            {invite.sent_at ? t('admin.invites.resend') : t('admin.invites.send')}
          </button>
          {/* Everything else is an icon: label on hover and for screen readers. */}
          <button
            type="button"
            className="obw-portal-btn obw-portal-btn--secondary admin-invites__icon"
            aria-label={t('admin.invites.copyLink')}
            title={t('admin.invites.copyLink')}
            onClick={() => onCopy(invite.invite_url)}>
            <Copy size={16} aria-hidden />
          </button>
          {invite.editable ? (
            <button
              type="button"
              className="obw-portal-btn obw-portal-btn--secondary admin-invites__icon"
              aria-label={t('admin.invites.edit')}
              title={t('admin.invites.edit')}
              onClick={() => onEdit(invite)}>
              <Pencil size={16} aria-hidden />
            </button>
          ) : null}
          <button
            type="button"
            className="obw-portal-btn obw-portal-btn--secondary admin-invites__icon admin-invites__delete"
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
                  {invite.individual ? (
                    <span className="admin-invites__member-status">
                      {' · '}
                      {member.sent_at ? t('admin.invites.sentOn', { date: formatDate(member.sent_at) }) : t('admin.invites.notSent')}
                      {' · '}
                      {answerText(member.answer)}
                    </span>
                  ) : null}
                </span>
                <span className="admin-invites__member-actions">
                  {member.invite_url ? (
                    <button
                      type="button"
                      className="obw-portal-btn obw-portal-btn--secondary admin-invites__icon"
                      aria-label={t('admin.invites.copyLink')}
                      title={t('admin.invites.copyLink')}
                      onClick={() => onCopy(member.invite_url as string)}>
                      <Copy size={16} aria-hidden />
                    </button>
                  ) : null}
                  {invite.editable ? (
                    <>
                      <button
                        type="button"
                        className="obw-portal-btn obw-portal-btn--secondary admin-invites__icon"
                        aria-label={t('admin.invites.edit')}
                        title={t('admin.invites.edit')}
                        onClick={() => onEdit(invite)}>
                        <Pencil size={16} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="obw-portal-btn obw-portal-btn--secondary admin-invites__icon admin-invites__delete"
                        aria-label={t('admin.invites.deleteMember')}
                        title={t('admin.invites.deleteMember')}
                        onClick={() => onDeleteMember(invite, member)}>
                        <Trash2 size={16} aria-hidden />
                      </button>
                    </>
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
