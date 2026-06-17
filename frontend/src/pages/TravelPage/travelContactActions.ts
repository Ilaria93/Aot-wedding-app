import type { TranslateFn } from '@/i18n/translations';
import type { LogisticsContactItem } from '@/services/logisticsContactsApi';

import type { ContactAction } from '@/pages/TravelPage/types/TravelPage.types';

function buildWhatsappUrl(phone: string) {
  const normalized = phone.replace(/[^\d+]/g, '');
  return `https://wa.me/${normalized.replace(/^\+/, '')}`;
}

function normalizeExternalUrl(url: string) {
  if (/^(https?:\/\/|mailto:|tel:|whatsapp:)/i.test(url)) {
    return url;
  }
  return `https://${url}`;
}

/** Builds the action buttons shown on each travel contact card. */
export function buildContactActions(contact: LogisticsContactItem, t: TranslateFn): ContactAction[] {
  const actions: ContactAction[] = [];

  if (contact.phone) {
    actions.push({
      id: 'phone',
      label: t('contactActions.call'),
      url: `tel:${contact.phone}`,
      accentColor: 'var(--aot-military-green)',
    });
  }

  if (contact.whatsapp_phone) {
    actions.push({
      id: 'whatsapp',
      label: t('contactActions.whatsapp'),
      url: buildWhatsappUrl(contact.whatsapp_phone),
      accentColor: '#25D366',
    });
  }

  if (contact.email) {
    actions.push({
      id: 'email',
      label: t('contactActions.email'),
      url: `mailto:${contact.email}`,
      accentColor: 'var(--aot-bronze)',
    });
  }

  if (contact.website) {
    actions.push({
      id: 'website',
      label: t('contactActions.website'),
      url: normalizeExternalUrl(contact.website),
      accentColor: 'var(--aot-text-primary)',
    });
  }

  if (contact.instagram_url) {
    actions.push({
      id: 'instagram',
      label: t('contactActions.instagram'),
      url: normalizeExternalUrl(contact.instagram_url),
      accentColor: '#E4405F',
    });
  }

  if (contact.facebook_url) {
    actions.push({
      id: 'facebook',
      label: t('contactActions.facebook'),
      url: normalizeExternalUrl(contact.facebook_url),
      accentColor: '#1877F2',
    });
  }

  if (contact.tiktok_url) {
    actions.push({
      id: 'tiktok',
      label: t('contactActions.tiktok'),
      url: normalizeExternalUrl(contact.tiktok_url),
      accentColor: '#111111',
    });
  }

  return actions;
}
