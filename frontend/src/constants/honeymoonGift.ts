/** Bank details for honeymoon contributions — update with your real coordinates. */
export const HONEYMOON_GIFT_BANK_DETAILS = {
  accountHolder: 'Ilaria e Davide',
  iban: 'IT00X0000000000000000000000',
  bic: 'XXXXITXX',
  paymentReference: 'Matrimonio Ilaria & Davide',
} as const;

/** Formats an IBAN string into readable groups for display. */
export function formatIbanForDisplay(iban: string): string {
  const normalized = iban.replace(/\s+/g, '').toUpperCase();
  return normalized.replace(/(.{4})/g, '$1 ').trim();
}
