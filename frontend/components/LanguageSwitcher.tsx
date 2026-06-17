import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { aotTheme } from '@/constants/aotTheme';
import { useI18n } from '@/contexts/I18nContext';
import { supportedLocales, type AppLocale } from '@/i18n/translations';

type LanguageSwitcherProps = {
  /** Hides the LINGUA eyebrow when space is tight (tab header, navbar). */
  compact?: boolean;
  /** Light = editorial navbar; dark = cinematic overlay / military header. */
  tone?: 'light' | 'dark';
};

const LOCALE_CODES: Record<AppLocale, string> = {
  it: 'IT',
  en: 'EN',
  fr: 'FR',
  de: 'DE',
};

/**
 * Tactical locale picker — segmented pills in Survey Corps palette (no dropdown).
 */
export function LanguageSwitcher({ compact = false, tone = 'light' }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();
  const isDark = tone === 'dark';

  async function handleSelect(nextLocale: AppLocale) {
    if (nextLocale === locale) {
      return;
    }

    await setLocale(nextLocale);
  }

  return (
    <View style={styles.root}>
      {!compact ? (
        <View style={styles.labelRow}>
          <FontAwesome
            name="shield"
            size={11}
            color={isDark ? aotTheme.bronze : aotTheme.militaryGreenDark}
          />
          <Text style={[styles.label, isDark && styles.labelDark]}>{t('language.label')}</Text>
        </View>
      ) : null}

      <View style={[styles.track, isDark && styles.trackDark]}>
        {supportedLocales.map((item) => {
          const isActive = item === locale;

          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              style={[styles.pill, isActive && styles.pillActive, isActive && isDark && styles.pillActiveDark]}
              onPress={() => void handleSelect(item)}>
              <Text
                style={[
                  styles.pillText,
                  isDark && styles.pillTextDark,
                  isActive && styles.pillTextActive,
                  isActive && isDark && styles.pillTextActiveDark,
                ]}>
                {LOCALE_CODES[item]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'flex-end',
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    color: aotTheme.militaryGreenDark,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  labelDark: {
    color: 'rgba(244, 241, 232, 0.62)',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    padding: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: aotTheme.border,
    backgroundColor: aotTheme.surfaceMuted,
  },
  trackDark: {
    borderColor: 'rgba(184, 138, 82, 0.35)',
    backgroundColor: 'rgba(12, 16, 14, 0.55)',
  },
  pill: {
    minWidth: 34,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: aotTheme.militaryGreenDark,
  },
  pillActiveDark: {
    backgroundColor: aotTheme.bronze,
  },
  pillText: {
    color: aotTheme.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  pillTextDark: {
    color: 'rgba(244, 241, 232, 0.55)',
  },
  pillTextActive: {
    color: aotTheme.surface,
  },
  pillTextActiveDark: {
    color: '#1a211d',
  },
});
