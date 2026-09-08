import { useCallback, useEffect, useState } from 'react';

import { PageAlert } from '@/components/PageShell';
import { RememberMeToggle } from '@/components/RememberMeToggle';
import { LOGISTICS_CONTACT_CATEGORY_IDS, getLogisticsContactCategoryLabel } from '@/constants/logistics';
import { useI18n } from '@/contexts/I18nContext';
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
import './styles/AdminContactsPage.scss';

type ContactFormState = {
  category: LogisticsContactCategory;
  label: string;
  contact_person: string;
  phone: string;
  whatsapp_phone: string;
  email: string;
  website: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  address: string;
  notes: string;
  sort_order: string;
  is_active: boolean;
};

const EMPTY_FORM: ContactFormState = {
  category: 'hotel',
  label: '',
  contact_person: '',
  phone: '',
  whatsapp_phone: '',
  email: '',
  website: '',
  instagram_url: '',
  facebook_url: '',
  tiktok_url: '',
  address: '',
  notes: '',
  sort_order: '0',
  is_active: true,
};

function contactToFormState(contact: LogisticsContactItem): ContactFormState {
  return {
    category: contact.category,
    label: contact.label,
    contact_person: contact.contact_person ?? '',
    phone: contact.phone ?? '',
    whatsapp_phone: contact.whatsapp_phone ?? '',
    email: contact.email ?? '',
    website: contact.website ?? '',
    instagram_url: contact.instagram_url ?? '',
    facebook_url: contact.facebook_url ?? '',
    tiktok_url: contact.tiktok_url ?? '',
    address: contact.address ?? '',
    notes: contact.notes ?? '',
    sort_order: String(contact.sort_order),
    is_active: contact.is_active,
  };
}

function formStateToPayload(form: ContactFormState): LogisticsContactPayload {
  return {
    category: form.category,
    label: form.label.trim(),
    contact_person: form.contact_person.trim() || undefined,
    phone: form.phone.trim() || undefined,
    whatsapp_phone: form.whatsapp_phone.trim() || undefined,
    email: form.email.trim() || undefined,
    website: form.website.trim() || undefined,
    instagram_url: form.instagram_url.trim() || undefined,
    facebook_url: form.facebook_url.trim() || undefined,
    tiktok_url: form.tiktok_url.trim() || undefined,
    address: form.address.trim() || undefined,
    notes: form.notes.trim() || undefined,
    sort_order: Number(form.sort_order) || 0,
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

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="loading-text">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <>
      {error ? <PageAlert message={error} /> : null}

      <section className="obw-portal-card">
        <h2 className="obw-display obw-display--sm">
          {editingId ? t('admin.contacts.editTitle') : t('admin.contacts.newTitle')}
        </h2>
        <p className="obw-body obw-body--flush">{t('admin.contacts.description')}</p>

        <form className="admin-contacts__form" onSubmit={(event) => void handleSubmit(event)}>
          <div className="admin-contacts__grid">
            <label className="obw-portal-field" htmlFor="contact-category">
              <span className="obw-portal-field__label">{t('admin.contacts.categoryLabel')}</span>
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

            <label className="obw-portal-field" htmlFor="contact-label">
              <span className="obw-portal-field__label">{t('admin.contacts.placeholders.label')}</span>
              <input
                id="contact-label"
                value={form.label}
                onChange={(event) => updateField('label', event.target.value)}
              />
            </label>

            <label className="obw-portal-field" htmlFor="contact-person">
              <span className="obw-portal-field__label">{t('admin.contacts.placeholders.contactPerson')}</span>
              <input
                id="contact-person"
                value={form.contact_person}
                onChange={(event) => updateField('contact_person', event.target.value)}
              />
            </label>

            <label className="obw-portal-field" htmlFor="contact-phone">
              <span className="obw-portal-field__label">{t('admin.contacts.placeholders.phone')}</span>
              <input
                id="contact-phone"
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
              />
            </label>

            <label className="obw-portal-field" htmlFor="contact-whatsapp">
              <span className="obw-portal-field__label">{t('admin.contacts.placeholders.whatsapp')}</span>
              <input
                id="contact-whatsapp"
                value={form.whatsapp_phone}
                onChange={(event) => updateField('whatsapp_phone', event.target.value)}
              />
            </label>

            <label className="obw-portal-field" htmlFor="contact-email">
              <span className="obw-portal-field__label">{t('admin.contacts.placeholders.email')}</span>
              <input
                id="contact-email"
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
              />
            </label>

            <label className="obw-portal-field" htmlFor="contact-website">
              <span className="obw-portal-field__label">{t('admin.contacts.placeholders.website')}</span>
              <input
                id="contact-website"
                value={form.website}
                onChange={(event) => updateField('website', event.target.value)}
              />
            </label>

            <label className="obw-portal-field" htmlFor="contact-instagram">
              <span className="obw-portal-field__label">{t('admin.contacts.placeholders.instagram')}</span>
              <input
                id="contact-instagram"
                value={form.instagram_url}
                onChange={(event) => updateField('instagram_url', event.target.value)}
              />
            </label>

            <label className="obw-portal-field" htmlFor="contact-facebook">
              <span className="obw-portal-field__label">{t('admin.contacts.placeholders.facebook')}</span>
              <input
                id="contact-facebook"
                value={form.facebook_url}
                onChange={(event) => updateField('facebook_url', event.target.value)}
              />
            </label>

            <label className="obw-portal-field" htmlFor="contact-tiktok">
              <span className="obw-portal-field__label">{t('admin.contacts.placeholders.tiktok')}</span>
              <input
                id="contact-tiktok"
                value={form.tiktok_url}
                onChange={(event) => updateField('tiktok_url', event.target.value)}
              />
            </label>

            <label className="obw-portal-field" htmlFor="contact-address">
              <span className="obw-portal-field__label">{t('admin.contacts.placeholders.address')}</span>
              <input
                id="contact-address"
                value={form.address}
                onChange={(event) => updateField('address', event.target.value)}
              />
            </label>

            <label className="obw-portal-field" htmlFor="contact-sort-order">
              <span className="obw-portal-field__label">{t('admin.contacts.placeholders.sortOrder')}</span>
              <input
                id="contact-sort-order"
                type="number"
                value={form.sort_order}
                onChange={(event) => updateField('sort_order', event.target.value)}
              />
            </label>

            <label className="obw-portal-field admin-contacts__notes" htmlFor="contact-notes">
              <span className="obw-portal-field__label">{t('admin.contacts.placeholders.notes')}</span>
              <textarea
                id="contact-notes"
                value={form.notes}
                onChange={(event) => updateField('notes', event.target.value)}
              />
            </label>
          </div>

          <RememberMeToggle
            checked={form.is_active}
            label={form.is_active ? t('admin.contacts.activeToggle') : t('admin.contacts.inactiveToggle')}
            onChange={(checked) => updateField('is_active', checked)}
          />

          {formError ? <p className="admin-contacts__feedback admin-contacts__feedback--error">{formError}</p> : null}
          {successMessage ? (
            <p className="admin-contacts__feedback admin-contacts__feedback--success">{successMessage}</p>
          ) : null}

          <div className="admin-contacts__form-actions">
            <button className="obw-portal-btn" type="submit" disabled={submitting}>
              {submitting
                ? t('admin.contacts.saveLoading')
                : editingId
                  ? t('admin.contacts.updateButton')
                  : t('admin.contacts.createButton')}
            </button>
            {editingId ? (
              <button type="button" className="obw-portal-btn obw-portal-btn--secondary" onClick={cancelEdit}>
                {t('admin.contacts.cancelEdit')}
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="obw-portal-card">
        <h2 className="obw-display obw-display--sm">{t('admin.contacts.publishedTitle')}</h2>
        {contacts.length === 0 ? (
          <p className="obw-body obw-body--flush">{t('admin.contacts.empty')}</p>
        ) : (
          <div className="obw-data-list">
            {contacts.map((contact) => (
              <article key={contact.id} className="admin-contacts__row">
                <div className="admin-contacts__row-main">
                  <span className="obw-data-row__title">{contact.label}</span>
                  <p className="obw-data-row__meta obw-data-row__meta--flush">
                    {t('admin.contacts.category', { value: getLogisticsContactCategoryLabel(contact.category, t) })}
                  </p>
                  <span
                    className={`obw-status-pill ${
                      contact.is_active ? 'obw-status-pill--active' : 'obw-status-pill--pending'
                    }`}>
                    {contact.is_active ? t('admin.contacts.activeToggle') : t('admin.contacts.inactiveToggle')}
                  </span>
                </div>
                <div className="admin-contacts__row-actions">
                  <button type="button" className="obw-portal-btn obw-portal-btn--secondary" onClick={() => startEdit(contact)}>
                    {t('admin.contacts.edit')}
                  </button>
                  <button
                    type="button"
                    className="obw-portal-btn obw-portal-btn--secondary"
                    onClick={() => void handleToggleActive(contact)}>
                    {contact.is_active ? t('admin.contacts.hide') : t('admin.contacts.activate')}
                  </button>
                  <button type="button" className="obw-portal-btn obw-portal-btn--secondary" onClick={() => void handleDelete(contact)}>
                    {t('admin.contacts.delete')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
