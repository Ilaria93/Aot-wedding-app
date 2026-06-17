import { Copy, Heart, Plane } from 'lucide-react';
import { useState } from 'react';

import {
  formatIbanForDisplay,
  HONEYMOON_GIFT_BANK_DETAILS,
} from '@/constants/honeymoonGift';
import { useI18n } from '@/contexts/I18nContext';
import { copyToClipboard } from '@/utils/copyToClipboard';

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
    <section className="gift-section landing-section" id="gift">
      <div className="gift-section__header">
        <div>
          <p className="eyebrow">{t('landing.gift.eyebrow')}</p>
          <h2 className="section-heading">{t('landing.gift.title')}</h2>
          <p className="subtitle">{t('landing.gift.intro')}</p>
          <p className="helper-text">{t('landing.gift.gratitude')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--aot-bronze)' }}>
          <Plane size={22} />
          <Heart size={18} color="var(--aot-military-green)" />
        </div>
      </div>

      <div className="gift-coordinates">
        <h3 style={{ margin: '0 0 8px' }}>{t('landing.gift.coordinatesTitle')}</h3>
        <div className="gift-row">
          <span>{t('landing.gift.accountHolder')}</span>
          <strong>{HONEYMOON_GIFT_BANK_DETAILS.accountHolder}</strong>
        </div>
        <div className="gift-row">
          <span>{t('landing.gift.iban')}</span>
          <strong>{formattedIban}</strong>
        </div>
        <div className="gift-row">
          <span>{t('landing.gift.bic')}</span>
          <strong>{HONEYMOON_GIFT_BANK_DETAILS.bic}</strong>
        </div>
        <div className="gift-row">
          <span>{t('landing.gift.reference')}</span>
          <strong>{HONEYMOON_GIFT_BANK_DETAILS.paymentReference}</strong>
        </div>
        <button type="button" className="button button-secondary" onClick={() => void handleCopyIban()}>
          <Copy size={14} />
          {ibanCopied ? t('landing.gift.copiedIban') : t('landing.gift.copyIban')}
        </button>
      </div>
    </section>
  );
}
