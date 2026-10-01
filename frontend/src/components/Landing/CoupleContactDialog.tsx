import { MessageCircle, Phone, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { buildWhatsappUrl } from '@/components/ContactCard/contactActions';
import { WEDDING_COUPLE_PEOPLE } from '@/constants/weddingEvent';
import { useI18n } from '@/contexts/I18nContext';
import './styles/CoupleContactDialog.scss';

export type CoupleContactMode = 'phone' | 'whatsapp';

type CoupleContactDialogProps = {
  mode: CoupleContactMode | null;
  onClose: () => void;
};

/** "Who do you want to call / text?" for the couple's card: one button per spouse. */
export function CoupleContactDialog({ mode, onClose }: CoupleContactDialogProps) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (mode && !dialog.open) dialog.showModal();
    if (!mode && dialog.open) dialog.close();
  }, [mode]);

  const Icon = mode === 'whatsapp' ? MessageCircle : Phone;

  return (
    <dialog
      ref={dialogRef}
      className="obw-card obw-card--dark couple-contact"
      aria-labelledby="couple-contact-title"
      onClose={onClose}
      // A click on the backdrop lands on the <dialog> itself.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}>
      <button type="button" className="couple-contact__close" aria-label={t('common.cancel')} onClick={onClose}>
        <X size={16} aria-hidden />
      </button>
      <p className="obw-kicker">{t('landing.contacts.coupleKicker')}</p>
      <h2 id="couple-contact-title" className="obw-display obw-display--sm couple-contact__title">
        {mode === 'whatsapp' ? t('landing.contacts.whatsappWho') : t('landing.contacts.callWho')}
      </h2>
      <div className="couple-contact__options">
        {WEDDING_COUPLE_PEOPLE.map((person) => (
          <a
            key={person.name}
            className="obw-btn obw-btn--secondary couple-contact__option"
            href={mode === 'whatsapp' ? buildWhatsappUrl(person.phone) : `tel:${person.phone}`}
            target="_blank"
            rel="noreferrer"
            onClick={onClose}>
            <Icon size={16} aria-hidden />
            {person.name}
          </a>
        ))}
      </div>
    </dialog>
  );
}
