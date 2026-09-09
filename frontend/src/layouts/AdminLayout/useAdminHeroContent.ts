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

// /admin/rsvp is the only section with its own hero copy so far — inline the
// one override until a second route needs one too.
export function useAdminHeroContent(): AdminHeroContent {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const hero: AdminHeroKeys =
    pathname === '/admin/rsvp'
      ? {
          eyebrowSegments: ['landing.hero.operationTag', 'common.roles.admin', 'navigation.stack.rsvp'],
          code: 'admin.hero.rsvpCode',
          titleLead: 'admin.hero.rsvpTitleLead',
          titleHighlight: 'admin.hero.rsvpTitleHighlight',
          subtitle: 'admin.hero.rsvpSubtitle',
        }
      : {
          eyebrowSegments: ['landing.hero.operationTag', 'common.roles.admin'],
          titleLead: 'admin.hero.title',
          subtitle: 'admin.hero.subtitle',
        };

  return {
    eyebrowSegments: hero.eyebrowSegments.map((s) => t(s)),
    code: hero.code ? t(hero.code) : undefined,
    titleLead: t(hero.titleLead),
    titleHighlight: hero.titleHighlight ? t(hero.titleHighlight) : undefined,
    subtitle: t(hero.subtitle),
  };
}
