import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

import '@/components/Landing/styles/CoupleContactDialog.scss';
import { useI18n } from '@/contexts/I18nContext';

type DeclineDialogProps = {
  open: boolean;
  plural: boolean;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * "Are you sure you can't come?" — the answer is saved only on the second tap,
 * so a stray tap on "No" never records anything. A native <dialog>: it sits
 * above the letter's fixed layers and handles Escape and focus on its own.
 */
export function DeclineDialog({ open, plural, busy, error, onConfirm, onClose }: DeclineDialogProps) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="obw-card obw-card--dark couple-contact"
      aria-labelledby="decline-dialog-title"
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop lands on the <dialog> itself.
        if (event.target === event.currentTarget && !busy) onClose();
      }}>
      <button type="button" className="couple-contact__close" aria-label={t('common.cancel')} disabled={busy} onClick={onClose}>
        <X size={16} aria-hidden />
      </button>
      <h2 id="decline-dialog-title" className="obw-display obw-display--sm couple-contact__title">
        {t('invite.decline.title')}
      </h2>
      <p className="obw-body couple-contact__text">{t(plural ? 'invite.decline.textPlural' : 'invite.decline.text')}</p>
      {error ? (
        <p className="auth-form__error couple-contact__error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="couple-contact__options couple-contact__options--stack">
        <button type="button" className="obw-btn obw-btn--primary couple-contact__option" disabled={busy} onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="obw-btn obw-btn--secondary couple-contact__option" disabled={busy} onClick={onConfirm}>
          {busy ? t('invite.decline.busy') : t(plural ? 'invite.decline.confirmPlural' : 'invite.decline.confirm')}
        </button>
      </div>
    </dialog>
  );
}
