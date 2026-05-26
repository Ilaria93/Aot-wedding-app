import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import type { AppLocale } from '@/i18n/translations';

const LANGUAGE_STORAGE_KEY = 'aot-wedding-language';

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

// Persists the selected app language on web and native.
export async function persistLanguage(locale: AppLocale): Promise<void> {
  if (Platform.OS === 'web' && canUseLocalStorage()) {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
    return;
  }

  await SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, locale);
}

// Reads the previously selected language, if available.
export async function readStoredLanguage(): Promise<AppLocale | null> {
  const storedLocale =
    Platform.OS === 'web' && canUseLocalStorage()
      ? window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
      : await SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY);

  if (!storedLocale) {
    return null;
  }

  return storedLocale as AppLocale;
}
