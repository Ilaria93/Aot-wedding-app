/** Bank details for honeymoon contributions — update with your real coordinates. */
export const HONEYMOON_GIFT_BANK_DETAILS = {
  accountHolder: 'Davide Voza, Ilaria Pascucci',
  iban: 'IT46F0311510801000000014234',
  bic: 'FIDMIT3FXXX',
} as const;

/** Formats an IBAN string into readable groups for display. */
export function formatIbanForDisplay(iban: string): string {
  const normalized = iban.replace(/\s+/g, '').toUpperCase();
  return normalized.replace(/(.{4})/g, '$1 ').trim();
}
