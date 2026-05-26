import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import {
  AppLocale,
  defaultLocale,
  localeLabels,
  supportedLocales,
  translations,
  TranslationKey,
  TranslationValues,
} from '@/i18n/translations';
import { persistLanguage, readStoredLanguage } from '@/services/languageStorage';

type I18nContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => Promise<void>;
  t: (key: TranslationKey, values?: TranslationValues) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);
let activeLocale: AppLocale = defaultLocale;

function isSupportedLocale(value: string | null | undefined): value is AppLocale {
  return supportedLocales.includes(value as AppLocale);
}

function normalizeLocale(value: string | null | undefined): AppLocale {
  if (!value) {
    return defaultLocale;
  }

  const languageCode = value.toLowerCase().split(/[-_]/)[0];
  return isSupportedLocale(languageCode) ? languageCode : defaultLocale;
}

function detectDeviceLocale() {
  try {
    return normalizeLocale(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    return defaultLocale;
  }
}

function getTranslationTemplate(locale: AppLocale, key: TranslationKey) {
  const pathSegments = key.split('.');
  let currentValue: unknown = translations[locale];

  for (const segment of pathSegments) {
    if (!currentValue || typeof currentValue !== 'object' || !(segment in currentValue)) {
      return null;
    }

    currentValue = (currentValue as Record<string, unknown>)[segment];
  }

  return typeof currentValue === 'string' ? currentValue : null;
}

function interpolate(template: string, values?: TranslationValues) {
  if (!values) {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = values[key];
    return value === undefined ? '' : String(value);
  });
}

export function translate(key: TranslationKey, values?: TranslationValues) {
  const template =
    getTranslationTemplate(activeLocale, key) || getTranslationTemplate(defaultLocale, key) || key;
  return interpolate(template, values);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(defaultLocale);

  useEffect(() => {
    async function bootstrapLocale() {
      const storedLocale = await readStoredLanguage();
      const resolvedLocale = storedLocale ? normalizeLocale(storedLocale) : detectDeviceLocale();
      activeLocale = resolvedLocale;
      setLocaleState(resolvedLocale);
    }

    bootstrapLocale();
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  async function setLocale(nextLocale: AppLocale) {
    const normalizedLocale = normalizeLocale(nextLocale);
    activeLocale = normalizedLocale;
    setLocaleState(normalizedLocale);
    await persistLanguage(normalizedLocale);
  }

  const contextValue = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, values) => translate(key, values),
    }),
    [locale],
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider.');
  }

  return context;
}

export function getLocaleLabel(locale: AppLocale) {
  return localeLabels[locale];
}
