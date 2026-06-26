import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Globe } from 'lucide-react';

import { getLocaleLabel, useI18n } from '@/contexts/I18nContext';
import { supportedLocales } from '@/i18n/translations';
import type { LanguageSwitcherProps } from '@/components/LanguageSwitcher/types/LanguageSwitcher.types';
import './styles/LanguageSwitcher.scss';

/** Dropdown or embedded language switcher for headers and account menus. */
export function LanguageSwitcher({
  compact = false,
  embedded = false,
  onLocaleChange,
}: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const currentLabel = compact ? locale.toUpperCase() : getLocaleLabel(locale);

  async function handleSelect(nextLocale: (typeof supportedLocales)[number]) {
    setIsOpen(false);
    if (nextLocale !== locale) {
      await setLocale(nextLocale);
    }
    onLocaleChange?.();
  }

  if (embedded) {
    return (
      <div className="language-switcher language-switcher--embedded" role="group" aria-label={t('language.label')}>
        {supportedLocales.map((item) => {
          const isActive = item === locale;
          return (
            <button
              key={item}
              type="button"
              className={`language-switcher__chip${isActive ? ' is-active' : ''}`}
              aria-pressed={isActive}
              onClick={() => void handleSelect(item)}>
              <span>{getLocaleLabel(item)}</span>
              {isActive ? <Check size={12} aria-hidden /> : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={compact ? 'language-switcher language-switcher--compact' : 'language-switcher'}>
      {!compact ? <span className="language-switcher__label">{t('language.label')}</span> : null}
      <div className="language-switcher__dropdown">
        <button
          type="button"
          className={`language-switcher__trigger${isOpen ? ' is-open' : ''}`}
          onClick={() => setIsOpen((current) => !current)}>
          <span className="language-switcher__trigger-content">
            <Globe size={14} />
            {currentLabel}
          </span>
          {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {isOpen ? (
          <div className="language-switcher__menu" role="menu">
            {supportedLocales.map((item) => {
              const isActive = item === locale;
              return (
                <button
                  key={item}
                  type="button"
                  className={`language-switcher__option${isActive ? ' is-active' : ''}`}
                  onClick={() => void handleSelect(item)}>
                  <span>{getLocaleLabel(item)}</span>
                  {isActive ? <Check size={12} /> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
