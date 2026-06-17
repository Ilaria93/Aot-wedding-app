import { Copy, Heart, Plane } from 'lucide-react';
import { useState } from 'react';

import {
  formatIbanForDisplay,
  HONEYMOON_GIFT_BANK_DETAILS,
} from '@/constants/honeymoonGift';
import { useI18n } from '@/contexts/I18nContext';
import { copyToClipboard } from '@/components/HoneymoonGiftSection/copyToClipboard';
import './styles/HoneymoonGiftSection.scss';

type BankDetailRowProps = {
  label: string;
  value: string;
  monospace?: boolean;
};

/** Single labeled row inside the bank coordinates card. */
function BankDetailRow({ label, value, monospace = false }: BankDetailRowProps) {
  return (
    <div className="gift-row">
      <span>{label}</span>
      <strong className={monospace ? 'gift-row__mono' : undefined}>{value}</strong>
    </div>
  );
}

/** Landing section with honeymoon gift message and bank transfer coordinates. */
export function HoneymoonGiftSection() {
  const { t } = useI18n();
  const [ibanCopied, setIbanCopied] = useState(false);
  const formattedIban = formatIbanForDisplay(HONEYMOON_GIFT_BANK_DETAILS.iban);

  async function handleCopyIban() {
    const copied = await copyToClipboard(HONEYMOON_GIFT_BANK_DETAILS.iban.replace(/\s+/g, ''));
    if (!copied) {
      return;
    }
    setIbanCopied(true);
    window.setTimeout(() => setIbanCopied(false), 2200);
  }

  return (
    <section className="gift-section" id="gift">
      <div className="gift-section__header">
        <div className="gift-section__copy">
          <p className="gift-section__eyebrow">{t('landing.gift.eyebrow')}</p>
          <h2 className="gift-section__title">{t('landing.gift.title')}</h2>
          <p className="gift-section__intro">{t('landing.gift.intro')}</p>
          <p className="gift-section__gratitude">{t('landing.gift.gratitude')}</p>
        </div>
        <div className="gift-section__emblem" aria-hidden>
          <Plane size={22} color="var(--aot-bronze)" />
          <Heart size={18} color="var(--aot-military-green)" />
        </div>
      </div>

      <div className="gift-coordinates">
        <h3 className="gift-coordinates__title">{t('landing.gift.coordinatesTitle')}</h3>
        <BankDetailRow
          label={t('landing.gift.accountHolder')}
          value={HONEYMOON_GIFT_BANK_DETAILS.accountHolder}
        />
        <BankDetailRow label={t('landing.gift.iban')} value={formattedIban} monospace />
        <BankDetailRow label={t('landing.gift.bic')} value={HONEYMOON_GIFT_BANK_DETAILS.bic} monospace />
        <BankDetailRow
          label={t('landing.gift.reference')}
          value={HONEYMOON_GIFT_BANK_DETAILS.paymentReference}
        />
        <button type="button" className="gift-copy-button" onClick={() => void handleCopyIban()}>
          <Copy size={14} aria-hidden />
          {ibanCopied ? t('landing.gift.copiedIban') : t('landing.gift.copyIban')}
        </button>
      </div>
    </section>
  );
}
