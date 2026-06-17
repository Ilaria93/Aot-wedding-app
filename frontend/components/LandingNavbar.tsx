import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { aotTheme } from '@/constants/aotTheme';
import { useI18n } from '@/contexts/I18nContext';

type LandingNavbarProps = {
  variant: 'overlay' | 'page';
  isAuthenticated: boolean;
  canManageWedding: boolean;
  onNavigateSection: (sectionId: string) => void;
  onNavigateProfile: () => void;
  onNavigateAdmin: () => void;
};

/**
 * AoT-inspired landing navbar — brand emblem, section links, isolated locale picker.
 */
export function LandingNavbar({
  variant,
  isAuthenticated,
  canManageWedding,
  onNavigateSection,
  onNavigateProfile,
  onNavigateAdmin,
}: LandingNavbarProps) {
  const { t } = useI18n();
  const isOverlay = variant === 'overlay';
  const tone = isOverlay ? 'dark' : 'light';

  return (
    <View style={[styles.shell, isOverlay ? styles.shellOverlay : styles.shellPage]}>
      <View style={styles.topRow}>
        <View style={styles.brandBlock}>
          <View style={[styles.emblem, isOverlay && styles.emblemOverlay]}>
            <FontAwesome
              name="shield"
              size={18}
              color={isOverlay ? aotTheme.bronze : aotTheme.militaryGreenDark}
            />
          </View>
          <View>
            <Text style={[styles.brand, isOverlay && styles.brandOverlay]}>Ilaria & Davide</Text>
            <Text style={[styles.mission, isOverlay && styles.missionOverlay]}>
              {t('landing.hero.operationTag')}
            </Text>
          </View>
        </View>

        {Platform.OS === 'web' ? <LanguageSwitcher compact tone={tone} /> : null}
      </View>

      <View style={[styles.divider, isOverlay && styles.dividerOverlay]} />

      <View style={styles.linksRow}>
        <Pressable onPress={() => onNavigateSection('story')}>
          <Text style={[styles.link, isOverlay && styles.linkOverlay]}>{t('landing.nav.story')}</Text>
        </Pressable>
        <Pressable onPress={() => onNavigateSection('ceremony')}>
          <Text style={[styles.link, isOverlay && styles.linkOverlay]}>{t('landing.nav.ceremony')}</Text>
        </Pressable>
        <Pressable onPress={() => onNavigateSection('rsvp')}>
          <Text style={[styles.link, isOverlay && styles.linkOverlay]}>{t('landing.nav.rsvp')}</Text>
        </Pressable>
        <Pressable onPress={() => onNavigateSection('gift')}>
          <Text style={[styles.link, isOverlay && styles.linkOverlay]}>{t('landing.nav.gift')}</Text>
        </Pressable>
        <Pressable onPress={onNavigateProfile}>
          <Text style={[styles.link, isOverlay && styles.linkOverlay]}>
            {isAuthenticated ? t('landing.nav.profile') : t('landing.nav.login')}
          </Text>
        </Pressable>
        {canManageWedding ? (
          <Pressable onPress={onNavigateAdmin}>
            <Text style={[styles.link, isOverlay && styles.linkOverlay]}>{t('landing.nav.admin')}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  shellPage: {
    backgroundColor: 'rgba(249, 248, 243, 0.94)',
    borderColor: aotTheme.border,
    marginBottom: 18,
    borderLeftWidth: 4,
    borderLeftColor: aotTheme.bronze,
  },
  shellOverlay: {
    backgroundColor: 'rgba(20, 26, 23, 0.78)',
    borderColor: 'rgba(184, 138, 82, 0.32)',
    borderLeftWidth: 4,
    borderLeftColor: aotTheme.bronze,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 200,
  },
  emblem: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: aotTheme.border,
    backgroundColor: aotTheme.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemOverlay: {
    borderColor: 'rgba(184, 138, 82, 0.4)',
    backgroundColor: 'rgba(249, 248, 243, 0.06)',
  },
  brand: {
    color: aotTheme.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  brandOverlay: {
    color: aotTheme.surface,
  },
  mission: {
    marginTop: 2,
    color: aotTheme.militaryGreenDark,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.6,
    textTransform: 'uppercase',
  },
  missionOverlay: {
    color: 'rgba(184, 138, 82, 0.92)',
  },
  divider: {
    height: 1,
    backgroundColor: aotTheme.border,
  },
  dividerOverlay: {
    backgroundColor: 'rgba(249, 248, 243, 0.1)',
  },
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'center',
  },
  link: {
    color: aotTheme.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  linkOverlay: {
    color: 'rgba(244, 241, 232, 0.9)',
  },
});
