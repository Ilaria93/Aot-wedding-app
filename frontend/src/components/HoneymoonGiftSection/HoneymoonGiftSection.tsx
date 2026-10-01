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
      <div className="obw-container gift">
        <header className="gift__head">
          <p className="obw-kicker">{t('landing.gift.eyebrow')}</p>
          <h2 className="obw-display obw-display--lg">{t('landing.gift.title')}</h2>
          <span className="obw-rule obw-rule--center" aria-hidden="true" />
        </header>

        {/* One card: the message on top, the bank coordinates underneath. */}
        <div className="obw-card obw-card--dark landing-box gift__card">
          <div className="gift__message">
            <p className="obw-body">{t('landing.gift.intro')}</p>
            <p className="obw-body obw-body--flush">{t('landing.gift.gratitude')}</p>
            <div className="obw-tag-row gift__tags">
              <span className="obw-tag obw-tag--on-paper">
                <Plane size={14} aria-hidden />
                {t('landing.gift.eyebrow')}
              </span>
              <span className="obw-tag obw-tag--on-paper">
                <Heart size={14} aria-hidden />
              </span>
            </div>
          </div>

          <div className="gift__coordinates">
            <p className="obw-kicker obw-kicker--light gift__coordinates-title">{t('landing.gift.coordinatesTitle')}</p>
            <div className="gift__rows">
              <BankDetailRow
                label={t('landing.gift.accountHolder')}
                value={HONEYMOON_GIFT_BANK_DETAILS.accountHolder}
              />
              <BankDetailRow
                label={t('landing.gift.reference')}
                value={HONEYMOON_GIFT_BANK_DETAILS.paymentReference}
              />
              <BankDetailRow label={t('landing.gift.iban')} value={formattedIban} monospace />
              <BankDetailRow label={t('landing.gift.bic')} value={HONEYMOON_GIFT_BANK_DETAILS.bic} monospace />
            </div>
            <button type="button" className="obw-btn obw-btn--secondary gift__copy" onClick={() => void handleCopyIban()}>
              <Copy size={14} aria-hidden />
              {ibanCopied ? t('landing.gift.copiedIban') : t('landing.gift.copyIban')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
