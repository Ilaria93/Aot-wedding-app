import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

import type { TranslateFn } from '@/i18n/translations';
import './styles/AdminModal.scss';

type AdminModalProps = {
  titleId: string;
  title: ReactNode;
  role?: 'dialog' | 'alertdialog';
  size?: 'sm' | 'md';
  onClose: () => void;
  t: TranslateFn;
  children: ReactNode;
};

// Shared modal shell for every admin section — backdrop, dialog box, header
// with close button — portaled to document.body since PageShell's
// backdrop-filter would otherwise trap position:fixed to its own box.
export function AdminModal({ titleId, title, role = 'dialog', size = 'sm', onClose, t, children }: AdminModalProps) {
  return createPortal(
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className={`admin-modal admin-modal--${size}`}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}>
        <div className="admin-modal__head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="admin-modal__close" aria-label={t('common.cancel')} onClick={onClose}>
            <X size={16} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
