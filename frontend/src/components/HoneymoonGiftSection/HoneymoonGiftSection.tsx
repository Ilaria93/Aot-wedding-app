import { Copy, Heart, Plane } from 'lucide-react';
import { useState } from 'react';

import {
  formatIbanForDisplay,
  HONEYMOON_GIFT_BANK_DETAILS,
} from '@/constants/honeymoonGift';
import { useI18n } from '@/contexts/I18nContext';
import { copyToClipboard } from '@/components/HoneymoonGiftSection/copyToClipboard';

type BankDetailRowProps = {
  label: string;
  value: string;
  monospace?: boolean;
};

/** Single labeled row inside the bank coordinates card. */
function BankDetailRow({ label, value, monospace = false }: BankDetailRowProps) {
  return (
    <div className="obw-gift-row">
      <span>{label}</span>
      <strong className={monospace ? 'obw-gift-row__mono' : undefined}>{value}</strong>
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
    <section className="obw-section obw-fade-up" id="gift">
      <div className="obw-container obw-gift-layout">
        <div>
          <p className="obw-kicker">{t('landing.gift.eyebrow')}</p>
          <h2 className="obw-display">{t('landing.gift.title')}</h2>
          <div className="obw-rule" aria-hidden="true" />
          <p className="obw-body">{t('landing.gift.intro')}</p>
          <p className="obw-body">{t('landing.gift.gratitude')}</p>
          <div className="obw-tag-row obw-tag-row--start">
            <span className="obw-tag obw-tag--on-paper">
              <Plane size={14} aria-hidden />
              {t('landing.gift.eyebrow')}
            </span>
            <span className="obw-tag obw-tag--on-paper">
              <Heart size={14} aria-hidden />
            </span>
          </div>
        </div>

        <div className="obw-card obw-card--dark">
          <p className="obw-kicker obw-kicker--light">{t('landing.gift.coordinatesTitle')}</p>
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
          <button type="button" className="obw-btn obw-btn--secondary" onClick={() => void handleCopyIban()}>
            <Copy size={14} aria-hidden />
            {ibanCopied ? t('landing.gift.copiedIban') : t('landing.gift.copyIban')}
          </button>
        </div>
      </div>
    </section>
  );
}
