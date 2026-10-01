import { useCallback, useEffect, useMemo, useState } from 'react';

import { ContactCard } from '@/components/ContactCard';
import { PageAlert, PageHero, PageShell } from '@/components/PageShell';
import {
  getLogisticsContactCategoryLabel,
  LOGISTICS_CONTACT_CATEGORY_IDS,
} from '@/constants/logistics';
import { useI18n } from '@/contexts/I18nContext';
import {
  fetchPublicLogisticsContacts,
  type LogisticsContactCategory,
  type LogisticsContactItem,
} from '@/services/logisticsContactsApi';

function buildGroupedContacts(contacts: LogisticsContactItem[]) {
  const empty = {} as Record<LogisticsContactCategory, LogisticsContactItem[]>;
  for (const categoryId of LOGISTICS_CONTACT_CATEGORY_IDS) {
    empty[categoryId] = [];
  }

  return contacts.reduce((accumulator, contact) => {
    accumulator[contact.category].push(contact);
    return accumulator;
  }, empty);
}

/** Travel hub with public logistics contacts grouped by category. */
export function TravelPage() {
  const { t } = useI18n();
  const [contacts, setContacts] = useState<LogisticsContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContacts = useCallback(async () => {
    try {
      setError(null);
      const response = await fetchPublicLogisticsContacts();
      setContacts(response);
    } catch {
      setError(t('travel.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  const groupedContacts = useMemo(() => buildGroupedContacts(contacts), [contacts]);

  return (
    <PageShell loading={loading}>
      <PageHero eyebrow={t('travel.eyebrow')} title={t('travel.title')} subtitle={t('travel.subtitle')}>
        <button
          type="button"
          className="obw-btn obw-btn--secondary"
          disabled={refreshing}
          onClick={() => {
            setRefreshing(true);
            void loadContacts();
          }}>
          {refreshing ? t('travel.refreshLoading') : t('travel.refreshButton')}
        </button>
      </PageHero>

      {error ? <PageAlert message={error} /> : null}

      {contacts.length === 0 ? (
        <div className="obw-card">
          <h2 className="obw-display obw-display--sm">{t('travel.emptyTitle')}</h2>
          <p className="obw-body obw-body--flush">{t('travel.emptyBody')}</p>
        </div>
      ) : (
        LOGISTICS_CONTACT_CATEGORY_IDS.filter(
          (categoryId) => groupedContacts[categoryId].length > 0,
        ).map((categoryId) => (
          <section key={categoryId} className="obw-card">
            <h2 className="obw-display obw-display--sm">{getLogisticsContactCategoryLabel(categoryId, t)}</h2>
            {groupedContacts[categoryId].map((contact) => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </section>
        ))
      )}
    </PageShell>
  );
}
