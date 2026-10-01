import { Leaf, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ContactCard } from '@/components/ContactCard';
import { getLogisticsContactCategoryLabel, LOGISTICS_CONTACT_CATEGORY_IDS } from '@/constants/logistics';
import { WEDDING_COUPLE_CONTACT } from '@/constants/weddingEvent';
import { useI18n } from '@/contexts/I18nContext';
import { fetchPublicLogisticsContacts, type LogisticsContactItem } from '@/services/logisticsContactsApi';

/** Contacts the couple manages in admin (public, active ones), in category order. */
function sortByCategory(contacts: LogisticsContactItem[]) {
  return [...contacts].sort(
    (a, b) => LOGISTICS_CONTACT_CATEGORY_IDS.indexOf(a.category) - LOGISTICS_CONTACT_CATEGORY_IDS.indexOf(b.category),
  );
}

/** Landing "Contatti utili": the couple first, then the logistics contacts they add in admin. */
export function LandingContactsSection() {
  const { t } = useI18n();
  const [contacts, setContacts] = useState<LogisticsContactItem[]>([]);

  useEffect(() => {
    let active = true;
    fetchPublicLogisticsContacts()
      .then((items) => {
        if (active) setContacts(sortByCategory(items));
      })
      // A failed load just leaves the couple's card on its own.
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="obw-section obw-fade-up" id="contacts">
      <div className="obw-container">
        <div className="obw-section-header">
          <h2 className="obw-display obw-display--lg">{t('landing.contacts.title')}</h2>
          <div className="obw-tag-row obw-tag-row--end" aria-hidden>
            <span className="obw-tag obw-tag--on-paper">
              <Leaf size={14} />
            </span>
            <span className="obw-tag obw-tag--on-paper">
              <Star size={14} />
            </span>
          </div>
        </div>

        <div className="obw-grid-3 landing-contacts__grid">
          {/* The couple always leads, whatever the admin list holds. */}
          <div className="obw-card obw-card--dark">
            <ContactCard contact={WEDDING_COUPLE_CONTACT} kicker={t('landing.contacts.coupleKicker')} />
          </div>
          {contacts.map((contact) => (
            <div key={contact.id} className="obw-card obw-card--dark">
              <ContactCard contact={contact} kicker={getLogisticsContactCategoryLabel(contact.category, t)} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
