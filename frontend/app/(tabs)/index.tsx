import { Link, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { aotTheme } from '@/constants/aotTheme';
import { apiBaseUrl } from '@/constants/apiConfig';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { createGuestInvitation } from '@/services/guestApi';
import { getApiErrorMessage } from '@/utils/apiErrors';

// Home screen styled like an editorial wedding landing page.
export default function LandingScreen() {
  const router = useRouter();
  const { canManageWedding, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const sectionOffsets = useRef<Record<string, number>>({});
  const floralFloat = useRef(new Animated.Value(0)).current;
  const [invitationToken, setInvitationToken] = useState('');
  const [guestFullName, setGuestFullName] = useState('');
  const [createInviteError, setCreateInviteError] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floralFloat, {
          toValue: -10,
          duration: 2600,
          useNativeDriver: true,
        }),
        Animated.timing(floralFloat, {
          toValue: 10,
          duration: 2600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [floralFloat]);

  function scrollToSection(sectionId: string) {
    const targetOffset = sectionOffsets.current[sectionId];
    if (typeof targetOffset !== 'number') {
      return;
    }

    scrollViewRef.current?.scrollTo({
      y: Math.max(targetOffset - 24, 0),
      animated: true,
    });
  }

  function openInvitationLink() {
    const normalizedToken = invitationToken.trim();
    if (!normalizedToken) {
      return;
    }

    router.push(`/rsvp/${encodeURIComponent(normalizedToken)}`);
  }

  async function createInviteAndOpenRsvp() {
    const normalizedGuestFullName = guestFullName.trim();
    if (!normalizedGuestFullName) {
      setCreateInviteError(t('landing.devTools.generate.emptyNameError'));
      return;
    }

    try {
      setIsCreatingInvite(true);
      setCreateInviteError(null);
      const createdInvitation = await createGuestInvitation({
        full_name: normalizedGuestFullName,
      });
      setInvitationToken(createdInvitation.invitation_token);
      router.push(`/rsvp/${encodeURIComponent(createdInvitation.invitation_token)}`);
    } catch (caughtError) {
      setCreateInviteError(
        getApiErrorMessage(
          caughtError,
          t('landing.devTools.generate.createError'),
        ),
      );
    } finally {
      setIsCreatingInvite(false);
    }
  }

  return (
    <ScrollView ref={scrollViewRef} contentContainerStyle={styles.container}>
      <View style={styles.page}>
        <View style={styles.navbar}>
          <View>
            <Text style={styles.navBrand}>Ilaria & Davide</Text>
            <Text style={styles.navSubBrand}>Operation Ravenna</Text>
          </View>
          <View style={styles.navLinks}>
            <Pressable onPress={() => scrollToSection('story')}>
              <Text style={styles.navLink}>{t('landing.nav.story')}</Text>
            </Pressable>
            <Pressable onPress={() => scrollToSection('ceremony')}>
              <Text style={styles.navLink}>{t('landing.nav.ceremony')}</Text>
            </Pressable>
            <Pressable onPress={() => scrollToSection('rsvp')}>
              <Text style={styles.navLink}>{t('landing.nav.rsvp')}</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/profile')}>
              <Text style={styles.navLink}>
                {isAuthenticated ? t('landing.nav.profile') : t('landing.nav.login')}
              </Text>
            </Pressable>
            {canManageWedding ? (
              <Pressable onPress={() => router.push('/admin')}>
                <Text style={styles.navLink}>{t('landing.nav.admin')}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View
          style={styles.heroSection}
          onLayout={(event) => {
            sectionOffsets.current.story = event.nativeEvent.layout.y;
          }}>
          <Animated.View
            style={[
              styles.floralBlobTop,
              {
                transform: [{ translateY: floralFloat }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.floralBlobBottom,
              {
                transform: [{ translateY: Animated.multiply(floralFloat, -1) }],
              },
            ]}
          />

          <View style={styles.heroInner}>
            <Text style={styles.heroEyebrow}>{t('landing.hero.eyebrow')}</Text>
            <Text style={styles.heroNames}>ILARIA</Text>
            <Text style={styles.heroAmpersand}>&</Text>
            <Text style={styles.heroNames}>DAVIDE</Text>

            <Pressable style={styles.heroButton} onPress={() => scrollToSection('rsvp')}>
              <Text style={styles.heroButtonText}>{t('landing.hero.button')}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.storySection}>
          <View style={styles.photoColumn}>
            <View style={styles.photoFrame}>
              <Text style={styles.photoPlaceholderText}>{t('landing.story.photoOne')}</Text>
            </View>
            <View style={styles.photoFrameTall}>
              <Text style={styles.photoPlaceholderText}>{t('landing.story.photoTwo')}</Text>
            </View>
            <View style={styles.initialBadge}>
              <Text style={styles.initialBadgeText}>I & D</Text>
            </View>
          </View>

          <View style={styles.storyTextCard}>
            <Text style={styles.sectionHeading}>{t('landing.story.heading')}</Text>
            <Text style={styles.storyParagraph}>{t('landing.story.paragraphOne')}</Text>
            <Text style={styles.storyParagraph}>{t('landing.story.paragraphTwo')}</Text>
          </View>
        </View>

        <View
          style={styles.ceremonySection}
          onLayout={(event) => {
            sectionOffsets.current.ceremony = event.nativeEvent.layout.y;
          }}>
          <View style={styles.ceremonyInfoCard}>
            <Text style={styles.sectionHeading}>{t('landing.ceremony.heading')}</Text>
            <Text style={styles.ceremonyLine}>{t('landing.ceremony.city')}</Text>
            <Text style={styles.ceremonyLine}>{t('landing.ceremony.venue')}</Text>
            <Text style={styles.ceremonyLineMuted}>{t('landing.ceremony.body')}</Text>
          </View>

          <View style={styles.ceremonyPhotoFrame}>
            <Text style={styles.photoPlaceholderText}>{t('landing.ceremony.artworkPlaceholder')}</Text>
            <View style={styles.decorativeFlowerCluster}>
              <FontAwesome name="pagelines" size={24} color={aotTheme.bronze} />
              <FontAwesome name="leaf" size={22} color={aotTheme.militaryGreen} />
            </View>
          </View>
        </View>

        <View
          style={styles.rsvpSection}
          onLayout={(event) => {
            sectionOffsets.current.rsvp = event.nativeEvent.layout.y;
          }}>
          <Text style={styles.rsvpHeading}>{t('landing.rsvp.heading')}</Text>
          <Text style={styles.rsvpBody}>{t('landing.rsvp.body')}</Text>

          <View style={styles.rsvpActionRow}>
            <Pressable style={styles.heroButton} onPress={() => scrollToSection('devTools')}>
              <Text style={styles.heroButtonText}>{t('landing.rsvp.button')}</Text>
            </Pressable>
          </View>
        </View>

        <View
          style={styles.devToolsSection}
          onLayout={(event) => {
            sectionOffsets.current.devTools = event.nativeEvent.layout.y;
          }}>
          <Text style={styles.devToolsTitle}>{t('landing.devTools.title')}</Text>
          <Text style={styles.devToolsDescription}>{t('landing.devTools.description')}</Text>

          <View style={styles.devGrid}>
            <View style={styles.devCard}>
              <Text style={styles.devCardTitle}>{t('landing.devTools.generate.title')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('landing.devTools.generate.placeholder')}
                placeholderTextColor={aotTheme.textMuted}
                value={guestFullName}
                onChangeText={setGuestFullName}
              />
              <Pressable
                style={[
                  styles.primaryButton,
                  (!guestFullName.trim() || isCreatingInvite || !canManageWedding) &&
                    styles.buttonDisabled,
                ]}
                onPress={createInviteAndOpenRsvp}
                disabled={!guestFullName.trim() || isCreatingInvite || !canManageWedding}>
                <Text style={styles.primaryButtonText}>
                  {isCreatingInvite
                    ? t('landing.devTools.generate.loadingButton')
                    : t('landing.devTools.generate.button')}
                </Text>
              </Pressable>
              {createInviteError ? <Text style={styles.error}>{createInviteError}</Text> : null}
              {!canManageWedding ? (
                <Text style={styles.hint}>{t('landing.devTools.generate.hint')}</Text>
              ) : null}
            </View>

            <View style={styles.devCard}>
              <Text style={styles.devCardTitle}>{t('landing.devTools.open.title')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('landing.devTools.open.placeholder')}
                placeholderTextColor={aotTheme.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                value={invitationToken}
                onChangeText={setInvitationToken}
              />
              <Pressable
                style={[styles.secondaryButton, !invitationToken.trim() && styles.buttonDisabled]}
                onPress={openInvitationLink}
                disabled={!invitationToken.trim()}
              >
                <Text style={styles.secondaryButtonText}>{t('landing.devTools.open.button')}</Text>
              </Pressable>
              <Link href="/rsvp/demo-token-001" style={styles.link}>
                {t('landing.devTools.open.demoLink')}
              </Link>
            </View>
          </View>
        </View>

        <View style={styles.faqSection}>
          <Text style={styles.darkSectionEyebrow}>{t('landing.faq.eyebrow')}</Text>
          <Text style={styles.darkSectionTitle}>{t('landing.faq.title')}</Text>

          <View style={styles.faqList}>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>{t('landing.faq.locationQuestion')}</Text>
              <Text style={styles.faqAnswer}>{t('landing.faq.locationAnswer')}</Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>{t('landing.faq.foodQuestion')}</Text>
              <Text style={styles.faqAnswer}>{t('landing.faq.foodAnswer')}</Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>{t('landing.faq.phoneQuestion')}</Text>
              <Text style={styles.faqAnswer}>{t('landing.faq.phoneAnswer')}</Text>
            </View>
          </View>

          <View style={styles.aotDecorativeRow}>
            <View style={styles.decorativePill}>
              <FontAwesome name="shield" size={16} color={aotTheme.bronze} />
              <Text style={styles.decorativePillText}>{t('landing.decorative.wings')}</Text>
            </View>
            <View style={styles.decorativePill}>
              <FontAwesome name="compass" size={16} color={aotTheme.bronze} />
              <Text style={styles.decorativePillText}>{t('landing.decorative.mission')}</Text>
            </View>
            <View style={styles.decorativePill}>
              <FontAwesome name="map" size={16} color={aotTheme.bronze} />
              <Text style={styles.decorativePillText}>{t('landing.decorative.routes')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.contactSection}>
          <View style={styles.contactHeader}>
            <Text style={styles.contactTitle}>{t('landing.contacts.title')}</Text>
            <View style={styles.contactEmblem}>
              <FontAwesome name="leaf" size={24} color={aotTheme.militaryGreenDark} />
              <FontAwesome name="star" size={18} color={aotTheme.bronze} />
            </View>
          </View>

          <View style={styles.contactGrid}>
            <View style={styles.contactCard}>
              <Text style={styles.contactCardTitle}>{t('landing.contacts.teamTitle')}</Text>
              <Text style={styles.contactLine}>{t('landing.contacts.teamLine')}</Text>
              <Text style={styles.contactLineMuted}>{t('landing.contacts.teamBody')}</Text>
            </View>

            <View style={styles.contactCard}>
              <Text style={styles.contactCardTitle}>{t('landing.contacts.travelTitle')}</Text>
              <Text style={styles.contactLine}>{t('landing.contacts.travelLine')}</Text>
              <Text style={styles.contactLineMuted}>{t('landing.contacts.travelBody')}</Text>
            </View>

            <View style={styles.contactCard}>
              <Text style={styles.contactCardTitle}>{t('landing.contacts.ceremonyTitle')}</Text>
              <Text style={styles.contactLine}>{t('landing.contacts.ceremonyLine')}</Text>
              <Text style={styles.contactLineMuted}>{t('landing.contacts.ceremonyBody')}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.api}>{t('landing.apiConnected', { apiBaseUrl })}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: aotTheme.background,
    padding: 20,
    paddingTop: 28,
    paddingBottom: 120,
    alignItems: 'center',
  },
  page: {
    width: '100%',
    maxWidth: 1180,
  },
  navbar: {
    backgroundColor: 'rgba(249, 248, 243, 0.88)',
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  navBrand: {
    color: aotTheme.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  navSubBrand: {
    color: aotTheme.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  navLinks: {
    flexDirection: 'row',
    gap: 18,
    flexWrap: 'wrap',
  },
  navLink: {
    color: aotTheme.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  heroSection: {
    backgroundColor: aotTheme.surface,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: aotTheme.border,
    minHeight: 440,
    marginBottom: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floralBlobTop: {
    position: 'absolute',
    top: -30,
    left: -10,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(184, 138, 82, 0.12)',
  },
  floralBlobBottom: {
    position: 'absolute',
    bottom: -40,
    right: -10,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(95, 117, 86, 0.12)',
  },
  heroInner: {
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 1,
  },
  heroEyebrow: {
    color: aotTheme.parchment,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 18,
  },
  heroNames: {
    color: aotTheme.textPrimary,
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: 6,
    fontWeight: '300',
    textAlign: 'center',
  },
  heroAmpersand: {
    color: aotTheme.bronze,
    fontSize: 40,
    lineHeight: 50,
    marginVertical: 4,
  },
  heroButton: {
    marginTop: 24,
    backgroundColor: aotTheme.surface,
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 26,
  },
  heroButtonText: {
    color: aotTheme.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  storySection: {
    flexDirection: 'row',
    gap: 18,
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  photoColumn: {
    flex: 1.1,
    minWidth: 300,
    backgroundColor: '#efd4c4',
    borderRadius: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(184, 138, 82, 0.18)',
    minHeight: 420,
    position: 'relative',
  },
  photoFrame: {
    width: '42%',
    aspectRatio: 0.72,
    backgroundColor: aotTheme.surface,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoFrameTall: {
    width: '42%',
    aspectRatio: 0.62,
    backgroundColor: aotTheme.surface,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: '48%',
    top: 30,
  },
  photoPlaceholderText: {
    color: aotTheme.textMuted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  initialBadge: {
    position: 'absolute',
    left: 26,
    bottom: 26,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(95, 117, 86, 0.24)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: 'rgba(249, 248, 243, 0.6)',
  },
  initialBadgeText: {
    color: aotTheme.textPrimary,
    fontSize: 24,
    letterSpacing: 4,
  },
  storyTextCard: {
    flex: 0.9,
    minWidth: 280,
    backgroundColor: aotTheme.surface,
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 30,
    padding: 28,
    justifyContent: 'center',
  },
  sectionHeading: {
    color: aotTheme.textPrimary,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: 2,
    fontWeight: '300',
    marginBottom: 18,
  },
  storyParagraph: {
    color: aotTheme.textMuted,
    fontSize: 15,
    lineHeight: 25,
    marginBottom: 14,
  },
  ceremonySection: {
    flexDirection: 'row',
    gap: 18,
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  ceremonyInfoCard: {
    flex: 0.9,
    minWidth: 280,
    backgroundColor: aotTheme.surface,
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 30,
    padding: 28,
    justifyContent: 'center',
  },
  ceremonyLine: {
    color: aotTheme.textPrimary,
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 6,
  },
  ceremonyLineMuted: {
    color: aotTheme.textMuted,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 16,
  },
  ceremonyPhotoFrame: {
    flex: 1.1,
    minWidth: 320,
    minHeight: 360,
    backgroundColor: aotTheme.surface,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: aotTheme.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeFlowerCluster: {
    position: 'absolute',
    right: 24,
    bottom: 22,
    flexDirection: 'row',
    gap: 8,
  },
  rsvpSection: {
    backgroundColor: '#efd4c4',
    borderRadius: 30,
    paddingVertical: 52,
    paddingHorizontal: 28,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(184, 138, 82, 0.18)',
  },
  rsvpHeading: {
    color: aotTheme.textPrimary,
    fontSize: 42,
    lineHeight: 50,
    letterSpacing: 2,
    fontWeight: '300',
    textAlign: 'center',
    maxWidth: 760,
    marginBottom: 16,
  },
  rsvpBody: {
    color: aotTheme.textMuted,
    fontSize: 15,
    lineHeight: 25,
    textAlign: 'center',
    maxWidth: 720,
  },
  rsvpActionRow: {
    marginTop: 12,
  },
  devToolsSection: {
    backgroundColor: aotTheme.surface,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: aotTheme.border,
    padding: 24,
  },
  devToolsTitle: {
    color: aotTheme.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  devToolsDescription: {
    color: aotTheme.textMuted,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 18,
  },
  devGrid: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  devCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: aotTheme.surfaceMuted,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: aotTheme.border,
  },
  devCardTitle: {
    color: aotTheme.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 16,
    padding: 14,
    color: aotTheme.textPrimary,
    backgroundColor: aotTheme.surface,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: aotTheme.militaryGreenDark,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: aotTheme.surface,
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: 'rgba(249,248,243,0.72)',
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: aotTheme.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  hint: {
    color: aotTheme.parchment,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },
  link: {
    color: aotTheme.bronze,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
  },
  api: {
    color: aotTheme.textMuted,
    fontSize: 12,
    marginTop: 14,
  },
  error: {
    color: aotTheme.danger,
    marginBottom: 12,
  },
  faqSection: {
    backgroundColor: aotTheme.militaryGreenDark,
    borderRadius: 30,
    padding: 28,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(249, 248, 243, 0.08)',
  },
  darkSectionEyebrow: {
    color: 'rgba(249, 248, 243, 0.72)',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  darkSectionTitle: {
    color: aotTheme.surface,
    fontSize: 42,
    fontWeight: '300',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 22,
  },
  faqList: {
    gap: 18,
  },
  faqItem: {
    alignItems: 'center',
  },
  faqQuestion: {
    color: aotTheme.surface,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  faqAnswer: {
    color: 'rgba(249, 248, 243, 0.78)',
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 760,
  },
  aotDecorativeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
  },
  decorativePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(249, 248, 243, 0.14)',
    backgroundColor: 'rgba(249, 248, 243, 0.06)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  decorativePillText: {
    color: aotTheme.surface,
    fontSize: 13,
    fontWeight: '600',
  },
  contactSection: {
    backgroundColor: '#cfe3ee',
    borderRadius: 30,
    padding: 28,
    borderWidth: 1,
    borderColor: '#b3ccd9',
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginBottom: 22,
    flexWrap: 'wrap',
  },
  contactTitle: {
    color: aotTheme.textPrimary,
    fontSize: 38,
    fontWeight: '300',
    letterSpacing: 1,
  },
  contactEmblem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  contactCard: {
    flex: 1,
    minWidth: 220,
  },
  contactCardTitle: {
    color: aotTheme.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  contactLine: {
    color: aotTheme.textPrimary,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 8,
  },
  contactLineMuted: {
    color: aotTheme.textMuted,
    fontSize: 14,
    lineHeight: 23,
  },
});
