/** Copies text to the clipboard when the browser supports it. */
export async function copyToClipboard(value: string): Promise<boolean> {
  if (typeof navigator?.clipboard?.writeText !== 'function') {
    return false;
  }

  await navigator.clipboard.writeText(value);
  return true;
}
