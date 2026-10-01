import { Leaf, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ContactCard } from '@/components/ContactCard';
import { getLogisticsContactCategoryLabel, LOGISTICS_CONTACT_CATEGORY_IDS } from '@/constants/logistics';
import { useI18n } from '@/contexts/I18nContext';
import { fetchPublicLogisticsContacts, type LogisticsContactItem } from '@/services/logisticsContactsApi';

type ContactsState = { status: 'loading' } | { status: 'empty' } | { status: 'ready'; contacts: LogisticsContactItem[] };

/** Contacts the couple manages in admin (public, active ones), in category order. */
function sortByCategory(contacts: LogisticsContactItem[]) {
  return [...contacts].sort(
    (a, b) => LOGISTICS_CONTACT_CATEGORY_IDS.indexOf(a.category) - LOGISTICS_CONTACT_CATEGORY_IDS.indexOf(b.category),
  );
}

/** Landing "Contatti utili": the logistics contacts added by the couple in admin. */
export function LandingContactsSection() {
  const { t } = useI18n();
  const [state, setState] = useState<ContactsState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    fetchPublicLogisticsContacts()
      .then((contacts) => {
        if (active) setState(contacts.length ? { status: 'ready', contacts: sortByCategory(contacts) } : { status: 'empty' });
      })
      // A failed load reads the same as "nothing yet" here: the travel page has the retry.
      .catch(() => {
        if (active) setState({ status: 'empty' });
      });
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

        {state.status === 'ready' ? (
          <div className="obw-grid-3 landing-contacts__grid">
            {state.contacts.map((contact) => (
              <div key={contact.id} className="obw-card obw-card--dark">
                <ContactCard contact={contact} kicker={getLogisticsContactCategoryLabel(contact.category, t)} />
              </div>
            ))}
          </div>
        ) : null}

        {state.status === 'empty' ? (
          <div className="obw-card obw-card--dark landing-box">
            <p className="obw-body obw-body--flush">{t('landing.contacts.empty')}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
