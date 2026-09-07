import { de } from '@/i18n/locales/de';
import { en } from '@/i18n/locales/en';
import { fr } from '@/i18n/locales/fr';
import { it } from '@/i18n/locales/it';

export const supportedLocales = ['it', 'en', 'fr', 'de'] as const;

export type AppLocale = (typeof supportedLocales)[number];

export const defaultLocale: AppLocale = 'it';

// fr/de content stays in the repo but isn't offered as a choice in the UI.
export const toggleableLocales = ['it', 'en'] as const;

export const localeLabels: Record<AppLocale, string> = {
  it: 'Italiano',
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
};

type DeepTranslateShape<T> = {
  [Key in keyof T]: T[Key] extends string
    ? string
    : T[Key] extends Record<string, unknown>
      ? DeepTranslateShape<T[Key]>
      : T[Key];
};

export type TranslationMessages = DeepTranslateShape<typeof it>;

export const translations: Record<AppLocale, TranslationMessages> = {
  it,
  en,
  fr,
  de,
};

type TranslationNode = (typeof translations)[typeof defaultLocale];

type JoinPath<Prefix extends string, Key extends string> = Prefix extends ''
  ? Key
  : `${Prefix}.${Key}`;

type NestedTranslationKey<T, Prefix extends string = ''> = {
  [Key in keyof T & string]: T[Key] extends string
    ? JoinPath<Prefix, Key>
    : T[Key] extends Record<string, unknown>
      ? NestedTranslationKey<T[Key], JoinPath<Prefix, Key>>
      : never;
}[keyof T & string];

export type TranslationKey = NestedTranslationKey<TranslationNode>;

export type TranslationValues = Record<string, string | number>;

export type TranslateFn = (key: TranslationKey, values?: TranslationValues) => string;
