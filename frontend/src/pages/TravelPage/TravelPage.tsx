import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Facebook, Globe, Instagram, Mail, MessageCircle, Phone } from 'lucide-react';

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
import { buildContactActions } from '@/pages/TravelPage/travelContactActions';
import './styles/TravelPage.scss';

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

const ACTION_ICONS = {
  phone: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  website: Globe,
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Globe,
} as const;

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
          className="button button-secondary"
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
        <div className="section-card">
          <h2 className="section-title">{t('travel.emptyTitle')}</h2>
          <p className="empty-text">{t('travel.emptyBody')}</p>
        </div>
      ) : (
        LOGISTICS_CONTACT_CATEGORY_IDS.filter(
          (categoryId) => groupedContacts[categoryId].length > 0,
        ).map((categoryId) => (
          <section key={categoryId} className="section-card">
            <h2 className="section-title">{getLogisticsContactCategoryLabel(categoryId, t)}</h2>
            {groupedContacts[categoryId].map((contact) => {
              const contactActions = buildContactActions(contact, t);

              return (
                <article key={contact.id} className="contact-card">
                  <p className="contact-card__label">{contact.label}</p>
                  {contact.contact_person ? (
                    <p className="contact-card__meta">
                      {t('travel.contactPerson', { value: contact.contact_person })}
                    </p>
                  ) : null}
                  {contact.address ? <p className="contact-card__meta">{contact.address}</p> : null}
                  {contact.notes ? <p className="contact-card__notes">{contact.notes}</p> : null}

                  {contactActions.length > 0 ? (
                    <div className="actions-row">
                      {contactActions.map((action) => {
                        const Icon = ACTION_ICONS[action.id as keyof typeof ACTION_ICONS] ?? Globe;
                        return (
                          <a
                            key={action.id}
                            className="action-button"
                            href={action.url}
                            target="_blank"
                            rel="noreferrer">
                            <span
                              className="action-button__badge"
                              style={{ '--action-accent': action.accentColor } as CSSProperties}>
                              <Icon size={14} aria-hidden />
                            </span>
                            {action.label}
                          </a>
                        );
                      })}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>
        ))
      )}
    </PageShell>
  );
}
