import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
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
  const backdropRef = useRef<HTMLDivElement>(null);

  // On a phone the keyboard covers part of the screen without resizing the page: fit the backdrop to the part
  // still visible (the dialog then scrolls inside it) and bring the field being typed in into view.
  useEffect(() => {
    const backdrop = backdropRef.current;
    const viewport = window.visualViewport;
    if (!backdrop || !viewport) return;
    const fit = () => {
      backdrop.style.top = `${viewport.offsetTop}px`;
      backdrop.style.height = `${viewport.height}px`;
      backdrop.style.bottom = 'auto';
    };
    const reveal = (event: FocusEvent) => {
      const field = event.target as HTMLElement;
      window.setTimeout(() => field.scrollIntoView?.({ block: 'center', behavior: 'smooth' }), 300);
    };
    fit();
    viewport.addEventListener('resize', fit);
    viewport.addEventListener('scroll', fit);
    backdrop.addEventListener('focusin', reveal);
    return () => {
      viewport.removeEventListener('resize', fit);
      viewport.removeEventListener('scroll', fit);
      backdrop.removeEventListener('focusin', reveal);
    };
  }, []);

  return createPortal(
    <div ref={backdropRef} className="admin-modal-backdrop" onClick={onClose}>
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
