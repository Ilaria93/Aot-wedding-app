import type { AppLocale } from '@/i18n/translations';

const LANGUAGE_STORAGE_KEY = 'aot-wedding-language';

/** Persists the selected app language in localStorage. */
export async function persistLanguage(locale: AppLocale): Promise<void> {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
}

/** Reads the previously selected language, if available. */
export async function readStoredLanguage(): Promise<AppLocale | null> {
  const storedLocale = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return storedLocale ? (storedLocale as AppLocale) : null;
}
