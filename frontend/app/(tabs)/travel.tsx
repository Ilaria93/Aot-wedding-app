import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { aotTheme } from '@/constants/aotTheme';
import {
  fetchPublicLogisticsContacts,
  LogisticsContactCategory,
  LogisticsContactItem,
} from '@/services/logisticsContactsApi';

const CATEGORY_LABELS: Record<LogisticsContactCategory, string> = {
  hair: 'Parrucchiere',
  makeup: 'Truccatrice',
  laundry: 'Stireria',
  hotel: 'Albergo',
  transfer: 'Transfer',
  car_rental: 'Noleggio auto',
};

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

function normalizeWebsiteUrl(website: string) {
  if (website.startsWith('http://') || website.startsWith('https://')) {
    return website;
  }
  return `https://${website}`;
}

// Guest-facing logistics hub with grouped contacts and useful actions.
export default function TravelScreen() {
  const [contacts, setContacts] = useState<LogisticsContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groupedContacts = useMemo(() => buildGroupedContacts(contacts), [contacts]);

  const loadContacts = useCallback(async () => {
    try {
      setError(null);
      const publicContacts = await fetchPublicLogisticsContacts();
      setContacts(publicContacts);
    } catch {
      setError('Impossibile caricare i contatti logistici.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadContacts();
  }

  async function openExternalUrl(url: string) {
    await Linking.openURL(url);
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
          <Text style={styles.eyebrow}>Travel Hub</Text>
          <Text style={styles.title}>Tutti i riferimenti utili in un’unica schermata.</Text>
          <Text style={styles.subtitle}>
            Qui trovi i contatti operativi per preparazione, albergo, transfer e altri servizi
            comodi per il matrimonio.
          </Text>
          <Pressable
            style={[styles.secondaryButton, refreshing && styles.buttonDisabled]}
            onPress={handleRefresh}
            disabled={refreshing}>
            <Text style={styles.secondaryButtonText}>
              {refreshing ? 'Aggiornamento...' : 'Aggiorna contatti'}
            </Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.alertCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {contacts.length === 0 ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Nessun contatto disponibile</Text>
            <Text style={styles.emptyText}>
              Quando l’admin inserira i servizi logistici, li troverai qui divisi per categoria.
            </Text>
          </View>
        ) : (
          (Object.keys(CATEGORY_LABELS) as LogisticsContactCategory[])
            .filter((category) => groupedContacts[category].length > 0)
            .map((category) => (
              <View key={category} style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>{CATEGORY_LABELS[category]}</Text>
                {groupedContacts[category].map((contact) => (
                  <View key={contact.id} style={styles.contactCard}>
                    <Text style={styles.contactLabel}>{contact.label}</Text>
                    {contact.contact_person ? (
                      <Text style={styles.contactMeta}>Referente: {contact.contact_person}</Text>
                    ) : null}
                    {contact.address ? <Text style={styles.contactMeta}>{contact.address}</Text> : null}
                    {contact.notes ? <Text style={styles.contactNotes}>{contact.notes}</Text> : null}

                    <View style={styles.actionsRow}>
                      {contact.phone ? (
                        <Pressable
                          style={styles.actionButton}
                          onPress={() => openExternalUrl(`tel:${contact.phone}`)}>
                          <Text style={styles.actionButtonText}>Chiama</Text>
                        </Pressable>
                      ) : null}
                      {contact.email ? (
                        <Pressable
                          style={styles.actionButton}
                          onPress={() => openExternalUrl(`mailto:${contact.email}`)}>
                          <Text style={styles.actionButtonText}>Email</Text>
                        </Pressable>
                      ) : null}
                      {contact.website ? (
                        <Pressable
                          style={styles.actionButton}
                          onPress={() => openExternalUrl(normalizeWebsiteUrl(contact.website!))}>
                          <Text style={styles.actionButtonText}>Sito</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            ))
        )}
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
    marginBottom: 12,
  },
  emptyText: {
    color: aotTheme.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  contactCard: {
    borderTopWidth: 1,
    borderTopColor: aotTheme.border,
    paddingTop: 14,
    marginTop: 14,
  },
  contactLabel: {
    color: aotTheme.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  contactMeta: {
    color: aotTheme.textMuted,
    fontSize: 14,
    marginBottom: 4,
  },
  contactNotes: {
    color: aotTheme.textPrimary,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    backgroundColor: aotTheme.surfaceMuted,
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  actionButtonText: {
    color: aotTheme.textPrimary,
    fontWeight: '700',
    fontSize: 13,
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
});
