import { Platform } from 'react-native';

/** Copies text to the clipboard when the platform supports it. */
export async function copyToClipboard(value: string): Promise<boolean> {
  if (Platform.OS === 'web' && typeof navigator?.clipboard?.writeText === 'function') {
    await navigator.clipboard.writeText(value);
    return true;
  }

  return false;
}
