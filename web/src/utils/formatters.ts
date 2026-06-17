import type { AppLocale } from '@/i18n/translations';

const localeMap: Record<AppLocale, string> = {
  it: 'it-IT',
  en: 'en-GB',
  fr: 'fr-FR',
  de: 'de-DE',
};

export function formatDateByLocale(
  value: string | null | undefined,
  locale: AppLocale,
  options?: Intl.DateTimeFormatOptions,
) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(localeMap[locale], options).format(new Date(value));
}
