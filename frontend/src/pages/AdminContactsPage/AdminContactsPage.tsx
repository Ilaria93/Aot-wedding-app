import { Clock, Eye, EyeOff, Globe, IdCard, Mail, Pencil, Phone, Save, Store, Trash2, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { PageAlert } from '@/components/PageShell';
import { FilterPills } from '@/components/FilterPills';
import { SearchBar } from '@/components/SearchBar';
import { StatCards, type StatCardData } from '@/components/StatCards';
import { LOGISTICS_CONTACT_CATEGORY_IDS, getLogisticsContactCategoryLabel } from '@/constants/logistics';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslateFn } from '@/i18n/translations';
import { useAdminHeroStatsSlot } from '@/layouts/AdminLayout/AdminHeroStatsSlotContext';
import { buildContactActions } from '@/pages/TravelPage/travelContactActions';
import { getApiErrorMessage } from '@/services/apiErrors';
import {
  createAdminLogisticsContact,
  deleteAdminLogisticsContact,
  fetchAdminLogisticsContacts,
  updateAdminLogisticsContact,
  type LogisticsContactCategory,
  type LogisticsContactItem,
  type LogisticsContactPayload,
} from '@/services/logisticsContactsApi';
import { SupplierCard, type SupplierCardInfoItem, type SupplierCardTone } from './SupplierCard';
import './styles/AdminContactsPage.scss';

// Card fields that vary with the booking rather than the form data itself.
function supplierStatus(contact: LogisticsContactItem, t: TranslateFn): { label: string; tone: SupplierCardTone } {
  return contact.is_active
    ? { label: t('admin.contacts.activeToggle'), tone: 'green' }
    : { label: t('admin.contacts.inactiveToggle'), tone: 'rose' };
}

function supplierRoleLabel(contact: LogisticsContactItem, t: TranslateFn): string {
  return contact.category === 'transfer'
    ? t('admin.contacts.supplierRoleTransfer')
    : t('admin.contacts.supplierRoleDefault');
}

function supplierInfoItems(contact: LogisticsContactItem): SupplierCardInfoItem[] {
  const items: SupplierCardInfoItem[] = [];
  if (contact.address) items.push({ icon: Clock, text: contact.address });
  if (contact.website) items.push({ icon: Globe, text: contact.website });
  else if (contact.email) items.push({ icon: Mail, text: contact.email });
  return items;
}

// Same card shape as AdminRsvpPage's buildStatCards — active/inactive out of
// the full supplier list.
function buildContactStatCards(contacts: LogisticsContactItem[], t: TranslateFn): StatCardData[] {
  const total = contacts.length;
  const percentOf = (value: number) => (total > 0 ? Math.round((value / total) * 100) : 0);
  const active = contacts.filter((contact) => contact.is_active).length;
  const inactive = total - active;

  return [
    {
      id: 'active',
      tone: 'gold',
      label: t('admin.contacts.statsActive'),
      value: active,
      subtitle: t('admin.contacts.statsActiveSubtitle', { percent: percentOf(active) }),
    },
    {
      id: 'inactive',
      tone: 'stone',
      label: t('admin.contacts.statsInactive'),
      value: inactive,
      subtitle: t('admin.contacts.statsInactiveSubtitle', { percent: percentOf(inactive) }),
    },
  ];
}

type ContactFormState = {
  category: LogisticsContactCategory;
  label: string;
  contact_person: string;
  phone: string;
  address: string;
  notes: string;
  is_active: boolean;
};

const EMPTY_FORM: ContactFormState = {
  category: 'location',
  label: '',
  contact_person: '',
  phone: '',
  address: '',
  notes: '',
  is_active: true,
};

function contactToFormState(contact: LogisticsContactItem): ContactFormState {
  return {
    category: contact.category,
    label: contact.label,
    contact_person: contact.contact_person ?? '',
    phone: contact.phone ?? '',
    address: contact.address ?? '',
    notes: contact.notes ?? '',
    is_active: contact.is_active,
  };
}

function formStateToPayload(form: ContactFormState): LogisticsContactPayload {
  return {
    category: form.category,
    label: form.label.trim(),
    contact_person: form.contact_person.trim() || undefined,
    phone: form.phone.trim() || undefined,
    address: form.address.trim() || undefined,
    notes: form.notes.trim() || undefined,
    is_active: form.is_active,
  };
}

/** Admin section — create, edit, hide and delete the logistics contacts guests see. */
export function AdminContactsPage() {
  const { t } = useI18n();
  const [contacts, setContacts] = useState<LogisticsContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | LogisticsContactCategory>('all');

  const [form, setForm] = useState<ContactFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadContacts = useCallback(async () => {
    try {
      setError(null);
      setContacts(await fetchAdminLogisticsContacts());
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, t('admin.errors.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  function updateField<K extends keyof ContactFormState>(field: K, value: ContactFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(contact: LogisticsContactItem) {
    setEditingId(contact.id);
    setForm(contactToFormState(contact));
    setFormError(null);
    setSuccessMessage(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.label.trim()) {
      setFormError(t('admin.errors.contactTitleRequired'));
      return;
    }

    setFormError(null);
    setSuccessMessage(null);
    try {
      setSubmitting(true);
      const payload = formStateToPayload(form);
      if (editingId) {
        await updateAdminLogisticsContact(editingId, payload);
        setSuccessMessage(t('admin.contacts.updatedMessage'));
      } else {
        await createAdminLogisticsContact(payload);
        setSuccessMessage(t('admin.contacts.createdMessage'));
      }
      cancelEdit();
      await loadContacts();
    } catch (caughtError) {
      setFormError(
        getApiErrorMessage(
          caughtError,
          t(editingId ? 'admin.errors.contactUpdateFailed' : 'admin.errors.contactSaveFailed'),
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(contact: LogisticsContactItem) {
    try {
      await updateAdminLogisticsContact(contact.id, { is_active: !contact.is_active });
      await loadContacts();
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, t('admin.errors.contactUpdateFailed')));
    }
  }

  async function handleDelete(contact: LogisticsContactItem) {
    if (!window.confirm(t('admin.contacts.confirmDelete'))) {
      return;
    }
    try {
      await deleteAdminLogisticsContact(contact.id);
      await loadContacts();
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, t('admin.errors.contactDeleteFailed')));
    }
  }

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return contacts.filter((contact) => {
      if (categoryFilter !== 'all' && contact.category !== categoryFilter) return false;
      if (!query) return true;
      return (
        contact.label.toLowerCase().includes(query) ||
        (contact.contact_person ?? '').toLowerCase().includes(query)
      );
    });
  }, [contacts, search, categoryFilter]);

  const statCards = useMemo(() => buildContactStatCards(contacts, t), [contacts, t]);
  const heroStatsSlot = useAdminHeroStatsSlot();

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="loading-text">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <>
      {heroStatsSlot ? createPortal(<StatCards cards={statCards} />, heroStatsSlot) : null}

      {error ? <PageAlert message={error} /> : null}

      <div className="admin-contacts__layout">
        <section className="obw-portal-card admin-contacts__form-card">
          <span className="admin-contacts__form-eyebrow">
            <UserPlus size={14} aria-hidden />
            {t('admin.contacts.formEyebrow')}
          </span>
          <h2 className="admin-contacts__form-title">
            {editingId ? t('admin.contacts.editTitle') : t('admin.contacts.newTitle')}
          </h2>
          <p className="admin-contacts__form-subtitle">{t('admin.contacts.description')}</p>
          <hr className="admin-contacts__form-divider" />

          <form className="admin-contacts__form" onSubmit={(event) => void handleSubmit(event)}>
            <label className="admin-contacts__field" htmlFor="contact-category">
              <span className="admin-contacts__field-label">{t('admin.contacts.categoryLabel')}</span>
              <select
                id="contact-category"
                value={form.category}
                onChange={(event) => updateField('category', event.target.value as LogisticsContactCategory)}>
                {LOGISTICS_CONTACT_CATEGORY_IDS.map((categoryId) => (
                  <option key={categoryId} value={categoryId}>
                    {getLogisticsContactCategoryLabel(categoryId, t)}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-contacts__field" htmlFor="contact-label">
              <span className="admin-contacts__field-label">{t('admin.contacts.fields.supplierName')}</span>
              <span className="admin-contacts__field-input">
                <input
                  id="contact-label"
                  placeholder={t('admin.contacts.placeholders.supplierName')}
                  value={form.label}
                  onChange={(event) => updateField('label', event.target.value)}
                />
                <Store size={16} aria-hidden />
              </span>
            </label>

            <div className="admin-contacts__field-row">
              <label className="admin-contacts__field" htmlFor="contact-person">
                <span className="admin-contacts__field-label">{t('admin.contacts.fields.contactPerson')}</span>
                <span className="admin-contacts__field-input">
                  <input
                    id="contact-person"
                    placeholder={t('admin.contacts.placeholders.contactPerson')}
                    value={form.contact_person}
                    onChange={(event) => updateField('contact_person', event.target.value)}
                  />
                  <IdCard size={16} aria-hidden />
                </span>
              </label>

              <label className="admin-contacts__field" htmlFor="contact-phone">
                <span className="admin-contacts__field-label">{t('admin.contacts.fields.phone')}</span>
                <span className="admin-contacts__field-input">
                  <input
                    id="contact-phone"
                    placeholder={t('admin.contacts.placeholders.phone')}
                    value={form.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                  />
                  <Phone size={16} aria-hidden />
                </span>
              </label>
            </div>

            <label className="admin-contacts__field" htmlFor="contact-address">
              <span className="admin-contacts__field-label">{t('admin.contacts.fields.arrival')}</span>
              <span className="admin-contacts__field-input">
                <input
                  id="contact-address"
                  placeholder={t('admin.contacts.placeholders.arrival')}
                  value={form.address}
                  onChange={(event) => updateField('address', event.target.value)}
                />
                <Clock size={16} aria-hidden />
              </span>
            </label>

            <label className="admin-contacts__field" htmlFor="contact-notes">
              <span className="admin-contacts__field-label">{t('admin.contacts.fields.notes')}</span>
              <textarea
                id="contact-notes"
                placeholder={t('admin.contacts.placeholders.notes')}
                value={form.notes}
                onChange={(event) => updateField('notes', event.target.value)}
              />
            </label>

            {formError ? <p className="admin-contacts__feedback admin-contacts__feedback--error">{formError}</p> : null}
            {successMessage ? (
              <p className="admin-contacts__feedback admin-contacts__feedback--success">{successMessage}</p>
            ) : null}

            <div className="admin-contacts__form-actions">
              <button className="admin-contacts__submit-btn" type="submit" disabled={submitting}>
                <Save size={16} aria-hidden />
                {submitting
                  ? t('admin.contacts.saveLoading')
                  : editingId
                    ? t('admin.contacts.updateButton')
                    : t('admin.contacts.createButton')}
              </button>
              {editingId ? (
                <button type="button" className="admin-contacts__cancel-link" onClick={cancelEdit}>
                  {t('admin.contacts.cancelEdit')}
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <div className="admin-contacts__list-col">
        <section className="obw-portal-panel admin-contacts__toolbar">
          <span className="obw-portal-kicker admin-contacts__toolbar-label">{t('admin.contacts.searchLabel')}</span>
          <FilterPills
            options={[
              { id: 'all' as const, label: t('admin.contacts.filterAll', { count: contacts.length }) },
              ...LOGISTICS_CONTACT_CATEGORY_IDS.map((categoryId) => ({
                id: categoryId as 'all' | LogisticsContactCategory,
                label: getLogisticsContactCategoryLabel(categoryId, t),
              })),
            ]}
            active={categoryFilter}
            onChange={setCategoryFilter}
          />
          <SearchBar value={search} onChange={setSearch} placeholder={t('admin.contacts.searchPlaceholder')} />
        </section>

        {filteredContacts.length === 0 ? (
          <p className="obw-body obw-body--flush">{t('admin.contacts.empty')}</p>
        ) : (
          <div className="admin-contacts__supplier-grid">
            {filteredContacts.map((contact) => {
              const status = supplierStatus(contact, t);
              const actions = buildContactActions(contact, t);
              const callAction = actions.find((action) => action.id === 'phone');
              const messageAction = actions.find((action) => action.id === 'whatsapp');
              const manageActions = [
                { icon: Pencil, label: t('admin.contacts.edit'), onClick: () => startEdit(contact) },
                {
                  icon: contact.is_active ? EyeOff : Eye,
                  label: contact.is_active ? t('admin.contacts.hide') : t('admin.contacts.activate'),
                  onClick: () => void handleToggleActive(contact),
                },
                {
                  icon: Trash2,
                  label: t('admin.contacts.delete'),
                  onClick: () => void handleDelete(contact),
                  danger: true,
                },
              ];

              return (
                <SupplierCard
                  key={contact.id}
                  categoryLabel={getLogisticsContactCategoryLabel(contact.category, t)}
                  statusLabel={status.label}
                  statusTone={status.tone}
                  title={contact.label}
                  roleLabel={supplierRoleLabel(contact, t)}
                  roleName={contact.contact_person || '—'}
                  infoItems={supplierInfoItems(contact)}
                  note={contact.notes}
                  callAction={callAction}
                  messageAction={messageAction}
                  manageActions={manageActions}
                />
              );
            })}
          </div>
        )}
        </div>
      </div>
    </>
  );
}
