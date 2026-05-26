import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  AdminContactFormSection,
  AdminContactListSection,
  AdminGuestListSection,
  AdminPhotoModerationSection,
  AdminStatsSection,
  ContactFormState,
  createInitialContactForm,
} from '@/components/admin/AdminDashboardSections';
import { aotTheme } from '@/constants/aotTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import {
  AdminGuestListItem,
  AdminRsvpStats,
  fetchAdminGuestList,
  fetchAdminRsvpStats,
} from '@/services/adminDashboardApi';
import {
  createAdminLogisticsContact,
  deleteAdminLogisticsContact,
  LogisticsContactItem,
  fetchAdminLogisticsContacts,
  updateAdminLogisticsContact,
} from '@/services/logisticsContactsApi';
import {
  AdminPhotoAlbumItem,
  AdminPhotoStatus,
  fetchAdminPhotoAlbum,
  updateAdminPhotoStatus,
} from '@/services/photoAlbumApi';
import { getApiErrorMessage } from '@/utils/apiErrors';

function normalizeOptionalText(value: string) {
  const normalized = value.trim();
  return normalized || undefined;
}

// Keeps the admin screen focused on state and orchestration.
export default function AdminDashboardScreen() {
  const { canManageWedding, isAuthenticated, isBootstrapping } = useAuth();
  const { locale, t } = useI18n();
  const [stats, setStats] = useState<AdminRsvpStats | null>(null);
  const [guests, setGuests] = useState<AdminGuestListItem[]>([]);
  const [photos, setPhotos] = useState<AdminPhotoAlbumItem[]>([]);
  const [contacts, setContacts] = useState<LogisticsContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoActionId, setPhotoActionId] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState<ContactFormState>(createInitialContactForm());
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  const [contactSaving, setContactSaving] = useState(false);
  const [contactActionId, setContactActionId] = useState<number | null>(null);
  const [contactMessage, setContactMessage] = useState<string | null>(null);

  const loadAdminDashboard = useCallback(async () => {
    if (!isAuthenticated) {
      setError(t('admin.errors.loginRequired'));
      setLoading(false);
      return;
    }

    if (!canManageWedding) {
      setError(t('admin.errors.notAuthorized'));
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const [statsResponse, guestListResponse, photoListResponse, contactsResponse] =
        await Promise.all([
          fetchAdminRsvpStats(),
          fetchAdminGuestList(),
          fetchAdminPhotoAlbum(),
          fetchAdminLogisticsContacts(),
        ]);
      setStats(statsResponse);
      setGuests(guestListResponse);
      setPhotos(photoListResponse);
      setContacts(contactsResponse);
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, t('admin.errors.loadFailed')));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [canManageWedding, isAuthenticated, t]);

  useEffect(() => {
    loadAdminDashboard();
  }, [loadAdminDashboard]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadAdminDashboard();
  }

  function handleContactFieldChange(
    field: keyof ContactFormState,
    value: ContactFormState[keyof ContactFormState],
  ) {
    setContactForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startEditingContact(contact: LogisticsContactItem) {
    setEditingContactId(contact.id);
    setContactMessage(null);
    setContactForm({
      category: contact.category,
      label: contact.label,
      contactPerson: contact.contact_person || '',
      phone: contact.phone || '',
      whatsappPhone: contact.whatsapp_phone || '',
      email: contact.email || '',
      website: contact.website || '',
      instagramUrl: contact.instagram_url || '',
      facebookUrl: contact.facebook_url || '',
      tiktokUrl: contact.tiktok_url || '',
      address: contact.address || '',
      notes: contact.notes || '',
      sortOrder: String(contact.sort_order),
      isActive: contact.is_active,
    });
  }

  function resetContactForm() {
    setEditingContactId(null);
    setContactMessage(null);
    setContactForm(createInitialContactForm());
  }

  async function handleSaveContact() {
    if (!contactForm.label.trim()) {
      setContactMessage(t('admin.errors.contactTitleRequired'));
      return;
    }

    try {
      setContactSaving(true);
      setContactMessage(null);
      const successMessage = editingContactId
        ? t('admin.contacts.updatedMessage')
        : t('admin.contacts.createdMessage');

      const payload = {
        category: contactForm.category,
        label: contactForm.label.trim(),
        contact_person: normalizeOptionalText(contactForm.contactPerson),
        phone: normalizeOptionalText(contactForm.phone),
        whatsapp_phone: normalizeOptionalText(contactForm.whatsappPhone),
        email: normalizeOptionalText(contactForm.email),
        website: normalizeOptionalText(contactForm.website),
        instagram_url: normalizeOptionalText(contactForm.instagramUrl),
        facebook_url: normalizeOptionalText(contactForm.facebookUrl),
        tiktok_url: normalizeOptionalText(contactForm.tiktokUrl),
        address: normalizeOptionalText(contactForm.address),
        notes: normalizeOptionalText(contactForm.notes),
        sort_order: Number.parseInt(contactForm.sortOrder, 10) || 0,
        is_active: contactForm.isActive,
      };

      if (editingContactId) {
        await updateAdminLogisticsContact(editingContactId, payload);
      } else {
        await createAdminLogisticsContact(payload);
      }

      resetContactForm();
      setContactMessage(successMessage);
      await loadAdminDashboard();
    } catch (caughtError) {
      setContactMessage(getApiErrorMessage(caughtError, t('admin.errors.contactSaveFailed')));
    } finally {
      setContactSaving(false);
    }
  }

  async function handleToggleContactActive(contact: LogisticsContactItem) {
    try {
      setContactActionId(contact.id);
      await updateAdminLogisticsContact(contact.id, { is_active: !contact.is_active });
      await loadAdminDashboard();
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, t('admin.errors.contactUpdateFailed')));
    } finally {
      setContactActionId(null);
    }
  }

  async function handleDeleteContact(contactId: number) {
    try {
      setContactActionId(contactId);
      await deleteAdminLogisticsContact(contactId);
      if (editingContactId === contactId) {
        resetContactForm();
      }
      await loadAdminDashboard();
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, t('admin.errors.contactDeleteFailed')));
    } finally {
      setContactActionId(null);
    }
  }

  async function handleUpdatePhotoStatus(photoId: number, status: AdminPhotoStatus) {
    try {
      setPhotoActionId(photoId);
      await updateAdminPhotoStatus(photoId, status);
      await loadAdminDashboard();
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, t('admin.errors.photoUpdateFailed')));
    } finally {
      setPhotoActionId(null);
    }
  }

  if (isBootstrapping || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={aotTheme.bronze} size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{t('admin.auth.loginFromProfile')}</Text>
      </View>
    );
  }

  if (!canManageWedding) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{t('admin.auth.notAuthorized')}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>{t('admin.hero.eyebrow')}</Text>
          <Text style={styles.title}>{t('admin.hero.title')}</Text>
          <Text style={styles.subtitle}>{t('admin.hero.subtitle')}</Text>
          <Pressable
            style={[styles.refreshButton, refreshing && styles.refreshButtonDisabled]}
            onPress={handleRefresh}
            disabled={refreshing}>
            <Text style={styles.refreshButtonText}>
              {refreshing ? t('admin.hero.refreshing') : t('admin.hero.refresh')}
            </Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.alertCard}>
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        {stats ? <AdminStatsSection stats={stats} t={t} /> : null}

        <AdminPhotoModerationSection
          locale={locale}
          photoActionId={photoActionId}
          photos={photos}
          t={t}
          onUpdatePhotoStatus={handleUpdatePhotoStatus}
        />

        <AdminContactFormSection
          contactForm={contactForm}
          contactMessage={contactMessage}
          contactSaving={contactSaving}
          editingContactId={editingContactId}
          t={t}
          onFieldChange={handleContactFieldChange}
          onSave={handleSaveContact}
          onCancelEdit={resetContactForm}
        />

        <AdminContactListSection
          contactActionId={contactActionId}
          contacts={contacts}
          t={t}
          onDelete={handleDeleteContact}
          onEdit={startEditingContact}
          onToggleActive={handleToggleContactActive}
        />

        <AdminGuestListSection guests={guests} t={t} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: aotTheme.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flexGrow: 1,
    backgroundColor: aotTheme.background,
    padding: 24,
    paddingTop: 32,
    paddingBottom: 48,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 960,
  },
  heroCard: {
    backgroundColor: aotTheme.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: aotTheme.border,
    padding: 28,
    marginBottom: 16,
  },
  eyebrow: {
    color: aotTheme.bronze,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '700',
  },
  title: {
    color: aotTheme.textPrimary,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    marginBottom: 10,
  },
  subtitle: {
    color: aotTheme.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 18,
  },
  refreshButton: {
    alignSelf: 'flex-start',
    backgroundColor: aotTheme.bronze,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  refreshButtonDisabled: {
    opacity: 0.6,
  },
  refreshButtonText: {
    color: aotTheme.surface,
    fontWeight: '700',
    fontSize: 14,
  },
  alertCard: {
    backgroundColor: '#f7e3e3',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e8c2c2',
    padding: 16,
    marginBottom: 16,
  },
  error: {
    color: aotTheme.danger,
  },
  emptyText: {
    color: aotTheme.textMuted,
    fontSize: 14,
  },
});
