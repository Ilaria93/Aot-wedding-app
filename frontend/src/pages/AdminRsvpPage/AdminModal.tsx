import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

import type { TranslateFn } from '@/i18n/translations';

type AdminModalProps = {
  titleId: string;
  title: ReactNode;
  role?: 'dialog' | 'alertdialog';
  onClose: () => void;
  t: TranslateFn;
  children: ReactNode;
};

// Shared shell for every modal on this page (add table, delete table) —
// backdrop, dialog box, header with close button — portaled to document.body
// since PageShell's backdrop-filter would otherwise trap position:fixed.
export function AdminModal({ titleId, title, role = 'dialog', onClose, t, children }: AdminModalProps) {
  return createPortal(
    <div className="admin-rsvp__modal-backdrop" onClick={onClose}>
      <div
        className="admin-rsvp__modal"
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}>
        <div className="admin-rsvp__modal-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="admin-rsvp__modal-close" aria-label={t('common.cancel')} onClick={onClose}>
            <X size={16} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
