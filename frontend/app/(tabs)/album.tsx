import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
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
  completePhotoUpload,
  createPhotoUploadIntent,
  fetchPublicPhotoAlbum,
  PublicPhotoAlbumItem,
} from '@/services/photoAlbumApi';

function formatPhotoDate(value: string) {
  return new Date(value).toLocaleDateString('it-IT');
}

function buildAssetFilename(asset: ImagePicker.ImagePickerAsset) {
  return asset.fileName || asset.uri.split('/').pop() || `guest-photo-${Date.now()}.jpg`;
}

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

// Guest-facing wedding album with upload flow based on invitation token.
export default function AlbumScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [photos, setPhotos] = useState<PublicPhotoAlbumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [invitationToken, setInvitationToken] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadAlbum = useCallback(async () => {
    try {
      setError(null);
      const publicPhotos = await fetchPublicPhotoAlbum();
      setPhotos(publicPhotos);
    } catch {
      setError('Impossibile caricare l’album in questo momento.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAlbum();
  }, [loadAlbum]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadAlbum();
  }

  async function handlePickImage() {
    setUploadMessage(null);

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted && permission.canAskAgain === false) {
      setError('Permesso galleria negato. Abilitalo dalle impostazioni del dispositivo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    });

    if (result.canceled) {
      return;
    }

    setSelectedAsset(result.assets[0]);
  }

  async function handleUpload() {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const normalizedToken = invitationToken.trim();
    if (!normalizedToken) {
      setUploadMessage('Inserisci il token invito prima di caricare una foto.');
      return;
    }
    if (!selectedAsset) {
      setUploadMessage('Seleziona prima una foto dalla galleria.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadMessage(null);

      const assetFilename = buildAssetFilename(selectedAsset);
      const pickedResponse = await fetch(selectedAsset.uri);
      const pickedBlob = await pickedResponse.blob();
      const mimeType = selectedAsset.mimeType || pickedBlob.type || 'image/jpeg';
      const fileSizeBytes = selectedAsset.fileSize || pickedBlob.size || 1;

      const uploadIntent = await createPhotoUploadIntent({
        invitation_token: normalizedToken,
        original_filename: assetFilename,
        mime_type: mimeType,
        file_size_bytes: fileSizeBytes,
      });

      const uploadResponse = await fetch(uploadIntent.upload_url, {
        method: uploadIntent.upload_method,
        headers: uploadIntent.upload_headers,
        body: pickedBlob,
      });

      if (!uploadResponse.ok) {
        throw new Error('Storage upload failed');
      }

      await completePhotoUpload({
        invitation_token: normalizedToken,
        storage_key: uploadIntent.storage_key,
        original_filename: assetFilename,
        mime_type: mimeType,
        file_size_bytes: fileSizeBytes,
        caption: caption.trim() || undefined,
      });

      setCaption('');
      setSelectedAsset(null);
      setUploadMessage('Foto inviata. Sara visibile nell’album dopo l’approvazione admin.');
      await loadAlbum();
    } catch (caughtError) {
      const requestError = caughtError as AxiosError<{ detail?: string }>;
      if (requestError.response?.status === 401) {
        router.push('/auth/login');
        return;
      }
      setUploadMessage(
        requestError.response?.data?.detail || 'Caricamento non riuscito. Controlla token e rete.',
      );
    } finally {
      setUploading(false);
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
          <Text style={styles.eyebrow}>Album</Text>
          <Text style={styles.title}>Raccogliamo i ricordi del matrimonio in un solo posto.</Text>
          <Text style={styles.subtitle}>
            Gli invitati possono inviare nuove foto con il token dell’invito. Le immagini restano in
            attesa finche l’admin non le approva.
          </Text>
          <Pressable
            style={[styles.secondaryButton, refreshing && styles.buttonDisabled]}
            onPress={handleRefresh}
            disabled={refreshing}>
            <Text style={styles.secondaryButtonText}>
              {refreshing ? 'Aggiornamento...' : 'Aggiorna album'}
            </Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.alertCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Invia una foto</Text>
          <Text style={styles.sectionDescription}>
            Inserisci il token invito, scegli una foto e aggiungi una breve didascalia se vuoi.
          </Text>
          {!isAuthenticated ? (
            <Text style={styles.helperText}>
              Per caricare una foto devi prima accedere con il tuo account.
            </Text>
          ) : null}
          <TextInput
            style={styles.input}
            placeholder="Token invito"
            placeholderTextColor={aotTheme.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            value={invitationToken}
            onChangeText={setInvitationToken}
          />
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Didascalia opzionale"
            placeholderTextColor={aotTheme.textMuted}
            value={caption}
            onChangeText={setCaption}
            multiline
          />
          <Pressable style={styles.secondaryButton} onPress={handlePickImage}>
            <Text style={styles.secondaryButtonText}>
              {isAuthenticated
                ? selectedAsset
                  ? 'Cambia foto selezionata'
                  : 'Scegli foto dalla galleria'
                : 'Accedi per scegliere una foto'}
            </Text>
          </Pressable>
          {selectedAsset ? (
            <View style={styles.previewCard}>
              <Image source={{ uri: selectedAsset.uri }} style={styles.previewImage} />
              <Text style={styles.previewMeta}>{buildAssetFilename(selectedAsset)}</Text>
              <Text style={styles.previewMeta}>
                {formatBytes(selectedAsset.fileSize || 0)}
                {selectedAsset.mimeType ? ` • ${selectedAsset.mimeType}` : ''}
              </Text>
            </View>
          ) : null}
          <Pressable
            style={[styles.primaryButton, uploading && styles.buttonDisabled]}
            onPress={handleUpload}
            disabled={uploading}>
            <Text style={styles.primaryButtonText}>
              {isAuthenticated
                ? uploading
                  ? 'Caricamento in corso...'
                  : 'Invia foto all’album'
                : 'Accedi per inviare una foto'}
            </Text>
          </Pressable>
          {uploadMessage ? <Text style={styles.helperText}>{uploadMessage}</Text> : null}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Foto approvate</Text>
          {photos.length === 0 ? (
            <Text style={styles.emptyText}>
              Nessuna foto approvata ancora. Le prime appariranno qui appena moderate.
            </Text>
          ) : (
            photos.map((photo) => (
              <View key={photo.id} style={styles.photoCard}>
                <Image source={{ uri: photo.image_url }} style={styles.photoImage} />
                <View style={styles.photoBody}>
                  <Text style={styles.photoGuest}>{photo.guest_full_name}</Text>
                  <Text style={styles.photoMeta}>{formatPhotoDate(photo.uploaded_at)}</Text>
                  {photo.caption ? <Text style={styles.photoCaption}>{photo.caption}</Text> : null}
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
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 16,
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
  primaryButton: {
    backgroundColor: aotTheme.bronze,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: aotTheme.surface,
    fontWeight: '700',
    fontSize: 15,
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
  helperText: {
    color: aotTheme.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },
  previewCard: {
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 18,
    padding: 12,
    backgroundColor: aotTheme.surfaceMuted,
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    backgroundColor: aotTheme.border,
    marginBottom: 10,
  },
  previewMeta: {
    color: aotTheme.textMuted,
    fontSize: 13,
    marginBottom: 4,
  },
  emptyText: {
    color: aotTheme.textMuted,
    fontSize: 14,
    lineHeight: 22,
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
});
