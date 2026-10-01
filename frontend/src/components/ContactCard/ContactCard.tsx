import type { CSSProperties } from 'react';
import { Facebook, Globe, Instagram, Mail, MessageCircle, Phone } from 'lucide-react';

import { useI18n } from '@/contexts/I18nContext';
import { buildContactActions, type ContactCardData } from '@/components/ContactCard/contactActions';
import './styles/ContactCard.scss';

const ACTION_ICONS = {
  phone: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  website: Globe,
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Globe,
} as const;

type ContactCardProps = {
  contact: ContactCardData;
  /** Optional line above the name, e.g. the category on the home page. */
  kicker?: string;
  className?: string;
  /** Takes over these buttons' clicks (the couple's Call/WhatsApp ask "who?" first). */
  interceptedActions?: string[];
  onInterceptedAction?: (actionId: string) => void;
};

/** One logistics contact: name, person, address, notes and call/chat/social buttons. */
export function ContactCard({
  contact,
  kicker,
  className = '',
  interceptedActions = [],
  onInterceptedAction,
}: ContactCardProps) {
  const { t } = useI18n();
  const contactActions = buildContactActions(contact, t);

  return (
    <article className={`contact-card ${className}`.trim()}>
      {kicker ? <p className="obw-kicker contact-card__kicker">{kicker}</p> : null}
      <p className="contact-card__label">{contact.label}</p>
      {contact.contact_person ? (
        <p className="contact-card__meta">{t('travel.contactPerson', { value: contact.contact_person })}</p>
      ) : null}
      {contact.address ? <p className="contact-card__meta">{contact.address}</p> : null}
      {contact.notes ? <p className="contact-card__notes">{contact.notes}</p> : null}

      {contactActions.length > 0 ? (
        <div className="actions-row">
          {contactActions.map((action) => {
            const Icon = ACTION_ICONS[action.id as keyof typeof ACTION_ICONS] ?? Globe;
            return (
              <a
                key={action.id}
                className="action-button"
                href={action.url}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => {
                  if (!interceptedActions.includes(action.id)) return;
                  event.preventDefault();
                  onInterceptedAction?.(action.id);
                }}>
                <span className="action-button__badge" style={{ '--action-accent': action.accentColor } as CSSProperties}>
                  <Icon size={14} aria-hidden />
                </span>
                {action.label}
              </a>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}
