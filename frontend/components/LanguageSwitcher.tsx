import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { aotTheme } from '@/constants/aotTheme';
import { getLocaleLabel, useI18n } from '@/contexts/I18nContext';
import { supportedLocales } from '@/i18n/translations';

type LanguageSwitcherProps = {
  compact?: boolean;
};

// Small reusable language switcher for stack headers and screens.
export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const currentLabel = compact ? locale.toUpperCase() : getLocaleLabel(locale);

  async function handleSelect(nextLocale: (typeof supportedLocales)[number]) {
    setIsOpen(false);

    if (nextLocale === locale) {
      return;
    }

    await setLocale(nextLocale);
  }

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {!compact ? <Text style={styles.label}>{t('language.label')}</Text> : null}

      <View style={styles.dropdownWrapper}>
        <Pressable
          style={[styles.trigger, isOpen && styles.triggerOpen, compact && styles.triggerCompact]}
          onPress={() => setIsOpen((current) => !current)}>
          <View style={styles.triggerContent}>
            <FontAwesome
              name="globe"
              size={14}
              color={isOpen ? aotTheme.militaryGreenDark : aotTheme.textMuted}
            />
            <Text style={[styles.triggerText, isOpen && styles.triggerTextOpen]}>{currentLabel}</Text>
          </View>
          <FontAwesome
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={12}
            color={aotTheme.textMuted}
          />
        </Pressable>

        {isOpen ? (
          <View style={styles.menu}>
            {supportedLocales.map((item) => {
              const isActive = item === locale;

              return (
                <Pressable
                  key={item}
                  style={[styles.option, isActive && styles.optionActive]}
                  onPress={() => void handleSelect(item)}>
                  <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                    {getLocaleLabel(item)}
                  </Text>
                  {isActive ? (
                    <FontAwesome name="check" size={12} color={aotTheme.militaryGreenDark} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  containerCompact: {
    alignItems: 'flex-end',
  },
  label: {
    color: aotTheme.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dropdownWrapper: {
    position: 'relative',
    minWidth: 124,
  },
  trigger: {
    minHeight: 38,
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: aotTheme.surfaceMuted,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  triggerCompact: {
    minWidth: 96,
  },
  triggerOpen: {
    borderColor: aotTheme.bronze,
    backgroundColor: '#f3e4d3',
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  triggerText: {
    color: aotTheme.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  triggerTextOpen: {
    color: aotTheme.militaryGreenDark,
  },
  menu: {
    position: 'absolute',
    top: 44,
    right: 0,
    minWidth: 164,
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 16,
    backgroundColor: aotTheme.surface,
    padding: 6,
    zIndex: 20,
    shadowColor: '#243024',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  option: {
    minHeight: 40,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionActive: {
    backgroundColor: '#f3e4d3',
  },
  optionText: {
    color: aotTheme.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  optionTextActive: {
    color: aotTheme.militaryGreenDark,
  },
});
