import { Trash2 } from 'lucide-react';

import type { TranslateFn } from '@/i18n/translations';
import { AdminModal } from './AdminModal';

type AdminConfirmDialogProps = {
  titleId: string;
  title: string;
  message: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  t: TranslateFn;
};

/** In-page replacement for window.confirm on destructive admin actions. */
export function AdminConfirmDialog({ titleId, title, message, busy = false, onConfirm, onClose, t }: AdminConfirmDialogProps) {
  return (
    <AdminModal titleId={titleId} title={title} role="alertdialog" onClose={onClose} t={t}>
      <p className="admin-modal__body">{message}</p>
      <div className="admin-modal__actions">
        <button type="button" className="admin-modal__danger" disabled={busy} onClick={onConfirm}>
          <Trash2 size={14} aria-hidden />
          {t('common.delete')}
        </button>
        <button type="button" className="obw-portal-btn obw-portal-btn--secondary" disabled={busy} onClick={onClose}>
          {t('common.cancel')}
        </button>
      </div>
    </AdminModal>
  );
}
