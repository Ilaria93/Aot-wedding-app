import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AxiosError } from 'axios';

import { aotTheme } from '@/constants/aotTheme';
import { adminApiKey } from '@/constants/apiConfig';
import {
  AdminGuestListItem,
  AdminRsvpStats,
  fetchAdminGuestList,
  fetchAdminRsvpStats,
} from '@/services/adminDashboardApi';
import {
  AdminPhotoAlbumItem,
  AdminPhotoStatus,
  fetchAdminPhotoAlbum,
  updateAdminPhotoStatus,
} from '@/services/photoAlbumApi';

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

function getRsvpStatusLabel(guest: AdminGuestListItem) {
  if (!guest.has_rsvp) {
    return 'In attesa';
  }

  return guest.attending ? 'Partecipa' : 'Non partecipa';
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

function formatDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleDateString('it-IT');
}

// Admin dashboard focused on RSVP overview and photo moderation only.
export default function AdminPhotoDashboardScreen() {
  const [stats, setStats] = useState<AdminRsvpStats | null>(null);
  const [guests, setGuests] = useState<AdminGuestListItem[]>([]);
  const [photos, setPhotos] = useState<AdminPhotoAlbumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoActionId, setPhotoActionId] = useState<number | null>(null);

  const loadAdminDashboard = useCallback(async () => {
    if (!adminApiKey) {
      setError('Manca EXPO_PUBLIC_ADMIN_API_KEY nel frontend.');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const [statsResponse, guestListResponse, photoListResponse] = await Promise.all([
        fetchAdminRsvpStats(),
        fetchAdminGuestList(),
        fetchAdminPhotoAlbum(),
      ]);
      setStats(statsResponse);
      setGuests(guestListResponse);
      setPhotos(photoListResponse);
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
  }, []);

  useEffect(() => {
    loadAdminDashboard();
  }, [loadAdminDashboard]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadAdminDashboard();
  }

  async function handleUpdatePhotoStatus(photoId: number, status: AdminPhotoStatus) {
    try {
      setPhotoActionId(photoId);
      await updateAdminPhotoStatus(photoId, status);
      await loadAdminDashboard();
    } catch (caughtError) {
      const requestError = caughtError as AxiosError<{ detail?: string }>;
      setError(requestError.response?.data?.detail || 'Aggiornamento stato foto non riuscito.');
    } finally {
      setPhotoActionId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={aotTheme.bronze} size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Admin</Text>
          <Text style={styles.title}>Dashboard RSVP e moderazione album.</Text>
          <Text style={styles.subtitle}>
            Questo branch contiene solo la parte foto: controllo conferme, lista invitati e
            approvazione delle immagini caricate dagli ospiti.
          </Text>
          <Pressable
            style={[styles.secondaryButton, refreshing && styles.buttonDisabled]}
            onPress={handleRefresh}
            disabled={refreshing}>
            <Text style={styles.secondaryButtonText}>
              {refreshing ? 'Aggiornamento...' : 'Aggiorna dashboard'}
            </Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.alertCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {stats ? (
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
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Lista invitati</Text>
          {guests.length === 0 ? (
            <Text style={styles.emptyText}>Nessun invitato disponibile al momento.</Text>
          ) : (
            guests.map((guest) => (
              <View key={guest.id} style={styles.guestRow}>
                <Text style={styles.guestName}>{guest.full_name}</Text>
                <Text style={styles.guestMeta}>Token: {guest.invitation_token}</Text>
                <Text style={styles.guestMeta}>{getRsvpStatusLabel(guest)}</Text>
                {formatFactionLabel(guest.faction) ? (
                  <Text style={styles.guestMeta}>Fazione: {formatFactionLabel(guest.faction)}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Moderazione foto</Text>
          <Text style={styles.sectionDescription}>
            Le immagini restano in stato pending finche non vengono approvate.
          </Text>
          {photos.length === 0 ? (
            <Text style={styles.emptyText}>
              Nessuna foto caricata ancora. Le nuove immagini appariranno qui in attesa di
              approvazione.
            </Text>
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
                  <View style={styles.inlineActions}>
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
                      <Text style={styles.inlineActionButtonText}>In attesa</Text>
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
    maxWidth: 1040,
  },
  heroCard: {
    backgroundColor: aotTheme.surface,
    borderRadius: 28,
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
  sectionCard: {
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 24,
    padding: 20,
    backgroundColor: aotTheme.surface,
    marginBottom: 16,
  },
  sectionTitle: {
    color: aotTheme.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionDescription: {
    color: aotTheme.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    minWidth: 180,
    flexGrow: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: aotTheme.border,
    backgroundColor: aotTheme.surface,
    padding: 18,
  },
  statLabel: {
    color: aotTheme.textMuted,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  statValue: {
    color: aotTheme.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: aotTheme.surfaceMuted,
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: aotTheme.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  alertCard: {
    backgroundColor: '#f7e3e3',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e8c2c2',
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    color: aotTheme.danger,
  },
  emptyText: {
    color: aotTheme.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  guestRow: {
    borderTopWidth: 1,
    borderTopColor: aotTheme.border,
    paddingTop: 14,
    marginTop: 14,
    gap: 4,
  },
  guestName: {
    color: aotTheme.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  guestMeta: {
    color: aotTheme.textMuted,
    fontSize: 13,
  },
  photoCard: {
    borderTopWidth: 1,
    borderTopColor: aotTheme.border,
    paddingTop: 16,
    marginTop: 16,
  },
  photoImage: {
    width: '100%',
    height: 260,
    borderRadius: 18,
    backgroundColor: aotTheme.border,
    marginBottom: 12,
  },
  photoBody: {
    gap: 4,
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  photoGuest: {
    color: aotTheme.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  photoMeta: {
    color: aotTheme.textMuted,
    fontSize: 13,
  },
  photoCaption: {
    color: aotTheme.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  inlineActionButton: {
    backgroundColor: aotTheme.surfaceMuted,
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  inlineActionButtonDisabled: {
    opacity: 0.6,
  },
  inlineActionButtonText: {
    color: aotTheme.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: aotTheme.surfaceMuted,
    borderWidth: 1,
    borderColor: aotTheme.border,
  },
  statusBadgeText: {
    color: aotTheme.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
});
