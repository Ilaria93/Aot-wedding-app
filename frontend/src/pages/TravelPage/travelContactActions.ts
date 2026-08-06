import type { TranslateFn } from '@/i18n/translations';
import type { LogisticsContactItem } from '@/services/logisticsContactsApi';

import type { ContactAction } from '@/pages/TravelPage/types/TravelPage.types';

// Official brand colors (not part of aotTheme — these identify third-party platforms).
const SOCIAL_BRAND_COLORS = {
  whatsapp: '#25D366',
  instagram: '#E4405F',
  facebook: '#1877F2',
  tiktok: 'var(--obw-void)',
} as const;

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
      accentColor: 'var(--obw-gold)',
    });
  }

  if (contact.whatsapp_phone) {
    actions.push({
      id: 'whatsapp',
      label: t('contactActions.whatsapp'),
      url: buildWhatsappUrl(contact.whatsapp_phone),
      accentColor: SOCIAL_BRAND_COLORS.whatsapp,
    });
  }

  if (contact.email) {
    actions.push({
      id: 'email',
      label: t('contactActions.email'),
      url: `mailto:${contact.email}`,
      accentColor: 'var(--obw-gold-dim)',
    });
  }

  if (contact.website) {
    actions.push({
      id: 'website',
      label: t('contactActions.website'),
      url: normalizeExternalUrl(contact.website),
      accentColor: 'var(--obw-charcoal)',
    });
  }

  if (contact.instagram_url) {
    actions.push({
      id: 'instagram',
      label: t('contactActions.instagram'),
      url: normalizeExternalUrl(contact.instagram_url),
      accentColor: SOCIAL_BRAND_COLORS.instagram,
    });
  }

  if (contact.facebook_url) {
    actions.push({
      id: 'facebook',
      label: t('contactActions.facebook'),
      url: normalizeExternalUrl(contact.facebook_url),
      accentColor: SOCIAL_BRAND_COLORS.facebook,
    });
  }

  if (contact.tiktok_url) {
    actions.push({
      id: 'tiktok',
      label: t('contactActions.tiktok'),
      url: normalizeExternalUrl(contact.tiktok_url),
      accentColor: SOCIAL_BRAND_COLORS.tiktok,
    });
  }

  return actions;
}
