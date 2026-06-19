import { Leaf, Star } from 'lucide-react';

import { useI18n } from '@/contexts/I18nContext';

/** Landing contacts grid with team, travel and ceremony info. */
export function LandingContactsSection() {
  const { t } = useI18n();

  return (
    <section className="landing-contacts">
      <div className="landing-contacts__header">
        <h2 className="landing-contacts__title">{t('landing.contacts.title')}</h2>
        <div className="landing-contacts__emblem" aria-hidden>
          <Leaf size={24} color="var(--aot-military-green-dark)" />
          <Star size={18} color="var(--aot-bronze)" />
        </div>
      </div>
      <div className="landing-contacts__grid">
        <article className="landing-contacts__card">
          <h3>{t('landing.contacts.teamTitle')}</h3>
          <p className="landing-contacts__line">{t('landing.contacts.teamLine')}</p>
          <p className="landing-contacts__muted">{t('landing.contacts.teamBody')}</p>
        </article>
        <article className="landing-contacts__card">
          <h3>{t('landing.contacts.travelTitle')}</h3>
          <p className="landing-contacts__line">{t('landing.contacts.travelLine')}</p>
          <p className="landing-contacts__muted">{t('landing.contacts.travelBody')}</p>
        </article>
        <article className="landing-contacts__card">
          <h3>{t('landing.contacts.ceremonyTitle')}</h3>
          <p className="landing-contacts__line">{t('landing.contacts.ceremonyLine')}</p>
          <p className="landing-contacts__muted">{t('landing.contacts.ceremonyBody')}</p>
        </article>
      </div>
    </section>
  );
}
