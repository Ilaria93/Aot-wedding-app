import { useLocation } from 'react-router-dom';

import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/i18n/translations';

export type AdminHeroContent = {
  eyebrowSegments: string[];
  code?: string;
  titleLead: string;
  titleHighlight?: string;
  subtitle: string;
};

type AdminHeroKeys = {
  eyebrowSegments: TranslationKey[];
  code?: TranslationKey;
  titleLead: TranslationKey;
  titleHighlight?: TranslationKey;
  subtitle: TranslationKey;
};

const DEFAULT_HERO: AdminHeroKeys = {
  eyebrowSegments: ['landing.hero.operationTag', 'common.roles.admin'],
  titleLead: 'admin.hero.title',
  subtitle: 'admin.hero.subtitle',
};

// Per-route hero overrides — add a route here when it needs its own copy.
const ROUTE_HERO: Record<string, AdminHeroKeys> = {
  '/admin/rsvp': {
    eyebrowSegments: ['landing.hero.operationTag', 'common.roles.admin', 'navigation.stack.rsvp'],
    code: 'admin.hero.rsvpCode',
    titleLead: 'admin.hero.rsvpTitleLead',
    titleHighlight: 'admin.hero.rsvpTitleHighlight',
    subtitle: 'admin.hero.rsvpSubtitle',
  },
  '/admin/contacts': {
    eyebrowSegments: ['landing.hero.operationTag', 'common.roles.admin'],
    code: 'admin.hero.contactsCode',
    titleLead: 'admin.hero.contactsTitleLead',
    titleHighlight: 'admin.hero.contactsTitleHighlight',
    subtitle: 'admin.hero.contactsSubtitle',
  },
  '/admin/gallery': {
    eyebrowSegments: [
      'landing.hero.operationTag',
      'common.roles.admin',
      'admin.hero.galleryEyebrowLiveCloud',
      'admin.hero.galleryEyebrowArchive',
    ],
    titleLead: 'admin.hero.galleryTitleLead',
    titleHighlight: 'admin.hero.galleryTitleHighlight',
    subtitle: 'admin.hero.gallerySubtitle',
  },
};

export function useAdminHeroContent(): AdminHeroContent {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const hero: AdminHeroKeys = ROUTE_HERO[pathname] ?? DEFAULT_HERO;

  return {
    eyebrowSegments: hero.eyebrowSegments.map((s) => t(s)),
    code: hero.code ? t(hero.code) : undefined,
    titleLead: t(hero.titleLead),
    titleHighlight: hero.titleHighlight ? t(hero.titleHighlight) : undefined,
    subtitle: t(hero.subtitle),
  };
}
