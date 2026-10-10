import { CalendarPlus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useI18n } from '@/contexts/I18nContext';
import { downloadCalendarFile, openWeddingCalendar } from '@/services/weddingCalendar';
import '@/components/Landing/styles/CoupleContactDialog.scss';
import './styles/AddToCalendarButton.scss';

type AddToCalendarButtonProps = {
  className?: string;
  tabIndex?: number;
};

/**
 * "Add to calendar": one tap asks "do you use another calendar?". No opens the phone's default calendar with the
 * event ready (nothing is downloaded); yes downloads the .ics so it can be added to whichever calendar the guest uses.
 */
export function AddToCalendarButton({ className = '', tabIndex }: AddToCalendarButtonProps) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={`obw-btn obw-btn--secondary add-to-calendar ${className}`.trim()}
        tabIndex={tabIndex}
        onClick={() => setOpen(true)}>
        <CalendarPlus size={16} aria-hidden />
        {t('calendar.add')}
      </button>
      <dialog
        ref={dialogRef}
        className="obw-card obw-card--dark couple-contact"
        aria-labelledby="calendar-dialog-title"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          // A click on the backdrop lands on the <dialog> itself.
          if (event.target === event.currentTarget) setOpen(false);
        }}>
        <button type="button" className="couple-contact__close" aria-label={t('common.cancel')} onClick={() => setOpen(false)}>
          <X size={16} aria-hidden />
        </button>
        <h2 id="calendar-dialog-title" className="obw-display obw-display--sm couple-contact__title">
          {t('calendar.chooseTitle')}
        </h2>
        <p className="obw-body couple-contact__text">{t('calendar.chooseText')}</p>
        <div className="couple-contact__options couple-contact__options--stack">
          <button
            type="button"
            className="obw-btn obw-btn--primary couple-contact__option"
            onClick={() => {
              setOpen(false);
              openWeddingCalendar(t, locale);
            }}>
            {t('calendar.defaultOption')}
          </button>
          <button
            type="button"
            className="obw-btn obw-btn--secondary couple-contact__option"
            onClick={() => {
              setOpen(false);
              downloadCalendarFile(locale);
            }}>
            {t('calendar.fileOption')}
          </button>
        </div>
      </dialog>
    </>
  );
}
