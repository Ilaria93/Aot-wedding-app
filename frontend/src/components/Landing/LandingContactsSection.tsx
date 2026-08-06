import { Leaf, Star } from 'lucide-react';

import { useI18n } from '@/contexts/I18nContext';

/** Landing contacts grid with team, travel and ceremony info. */
export function LandingContactsSection() {
  const { t } = useI18n();

  return (
    <section className="obw-section obw-fade-up" id="contacts">
      <div className="obw-container">
        <div className="obw-section-header">
          <h2 className="obw-display obw-display--sm">{t('landing.contacts.title')}</h2>
          <div className="obw-tag-row obw-tag-row--end" aria-hidden>
            <span className="obw-tag obw-tag--on-paper">
              <Leaf size={14} />
            </span>
            <span className="obw-tag obw-tag--on-paper">
              <Star size={14} />
            </span>
          </div>
        </div>
        <div className="obw-grid-3">
          <article className="obw-card obw-card--interactive">
            <p className="obw-kicker">{t('landing.contacts.teamTitle')}</p>
            <p className="obw-meta">{t('landing.contacts.teamLine')}</p>
            <p className="obw-body">{t('landing.contacts.teamBody')}</p>
          </article>
          <article className="obw-card obw-card--interactive">
            <p className="obw-kicker">{t('landing.contacts.travelTitle')}</p>
            <p className="obw-meta">{t('landing.contacts.travelLine')}</p>
            <p className="obw-body">{t('landing.contacts.travelBody')}</p>
          </article>
          <article className="obw-card obw-card--interactive">
            <p className="obw-kicker">{t('landing.contacts.ceremonyTitle')}</p>
            <p className="obw-meta">{t('landing.contacts.ceremonyLine')}</p>
            <p className="obw-body">{t('landing.contacts.ceremonyBody')}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
