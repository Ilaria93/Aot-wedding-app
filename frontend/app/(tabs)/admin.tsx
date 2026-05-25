import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AxiosError } from 'axios';

import { aotTheme } from '@/constants/aotTheme';
import { useAuth } from '@/contexts/AuthContext';
import {
  createAdminLogisticsContact,
  deleteAdminLogisticsContact,
  fetchAdminLogisticsContacts,
  LogisticsContactCategory,
  LogisticsContactItem,
  updateAdminLogisticsContact,
} from '@/services/logisticsContactsApi';
import {
  AdminPhotoAlbumItem,
  AdminPhotoStatus,
  fetchAdminPhotoAlbum,
  updateAdminPhotoStatus,
} from '@/services/photoAlbumApi';
import {
  AdminGuestListItem,
  AdminRsvpStats,
  fetchAdminGuestList,
  fetchAdminRsvpStats,
} from '@/services/adminDashboardApi';

const CONTACT_CATEGORIES: { id: LogisticsContactCategory; label: string }[] = [
  { id: 'hair', label: 'Parrucchiere' },
  { id: 'makeup', label: 'Truccatrice' },
  { id: 'laundry', label: 'Stireria' },
  { id: 'hotel', label: 'Albergo' },
  { id: 'transfer', label: 'Transfer' },
  { id: 'car_rental', label: 'Noleggio auto' },
];

type ContactFormState = {
  category: LogisticsContactCategory;
  label: string;
  contactPerson: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  notes: string;
  sortOrder: string;
  isActive: boolean;
};

function createInitialContactForm(): ContactFormState {
  return {
    category: 'hotel',
    label: '',
    contactPerson: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    notes: '',
    sortOrder: '0',
    isActive: true,
  };
}

function formatFactionLabel(faction: string | null | undefined) {
  switch (faction) {
    case 'scout_regiment':
      return 'Ricognizione';
    case 'military_police':
      return 'Gendarmeria';
    case 'garrison':
      return 'Guarnigione';
    default:
      return null;
  }
}

function formatContactCategory(category: LogisticsContactCategory) {
  return CONTACT_CATEGORIES.find((item) => item.id === category)?.label ?? category;
}

function formatPhotoStatus(status: AdminPhotoStatus) {
  switch (status) {
    case 'approved':
      return 'Approvata';
    case 'rejected':
      return 'Rifiutata';
    default:
      return 'In attesa';
  }
}

function getRsvpStatusLabel(guest: AdminGuestListItem) {
  if (!guest.has_rsvp) {
    return 'In attesa';
  }

  return guest.attending ? 'Partecipa' : 'Non partecipa';
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleDateString('it-IT');
}

function normalizeOptionalText(value: string) {
  const normalized = value.trim();
  return normalized || undefined;
}

// Admin dashboard with RSVP overview, photo moderation and logistics management.
export default function AdminDashboardScreen() {
  const { isAdmin, isAuthenticated, isBootstrapping } = useAuth();
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
      setError('Accedi con il tuo account per aprire la dashboard admin.');
      setLoading(false);
      return;
    }

    if (!isAdmin) {
      setError('Questa sezione è visibile solo agli account admin autorizzati.');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const [statsResponse, guestListResponse, photoListResponse, contactsResponse] = await Promise.all([
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
      const requestError = caughtError as AxiosError<{ detail?: string }>;
      setError(
        requestError.response?.data?.detail ||
          'Impossibile caricare la dashboard admin. Controlla backend e admin key.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin, isAuthenticated]);

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
      email: contact.email || '',
      website: contact.website || '',
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
      setContactMessage('Inserisci almeno un titolo per il contatto.');
      return;
    }

    try {
      setContactSaving(true);
      setContactMessage(null);
      const successMessage = editingContactId ? 'Contatto aggiornato.' : 'Contatto creato.';

      const payload = {
        category: contactForm.category,
        label: contactForm.label.trim(),
        contact_person: normalizeOptionalText(contactForm.contactPerson),
        phone: normalizeOptionalText(contactForm.phone),
        email: normalizeOptionalText(contactForm.email),
        website: normalizeOptionalText(contactForm.website),
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
      const requestError = caughtError as AxiosError<{ detail?: string }>;
      setContactMessage(
        requestError.response?.data?.detail || 'Salvataggio contatto non riuscito.',
      );
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
      const requestError = caughtError as AxiosError<{ detail?: string }>;
      setError(requestError.response?.data?.detail || 'Aggiornamento contatto non riuscito.');
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
      const requestError = caughtError as AxiosError<{ detail?: string }>;
      setError(requestError.response?.data?.detail || 'Eliminazione contatto non riuscita.');
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
      const requestError = caughtError as AxiosError<{ detail?: string }>;
      setError(requestError.response?.data?.detail || 'Aggiornamento foto non riuscito.');
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
        <Text style={styles.emptyText}>Accedi dal profilo per usare la dashboard admin.</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Area riservata agli account admin autorizzati.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Admin</Text>
          <Text style={styles.title}>Dashboard RSVP, album foto e contatti logistici.</Text>
          <Text style={styles.subtitle}>
            Qui monitori invitati e fazioni, approvi le foto caricate dagli ospiti e aggiorni la
            rubrica utile per il matrimonio.
          </Text>
          <Pressable
            style={[styles.refreshButton, refreshing && styles.refreshButtonDisabled]}
            onPress={handleRefresh}
            disabled={refreshing}>
            <Text style={styles.refreshButtonText}>
              {refreshing ? 'Aggiornamento...' : 'Aggiorna dashboard'}
            </Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.alertCard}>
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        {stats ? (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Invitati</Text>
                <Text style={styles.statValue}>{stats.total_invited}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Confermati</Text>
                <Text style={styles.statValue}>{stats.total_confirmed}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Presenti</Text>
                <Text style={styles.statValue}>{stats.total_attending}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Assenti</Text>
                <Text style={styles.statValue}>{stats.total_not_attending}</Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Fazioni</Text>
              {Object.keys(stats.by_faction).length === 0 ? (
                <Text style={styles.emptyText}>Nessuna fazione assegnata al momento.</Text>
              ) : (
                Object.entries(stats.by_faction).map(([faction, count]) => (
                  <View key={faction} style={styles.factionRow}>
                    <Text style={styles.factionLabel}>{formatFactionLabel(faction) ?? faction}</Text>
                    <Text style={styles.factionCount}>{count}</Text>
                  </View>
                ))
              )}
            </View>
          </>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Moderazione foto</Text>
          {photos.length === 0 ? (
            <Text style={styles.emptyText}>Nessuna foto caricata dagli invitati.</Text>
          ) : (
            photos.map((photo) => (
              <View key={photo.id} style={styles.photoCard}>
                <Image source={{ uri: photo.image_url }} style={styles.photoImage} />
                <View style={styles.photoBody}>
                  <View style={styles.photoHeader}>
                    <Text style={styles.photoGuest}>{photo.guest_full_name}</Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>{formatPhotoStatus(photo.status)}</Text>
                    </View>
                  </View>
                  <Text style={styles.photoMeta}>
                    {photo.original_filename} • {photo.mime_type} • {photo.file_size_bytes} byte
                  </Text>
                  <Text style={styles.photoMeta}>Caricata il {formatDate(photo.uploaded_at)}</Text>
                  {photo.approved_at ? (
                    <Text style={styles.photoMeta}>Approvata il {formatDate(photo.approved_at)}</Text>
                  ) : null}
                  {photo.caption ? <Text style={styles.photoCaption}>{photo.caption}</Text> : null}
                  <View style={styles.actionsRow}>
                    <Pressable
                      style={[
                        styles.inlineActionButton,
                        photoActionId === photo.id && styles.inlineActionButtonDisabled,
                      ]}
                      onPress={() => handleUpdatePhotoStatus(photo.id, 'approved')}
                      disabled={photoActionId === photo.id}>
                      <Text style={styles.inlineActionButtonText}>Approva</Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.inlineActionButton,
                        photoActionId === photo.id && styles.inlineActionButtonDisabled,
                      ]}
                      onPress={() => handleUpdatePhotoStatus(photo.id, 'pending')}
                      disabled={photoActionId === photo.id}>
                      <Text style={styles.inlineActionButtonText}>Rimetti in attesa</Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.inlineActionButton,
                        photoActionId === photo.id && styles.inlineActionButtonDisabled,
                      ]}
                      onPress={() => handleUpdatePhotoStatus(photo.id, 'rejected')}
                      disabled={photoActionId === photo.id}>
                      <Text style={styles.inlineActionButtonText}>Rifiuta</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {editingContactId ? 'Modifica contatto logistico' : 'Nuovo contatto logistico'}
          </Text>
          <Text style={styles.sectionDescription}>
            Aggiungi o aggiorna riferimenti come parrucchiere, truccatrice, stireria, albergo,
            transfer e noleggio auto.
          </Text>

          <View style={styles.segmentRow}>
            {CONTACT_CATEGORIES.map((item) => (
              <Pressable
                key={item.id}
                style={[
                  styles.segmentButton,
                  contactForm.category === item.id && styles.segmentButtonActive,
                ]}
                onPress={() => handleContactFieldChange('category', item.id)}>
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
            placeholder="Titolo contatto"
            placeholderTextColor={aotTheme.textMuted}
            value={contactForm.label}
            onChangeText={(value) => handleContactFieldChange('label', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Referente"
            placeholderTextColor={aotTheme.textMuted}
            value={contactForm.contactPerson}
            onChangeText={(value) => handleContactFieldChange('contactPerson', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Telefono"
            placeholderTextColor={aotTheme.textMuted}
            value={contactForm.phone}
            onChangeText={(value) => handleContactFieldChange('phone', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={aotTheme.textMuted}
            value={contactForm.email}
            onChangeText={(value) => handleContactFieldChange('email', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Sito web"
            placeholderTextColor={aotTheme.textMuted}
            value={contactForm.website}
            onChangeText={(value) => handleContactFieldChange('website', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Indirizzo"
            placeholderTextColor={aotTheme.textMuted}
            value={contactForm.address}
            onChangeText={(value) => handleContactFieldChange('address', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Ordine visualizzazione"
            placeholderTextColor={aotTheme.textMuted}
            keyboardType="numeric"
            value={contactForm.sortOrder}
            onChangeText={(value) => handleContactFieldChange('sortOrder', value)}
          />
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Note"
            placeholderTextColor={aotTheme.textMuted}
            value={contactForm.notes}
            onChangeText={(value) => handleContactFieldChange('notes', value)}
            multiline
          />

          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.refreshButton, contactSaving && styles.refreshButtonDisabled]}
              onPress={handleSaveContact}
              disabled={contactSaving}>
              <Text style={styles.refreshButtonText}>
                {contactSaving
                  ? 'Salvataggio...'
                  : editingContactId
                    ? 'Aggiorna contatto'
                    : 'Crea contatto'}
              </Text>
            </Pressable>
            {editingContactId ? (
              <Pressable style={styles.inlineActionButton} onPress={resetContactForm}>
                <Text style={styles.inlineActionButtonText}>Annulla modifica</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={styles.inlineActionButton}
              onPress={() => handleContactFieldChange('isActive', !contactForm.isActive)}>
              <Text style={styles.inlineActionButtonText}>
                {contactForm.isActive ? 'Voce attiva' : 'Voce disattivata'}
              </Text>
            </Pressable>
          </View>

          {contactMessage ? <Text style={styles.helperText}>{contactMessage}</Text> : null}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Contatti pubblicati</Text>
          {contacts.length === 0 ? (
            <Text style={styles.emptyText}>Nessun contatto creato ancora.</Text>
          ) : (
            contacts.map((contact) => (
              <View key={contact.id} style={styles.contactCard}>
                <View style={styles.contactHeader}>
                  <Text style={styles.contactName}>{contact.label}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>
                      {contact.is_active ? 'Attivo' : 'Nascosto'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.guestMeta}>Categoria: {formatContactCategory(contact.category)}</Text>
                {contact.contact_person ? (
                  <Text style={styles.guestMeta}>Referente: {contact.contact_person}</Text>
                ) : null}
                {contact.phone ? <Text style={styles.guestMeta}>Telefono: {contact.phone}</Text> : null}
                {contact.email ? <Text style={styles.guestMeta}>Email: {contact.email}</Text> : null}
                {contact.website ? <Text style={styles.guestMeta}>Sito: {contact.website}</Text> : null}
                {contact.address ? <Text style={styles.guestMeta}>Indirizzo: {contact.address}</Text> : null}
                {contact.notes ? <Text style={styles.guestMeta}>Note: {contact.notes}</Text> : null}
                <View style={styles.actionsRow}>
                  <Pressable style={styles.inlineActionButton} onPress={() => startEditingContact(contact)}>
                    <Text style={styles.inlineActionButtonText}>Modifica</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.inlineActionButton,
                      contactActionId === contact.id && styles.inlineActionButtonDisabled,
                    ]}
                    onPress={() => handleToggleContactActive(contact)}
                    disabled={contactActionId === contact.id}>
                    <Text style={styles.inlineActionButtonText}>
                      {contact.is_active ? 'Nascondi' : 'Attiva'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.inlineActionButton,
                      contactActionId === contact.id && styles.inlineActionButtonDisabled,
                    ]}
                    onPress={() => handleDeleteContact(contact.id)}
                    disabled={contactActionId === contact.id}>
                    <Text style={styles.inlineActionButtonText}>Elimina</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Invitati</Text>
          {guests.length === 0 ? (
            <Text style={styles.emptyText}>Nessun invitato creato ancora.</Text>
          ) : (
            guests.map((guest) => (
              <View key={guest.id} style={styles.guestCard}>
                <View style={styles.guestHeader}>
                  <Text style={styles.guestName}>{guest.full_name}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>{getRsvpStatusLabel(guest)}</Text>
                  </View>
                </View>
                <Text style={styles.guestMeta}>Token: {guest.invitation_token}</Text>
                <Text style={styles.guestMeta}>
                  Fazione: {formatFactionLabel(guest.faction) ?? 'Non assegnata'}
                </Text>
              </View>
            ))
          )}
        </View>
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
  guestMeta: {
    color: aotTheme.textMuted,
    fontSize: 13,
    marginBottom: 4,
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
});
