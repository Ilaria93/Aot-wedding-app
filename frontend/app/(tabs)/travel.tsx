import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { ComponentProps, useCallback, useEffect, useMemo, useState } from 'react';
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
  getLogisticsContactCategoryLabel,
  LOGISTICS_CONTACT_CATEGORY_IDS,
} from '@/constants/logistics';
import { useI18n } from '@/contexts/I18nContext';
import {
  fetchPublicLogisticsContacts,
  LogisticsContactCategory,
  LogisticsContactItem,
} from '@/services/logisticsContactsApi';

type Translate = ReturnType<typeof useI18n>['t'];

type ContactAction = {
  id: string;
  label: string;
  iconName: ComponentProps<typeof FontAwesome6>['name'];
  url: string;
  accentColor: string;
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

function normalizeExternalUrl(url: string) {
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('mailto:') ||
    url.startsWith('tel:') ||
    url.startsWith('whatsapp://')
  ) {
    return url;
  }
  return `https://${url}`;
}

function buildWhatsappUrl(value: string) {
  if (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('whatsapp://')
  ) {
    return value;
  }

  const digitsOnly = value.replace(/\D/g, '');
  return `https://wa.me/${digitsOnly}`;
}

function buildContactActions(
  contact: LogisticsContactItem,
  t: Translate,
): ContactAction[] {
  const actions: ContactAction[] = [];

  if (contact.phone) {
    actions.push({
      id: 'phone',
      label: t('contactActions.call'),
      iconName: 'phone',
      url: `tel:${contact.phone}`,
      accentColor: aotTheme.militaryGreen,
    });
  }

  if (contact.whatsapp_phone) {
    actions.push({
      id: 'whatsapp',
      label: t('contactActions.whatsapp'),
      iconName: 'whatsapp',
      url: buildWhatsappUrl(contact.whatsapp_phone),
      accentColor: '#25D366',
    });
  }

  if (contact.email) {
    actions.push({
      id: 'email',
      label: t('contactActions.email'),
      iconName: 'envelope',
      url: `mailto:${contact.email}`,
      accentColor: aotTheme.bronze,
    });
  }

  if (contact.website) {
    actions.push({
      id: 'website',
      label: t('contactActions.website'),
      iconName: 'globe',
      url: normalizeExternalUrl(contact.website),
      accentColor: aotTheme.textPrimary,
    });
  }

  if (contact.instagram_url) {
    actions.push({
      id: 'instagram',
      label: t('contactActions.instagram'),
      iconName: 'instagram',
      url: normalizeExternalUrl(contact.instagram_url),
      accentColor: '#E4405F',
    });
  }

  if (contact.facebook_url) {
    actions.push({
      id: 'facebook',
      label: t('contactActions.facebook'),
      iconName: 'facebook',
      url: normalizeExternalUrl(contact.facebook_url),
      accentColor: '#1877F2',
    });
  }

  if (contact.tiktok_url) {
    actions.push({
      id: 'tiktok',
      label: t('contactActions.tiktok'),
      iconName: 'tiktok',
      url: normalizeExternalUrl(contact.tiktok_url),
      accentColor: '#111111',
    });
  }

  return actions;
}

// Guest-facing logistics hub with grouped contacts and useful actions.
export default function TravelScreen() {
  const { t } = useI18n();
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
      setError(t('travel.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

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
          <Text style={styles.eyebrow}>{t('travel.eyebrow')}</Text>
          <Text style={styles.title}>{t('travel.title')}</Text>
          <Text style={styles.subtitle}>{t('travel.subtitle')}</Text>
          <Pressable
            style={[styles.secondaryButton, refreshing && styles.buttonDisabled]}
            onPress={handleRefresh}
            disabled={refreshing}>
            <Text style={styles.secondaryButtonText}>
              {refreshing ? t('travel.refreshLoading') : t('travel.refreshButton')}
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
            <Text style={styles.sectionTitle}>{t('travel.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('travel.emptyBody')}</Text>
          </View>
        ) : (
          (LOGISTICS_CONTACT_CATEGORY_IDS as LogisticsContactCategory[])
            .filter((category) => groupedContacts[category].length > 0)
            .map((category) => (
              <View key={category} style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>
                  {getLogisticsContactCategoryLabel(category, t)}
                </Text>
                {groupedContacts[category].map((contact) => {
                  const contactActions = buildContactActions(contact, t);

                  return (
                    <View key={contact.id} style={styles.contactCard}>
                      <Text style={styles.contactLabel}>{contact.label}</Text>
                      {contact.contact_person ? (
                        <Text style={styles.contactMeta}>
                          {t('travel.contactPerson', { value: contact.contact_person })}
                        </Text>
                      ) : null}
                      {contact.address ? <Text style={styles.contactMeta}>{contact.address}</Text> : null}
                      {contact.notes ? <Text style={styles.contactNotes}>{contact.notes}</Text> : null}

                      {contactActions.length > 0 ? (
                        <View style={styles.actionsRow}>
                          {contactActions.map((action) => (
                            <Pressable
                              key={action.id}
                              style={styles.actionButton}
                              onPress={() => openExternalUrl(action.url)}>
                              <View
                                style={[
                                  styles.actionIconBadge,
                                  {
                                    borderColor: action.accentColor,
                                    backgroundColor: `${action.accentColor}18`,
                                  },
                                ]}>
                                <FontAwesome6
                                  name={action.iconName}
                                  size={14}
                                  color={action.accentColor}
                                />
                              </View>
                              <Text style={styles.actionButtonText}>{action.label}</Text>
                            </Pressable>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: aotTheme.surfaceMuted,
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  actionIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
