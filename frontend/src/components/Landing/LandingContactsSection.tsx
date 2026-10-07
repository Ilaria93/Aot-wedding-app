import { useEffect, useState } from 'react';

import { ContactCard } from '@/components/ContactCard';
import { getLogisticsContactCategoryLabel, LOGISTICS_CONTACT_CATEGORY_IDS } from '@/constants/logistics';
import { CoupleContactDialog, type CoupleContactMode } from '@/components/Landing/CoupleContactDialog';
import { WEDDING_COUPLE_CONTACT, WEDDING_COUPLE_PEOPLE, WEDDING_LODGING, WEDDING_LODGING_HOTEL } from '@/constants/weddingEvent';
import { useI18n } from '@/contexts/I18nContext';
import { fetchPublicLogisticsContacts, type LogisticsContactItem } from '@/services/logisticsContactsApi';

import './styles/LandingContactsSection.scss';

/** Contacts the couple manages in admin (public, active ones), in category order. */
function sortByCategory(contacts: LogisticsContactItem[]) {
  return [...contacts].sort(
    (a, b) => LOGISTICS_CONTACT_CATEGORY_IDS.indexOf(a.category) - LOGISTICS_CONTACT_CATEGORY_IDS.indexOf(b.category),
  );
}

// Any phone makes the card grow Call/WhatsApp; their clicks open the "who?" dialog.
const coupleContact = WEDDING_COUPLE_PEOPLE.every((person) => person.phone)
  ? { ...WEDDING_COUPLE_CONTACT, phone: WEDDING_COUPLE_PEOPLE[0].phone }
  : WEDDING_COUPLE_CONTACT;

/** Landing "Contatti utili": the couple first, then the logistics contacts they add in admin. */
export function LandingContactsSection() {
  const { t } = useI18n();
  const [contacts, setContacts] = useState<LogisticsContactItem[]>([]);
  const [coupleMode, setCoupleMode] = useState<CoupleContactMode | null>(null);

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
        <header className="landing-contacts__head">
          <h2 className="obw-display obw-display--lg">{t('landing.contacts.title')}</h2>
          <span className="obw-rule obw-rule--center" aria-hidden="true" />
        </header>

        <div className="landing-contacts__grid">
          {/* The couple always leads, whatever the admin list holds. */}
          <div className="obw-card obw-card--dark">
            <ContactCard
              contact={coupleContact}
              kicker={t('landing.contacts.coupleKicker')}
              interceptedActions={['phone', 'whatsapp']}
              onInterceptedAction={(id) => setCoupleMode(id as CoupleContactMode)}
            />
          </div>
          <div className="obw-card obw-card--dark">
            <ContactCard contact={WEDDING_LODGING} kicker={t('landing.contacts.lodgingKicker')} />
          </div>
          <div className="obw-card obw-card--dark">
            <ContactCard contact={WEDDING_LODGING_HOTEL} kicker={t('landing.contacts.lodgingHotelKicker')} />
          </div>
          {contacts.map((contact) => (
            <div key={contact.id} className="obw-card obw-card--dark">
              <ContactCard contact={contact} kicker={getLogisticsContactCategoryLabel(contact.category, t)} />
            </div>
          ))}
        </div>
      </div>
      <CoupleContactDialog mode={coupleMode} onClose={() => setCoupleMode(null)} />
    </section>
  );
}
