import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Phone } from 'lucide-react';

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
  return contacts.reduce<Record<LogisticsContactCategory, LogisticsContactItem[]>>(
    (accumulator, contact) => {
      accumulator[contact.category].push(contact);
      return accumulator;
    },
    {
      hair: [],
      makeup: [],
      laundry: [],
      hotel: [],
      transfer: [],
      car_rental: [],
    },
  );
}

function normalizeExternalUrl(url: string) {
  if (/^(https?:\/\/|mailto:|tel:|whatsapp:)/i.test(url)) {
    return url;
  }
  return `https://${url}`;
}

/** Travel hub with public logistics contacts grouped by category. */
export function TravelPage() {
  const { t } = useI18n();
  const [contacts, setContacts] = useState<LogisticsContactItem[]>([]);
  const [loading, setLoading] = useState(true);
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
    }
  }, [t]);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  const groupedContacts = useMemo(() => buildGroupedContacts(contacts), [contacts]);

  if (loading) {
    return <div className="loading-screen">…</div>;
  }

  return (
    <div className="page-shell">
      <div className="card" style={{ maxWidth: 'none', marginBottom: 20 }}>
        <p className="eyebrow">{t('travel.eyebrow')}</p>
        <h1 className="title">{t('travel.title')}</h1>
        <p className="subtitle">{t('travel.subtitle')}</p>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      {LOGISTICS_CONTACT_CATEGORY_IDS.map((categoryId) => {
        const categoryContacts = groupedContacts[categoryId];
        if (categoryContacts.length === 0) {
          return null;
        }

        return (
          <section key={categoryId} className="landing-section">
            <h2 className="section-heading">{getLogisticsContactCategoryLabel(categoryId, t)}</h2>
            <div className="dev-grid">
              {categoryContacts.map((contact) => (
                <article key={contact.id} className="dev-card">
                  <h3 style={{ marginTop: 0 }}>{contact.label}</h3>
                  {contact.notes ? <p className="helper-text">{contact.notes}</p> : null}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                    {contact.phone ? (
                      <a className="button button-secondary" href={`tel:${contact.phone}`}>
                        <Phone size={14} />
                        {t('contactActions.call')}
                      </a>
                    ) : null}
                    {contact.website ? (
                      <a
                        className="button button-secondary"
                        href={normalizeExternalUrl(contact.website)}
                        target="_blank"
                        rel="noreferrer">
                        <ExternalLink size={14} />
                        {t('contactActions.website')}
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
