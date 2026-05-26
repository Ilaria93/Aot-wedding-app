import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { aotTheme } from '@/constants/aotTheme';
import { getFactionLabel } from '@/constants/factions';
import {
  getLogisticsContactCategoryLabel,
  getLogisticsContactCategoryOptions,
} from '@/constants/logistics';
import type { AppLocale, TranslateFn } from '@/i18n/translations';
import type {
  AdminGuestListItem,
  AdminRsvpStats,
} from '@/services/adminDashboardApi';
import type {
  LogisticsContactCategory,
  LogisticsContactItem,
} from '@/services/logisticsContactsApi';
import type {
  AdminPhotoAlbumItem,
  AdminPhotoStatus,
} from '@/services/photoAlbumApi';
import { formatDateByLocale } from '@/utils/formatters';

export type ContactFormState = {
  category: LogisticsContactCategory;
  label: string;
  contactPerson: string;
  phone: string;
  whatsappPhone: string;
  email: string;
  website: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  address: string;
  notes: string;
  sortOrder: string;
  isActive: boolean;
};

export function createInitialContactForm(): ContactFormState {
  return {
    category: 'hotel',
    label: '',
    contactPerson: '',
    phone: '',
    whatsappPhone: '',
    email: '',
    website: '',
    instagramUrl: '',
    facebookUrl: '',
    tiktokUrl: '',
    address: '',
    notes: '',
    sortOrder: '0',
    isActive: true,
  };
}

function formatPhotoStatus(status: AdminPhotoStatus, t: TranslateFn) {
  switch (status) {
    case 'approved':
      return t('admin.photoStatuses.approved');
    case 'rejected':
      return t('admin.photoStatuses.rejected');
    default:
      return t('admin.photoStatuses.pending');
  }
}

function getRsvpStatusLabel(guest: AdminGuestListItem, t: TranslateFn) {
  if (!guest.has_rsvp) {
    return t('admin.rsvpStatuses.pending');
  }

  return guest.attending
    ? t('admin.rsvpStatuses.attending')
    : t('admin.rsvpStatuses.notAttending');
}

type ContactFieldChangeHandler = (
  field: keyof ContactFormState,
  value: ContactFormState[keyof ContactFormState],
) => void;

type AdminStatsSectionProps = {
  stats: AdminRsvpStats;
  t: TranslateFn;
};

export function AdminStatsSection({ stats, t }: AdminStatsSectionProps) {
  return (
    <>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('admin.stats.invited')}</Text>
          <Text style={styles.statValue}>{stats.total_invited}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('admin.stats.confirmed')}</Text>
          <Text style={styles.statValue}>{stats.total_confirmed}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('admin.stats.attending')}</Text>
          <Text style={styles.statValue}>{stats.total_attending}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('admin.stats.notAttending')}</Text>
          <Text style={styles.statValue}>{stats.total_not_attending}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{t('admin.factions.title')}</Text>
        {Object.keys(stats.by_faction).length === 0 ? (
          <Text style={styles.emptyText}>{t('admin.factions.empty')}</Text>
        ) : (
          Object.entries(stats.by_faction).map(([faction, count]) => (
            <View key={faction} style={styles.factionRow}>
              <Text style={styles.factionLabel}>{getFactionLabel(faction, t) ?? faction}</Text>
              <Text style={styles.factionCount}>{count}</Text>
            </View>
          ))
        )}
      </View>
    </>
  );
}

type AdminPhotoModerationSectionProps = {
  locale: AppLocale;
  photoActionId: number | null;
  photos: AdminPhotoAlbumItem[];
  t: TranslateFn;
  onUpdatePhotoStatus: (photoId: number, status: AdminPhotoStatus) => void;
};

export function AdminPhotoModerationSection({
  locale,
  photoActionId,
  photos,
  t,
  onUpdatePhotoStatus,
}: AdminPhotoModerationSectionProps) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{t('admin.photos.title')}</Text>
      {photos.length === 0 ? (
        <Text style={styles.emptyText}>{t('admin.photos.empty')}</Text>
      ) : (
        photos.map((photo) => (
          <View key={photo.id} style={styles.photoCard}>
            <Image source={{ uri: photo.image_url }} style={styles.photoImage} />
            <View style={styles.photoBody}>
              <View style={styles.photoHeader}>
                <Text style={styles.photoGuest}>{photo.guest_full_name}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>
                    {formatPhotoStatus(photo.status, t)}
                  </Text>
                </View>
              </View>
              <Text style={styles.photoMeta}>
                {photo.original_filename} • {photo.mime_type} • {photo.file_size_bytes}{' '}
                {t('common.bytes')}
              </Text>
              <Text style={styles.photoMeta}>
                {t('admin.photos.uploadedAt', {
                  value: formatDateByLocale(photo.uploaded_at, locale) || '',
                })}
              </Text>
              {photo.approved_at ? (
                <Text style={styles.photoMeta}>
                  {t('admin.photos.approvedAt', {
                    value: formatDateByLocale(photo.approved_at, locale) || '',
                  })}
                </Text>
              ) : null}
              {photo.caption ? <Text style={styles.photoCaption}>{photo.caption}</Text> : null}
              <View style={styles.actionsRow}>
                <Pressable
                  style={[
                    styles.inlineActionButton,
                    photoActionId === photo.id && styles.inlineActionButtonDisabled,
                  ]}
                  onPress={() => onUpdatePhotoStatus(photo.id, 'approved')}
                  disabled={photoActionId === photo.id}>
                  <Text style={styles.inlineActionButtonText}>{t('admin.photos.approve')}</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.inlineActionButton,
                    photoActionId === photo.id && styles.inlineActionButtonDisabled,
                  ]}
                  onPress={() => onUpdatePhotoStatus(photo.id, 'pending')}
                  disabled={photoActionId === photo.id}>
                  <Text style={styles.inlineActionButtonText}>
                    {t('admin.photos.backToPending')}
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.inlineActionButton,
                    photoActionId === photo.id && styles.inlineActionButtonDisabled,
                  ]}
                  onPress={() => onUpdatePhotoStatus(photo.id, 'rejected')}
                  disabled={photoActionId === photo.id}>
                  <Text style={styles.inlineActionButtonText}>{t('admin.photos.reject')}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

type AdminContactFormSectionProps = {
  contactForm: ContactFormState;
  contactMessage: string | null;
  contactSaving: boolean;
  editingContactId: number | null;
  t: TranslateFn;
  onFieldChange: ContactFieldChangeHandler;
  onSave: () => void;
  onCancelEdit: () => void;
};

export function AdminContactFormSection({
  contactForm,
  contactMessage,
  contactSaving,
  editingContactId,
  t,
  onFieldChange,
  onSave,
  onCancelEdit,
}: AdminContactFormSectionProps) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>
        {editingContactId ? t('admin.contacts.editTitle') : t('admin.contacts.newTitle')}
      </Text>
      <Text style={styles.sectionDescription}>{t('admin.contacts.description')}</Text>

      <View style={styles.segmentRow}>
        {getLogisticsContactCategoryOptions(t).map((item) => (
          <Pressable
            key={item.id}
            style={[
              styles.segmentButton,
              contactForm.category === item.id && styles.segmentButtonActive,
            ]}
            onPress={() => onFieldChange('category', item.id)}>
            <Text
              style={[
                styles.segmentButtonText,
                contactForm.category === item.id && styles.segmentButtonTextActive,
              ]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder={t('admin.contacts.placeholders.label')}
        placeholderTextColor={aotTheme.textMuted}
        value={contactForm.label}
        onChangeText={(value) => onFieldChange('label', value)}
      />
      <TextInput
        style={styles.input}
        placeholder={t('admin.contacts.placeholders.contactPerson')}
        placeholderTextColor={aotTheme.textMuted}
        value={contactForm.contactPerson}
        onChangeText={(value) => onFieldChange('contactPerson', value)}
      />
      <TextInput
        style={styles.input}
        placeholder={t('admin.contacts.placeholders.phone')}
        placeholderTextColor={aotTheme.textMuted}
        value={contactForm.phone}
        onChangeText={(value) => onFieldChange('phone', value)}
      />
      <TextInput
        style={styles.input}
        placeholder={t('admin.contacts.placeholders.whatsapp')}
        placeholderTextColor={aotTheme.textMuted}
        value={contactForm.whatsappPhone}
        onChangeText={(value) => onFieldChange('whatsappPhone', value)}
      />
      <TextInput
        style={styles.input}
        placeholder={t('admin.contacts.placeholders.email')}
        placeholderTextColor={aotTheme.textMuted}
        value={contactForm.email}
        onChangeText={(value) => onFieldChange('email', value)}
      />
      <TextInput
        style={styles.input}
        placeholder={t('admin.contacts.placeholders.website')}
        placeholderTextColor={aotTheme.textMuted}
        value={contactForm.website}
        onChangeText={(value) => onFieldChange('website', value)}
      />
      <TextInput
        style={styles.input}
        placeholder={t('admin.contacts.placeholders.instagram')}
        placeholderTextColor={aotTheme.textMuted}
        value={contactForm.instagramUrl}
        onChangeText={(value) => onFieldChange('instagramUrl', value)}
      />
      <TextInput
        style={styles.input}
        placeholder={t('admin.contacts.placeholders.facebook')}
        placeholderTextColor={aotTheme.textMuted}
        value={contactForm.facebookUrl}
        onChangeText={(value) => onFieldChange('facebookUrl', value)}
      />
      <TextInput
        style={styles.input}
        placeholder={t('admin.contacts.placeholders.tiktok')}
        placeholderTextColor={aotTheme.textMuted}
        value={contactForm.tiktokUrl}
        onChangeText={(value) => onFieldChange('tiktokUrl', value)}
      />
      <TextInput
        style={styles.input}
        placeholder={t('admin.contacts.placeholders.address')}
        placeholderTextColor={aotTheme.textMuted}
        value={contactForm.address}
        onChangeText={(value) => onFieldChange('address', value)}
      />
      <TextInput
        style={styles.input}
        placeholder={t('admin.contacts.placeholders.sortOrder')}
        placeholderTextColor={aotTheme.textMuted}
        keyboardType="numeric"
        value={contactForm.sortOrder}
        onChangeText={(value) => onFieldChange('sortOrder', value)}
      />
      <TextInput
        style={[styles.input, styles.multilineInput]}
        placeholder={t('admin.contacts.placeholders.notes')}
        placeholderTextColor={aotTheme.textMuted}
        value={contactForm.notes}
        onChangeText={(value) => onFieldChange('notes', value)}
        multiline
      />

      <View style={styles.actionsRow}>
        <Pressable
          style={[styles.refreshButton, contactSaving && styles.refreshButtonDisabled]}
          onPress={onSave}
          disabled={contactSaving}>
          <Text style={styles.refreshButtonText}>
            {contactSaving
              ? t('admin.contacts.saveLoading')
              : editingContactId
                ? t('admin.contacts.updateButton')
                : t('admin.contacts.createButton')}
          </Text>
        </Pressable>
        {editingContactId ? (
          <Pressable style={styles.inlineActionButton} onPress={onCancelEdit}>
            <Text style={styles.inlineActionButtonText}>{t('admin.contacts.cancelEdit')}</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={styles.inlineActionButton}
          onPress={() => onFieldChange('isActive', !contactForm.isActive)}>
          <Text style={styles.inlineActionButtonText}>
            {contactForm.isActive
              ? t('admin.contacts.activeToggle')
              : t('admin.contacts.inactiveToggle')}
          </Text>
        </Pressable>
      </View>

      {contactMessage ? <Text style={styles.helperText}>{contactMessage}</Text> : null}
    </View>
  );
}

type AdminContactListSectionProps = {
  contactActionId: number | null;
  contacts: LogisticsContactItem[];
  t: TranslateFn;
  onDelete: (contactId: number) => void;
  onEdit: (contact: LogisticsContactItem) => void;
  onToggleActive: (contact: LogisticsContactItem) => void;
};

export function AdminContactListSection({
  contactActionId,
  contacts,
  t,
  onDelete,
  onEdit,
  onToggleActive,
}: AdminContactListSectionProps) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{t('admin.contacts.publishedTitle')}</Text>
      {contacts.length === 0 ? (
        <Text style={styles.emptyText}>{t('admin.contacts.empty')}</Text>
      ) : (
        contacts.map((contact) => (
          <View key={contact.id} style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <Text style={styles.contactName}>{contact.label}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>
                  {contact.is_active ? t('common.active') : t('common.hidden')}
                </Text>
              </View>
            </View>
            <Text style={styles.guestMeta}>
              {t('admin.contacts.category', {
                value: getLogisticsContactCategoryLabel(contact.category, t),
              })}
            </Text>
            {contact.contact_person ? (
              <Text style={styles.guestMeta}>
                {t('admin.contacts.contactPerson', { value: contact.contact_person })}
              </Text>
            ) : null}
            {contact.phone ? (
              <Text style={styles.guestMeta}>
                {t('admin.contacts.phone', { value: contact.phone })}
              </Text>
            ) : null}
            {contact.whatsapp_phone ? (
              <Text style={styles.guestMeta}>
                {t('admin.contacts.whatsapp', { value: contact.whatsapp_phone })}
              </Text>
            ) : null}
            {contact.email ? (
              <Text style={styles.guestMeta}>
                {t('admin.contacts.email', { value: contact.email })}
              </Text>
            ) : null}
            {contact.website ? (
              <Text style={styles.guestMeta}>
                {t('admin.contacts.website', { value: contact.website })}
              </Text>
            ) : null}
            {contact.instagram_url ? (
              <Text style={styles.guestMeta}>
                {t('admin.contacts.instagram', { value: contact.instagram_url })}
              </Text>
            ) : null}
            {contact.facebook_url ? (
              <Text style={styles.guestMeta}>
                {t('admin.contacts.facebook', { value: contact.facebook_url })}
              </Text>
            ) : null}
            {contact.tiktok_url ? (
              <Text style={styles.guestMeta}>
                {t('admin.contacts.tiktok', { value: contact.tiktok_url })}
              </Text>
            ) : null}
            {contact.address ? (
              <Text style={styles.guestMeta}>
                {t('admin.contacts.address', { value: contact.address })}
              </Text>
            ) : null}
            {contact.notes ? (
              <Text style={styles.guestMeta}>
                {t('admin.contacts.notes', { value: contact.notes })}
              </Text>
            ) : null}
            <View style={styles.actionsRow}>
              <Pressable style={styles.inlineActionButton} onPress={() => onEdit(contact)}>
                <Text style={styles.inlineActionButtonText}>{t('admin.contacts.edit')}</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.inlineActionButton,
                  contactActionId === contact.id && styles.inlineActionButtonDisabled,
                ]}
                onPress={() => onToggleActive(contact)}
                disabled={contactActionId === contact.id}>
                <Text style={styles.inlineActionButtonText}>
                  {contact.is_active ? t('admin.contacts.hide') : t('admin.contacts.activate')}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.inlineActionButton,
                  contactActionId === contact.id && styles.inlineActionButtonDisabled,
                ]}
                onPress={() => onDelete(contact.id)}
                disabled={contactActionId === contact.id}>
                <Text style={styles.inlineActionButtonText}>{t('admin.contacts.delete')}</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

type AdminGuestListSectionProps = {
  guests: AdminGuestListItem[];
  t: TranslateFn;
};

export function AdminGuestListSection({ guests, t }: AdminGuestListSectionProps) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{t('admin.guests.title')}</Text>
      {guests.length === 0 ? (
        <Text style={styles.emptyText}>{t('admin.guests.empty')}</Text>
      ) : (
        guests.map((guest) => (
          <View key={guest.id} style={styles.guestCard}>
            <View style={styles.guestHeader}>
              <Text style={styles.guestName}>{guest.full_name}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{getRsvpStatusLabel(guest, t)}</Text>
              </View>
            </View>
            <Text style={styles.guestMeta}>
              {t('admin.guests.token', { value: guest.invitation_token })}
            </Text>
            <Text style={styles.guestMeta}>
              {t('admin.guests.faction', {
                value: getFactionLabel(guest.faction, t) ?? t('common.notAssigned'),
              })}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '47%',
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 20,
    padding: 16,
    backgroundColor: aotTheme.surface,
  },
  statLabel: {
    color: aotTheme.textMuted,
    fontSize: 13,
    marginBottom: 8,
  },
  statValue: {
    color: aotTheme.textPrimary,
    fontSize: 26,
    fontWeight: '700',
  },
  sectionCard: {
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 24,
    padding: 16,
    backgroundColor: aotTheme.surface,
    marginBottom: 16,
  },
  sectionTitle: {
    color: aotTheme.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionDescription: {
    color: aotTheme.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  emptyText: {
    color: aotTheme.textMuted,
    fontSize: 14,
  },
  factionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: aotTheme.border,
  },
  factionLabel: {
    color: aotTheme.textPrimary,
    fontSize: 15,
  },
  factionCount: {
    color: aotTheme.bronze,
    fontSize: 15,
    fontWeight: '700',
  },
  photoCard: {
    borderTopWidth: 1,
    borderTopColor: aotTheme.border,
    paddingTop: 14,
    marginTop: 14,
  },
  photoImage: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    backgroundColor: aotTheme.border,
    marginBottom: 12,
  },
  photoBody: {
    gap: 4,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  photoGuest: {
    color: aotTheme.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  photoMeta: {
    color: aotTheme.textMuted,
    fontSize: 13,
  },
  photoCaption: {
    color: aotTheme.textPrimary,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  inlineActionButton: {
    backgroundColor: aotTheme.surfaceMuted,
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  inlineActionButtonDisabled: {
    opacity: 0.55,
  },
  inlineActionButtonText: {
    color: aotTheme.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: aotTheme.bronze,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: aotTheme.surfaceMuted,
  },
  statusBadgeText: {
    color: aotTheme.textPrimary,
    fontSize: 12,
    fontWeight: '700',
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
  input: {
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 14,
    padding: 14,
    color: aotTheme.textPrimary,
    backgroundColor: aotTheme.surfaceMuted,
    marginBottom: 12,
  },
  multilineInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  helperText: {
    color: aotTheme.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  segmentButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: aotTheme.border,
    backgroundColor: aotTheme.surfaceMuted,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  segmentButtonActive: {
    borderColor: aotTheme.bronze,
    backgroundColor: '#f4e6d3',
  },
  segmentButtonText: {
    color: aotTheme.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  segmentButtonTextActive: {
    color: aotTheme.militaryGreenDark,
  },
  contactCard: {
    borderTopWidth: 1,
    borderTopColor: aotTheme.border,
    paddingTop: 12,
    marginTop: 12,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  contactName: {
    color: aotTheme.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  guestCard: {
    borderTopWidth: 1,
    borderTopColor: aotTheme.border,
    paddingVertical: 12,
  },
  guestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  guestName: {
    color: aotTheme.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  guestMeta: {
    color: aotTheme.textMuted,
    fontSize: 13,
    marginBottom: 4,
  },
});
