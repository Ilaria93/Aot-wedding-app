import { Check, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { useState } from 'react';

import { getLocaleLabel, useI18n } from '@/contexts/I18nContext';
import { supportedLocales } from '@/i18n/translations';

type LanguageSwitcherProps = {
  compact?: boolean;
};

/** Dropdown language switcher for headers and profile screens. */
export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const currentLabel = compact ? locale.toUpperCase() : getLocaleLabel(locale);

  async function handleSelect(nextLocale: (typeof supportedLocales)[number]) {
    setIsOpen(false);
    if (nextLocale !== locale) {
      await setLocale(nextLocale);
    }
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
      <style>{`
        .language-switcher { display: grid; gap: 8px; }
        .language-switcher--compact { justify-items: end; }
        .language-switcher__label {
          color: var(--aot-text-muted);
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .language-switcher__dropdown { position: relative; min-width: 124px; }
        .language-switcher__trigger {
          width: 100%;
          min-height: 38px;
          border: 1px solid var(--aot-border);
          border-radius: 999px;
          padding: 8px 12px;
          background: var(--aot-surface-muted);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          cursor: pointer;
        }
        .language-switcher__trigger.is-open {
          border-color: var(--aot-bronze);
          background: #f3e4d3;
        }
        .language-switcher__trigger-content {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
        }
        .language-switcher__menu {
          position: absolute;
          top: 44px;
          right: 0;
          min-width: 164px;
          border: 1px solid var(--aot-border);
          border-radius: 16px;
          background: var(--aot-surface);
          padding: 6px;
          z-index: 20;
          box-shadow: 0 8px 24px rgba(36, 48, 36, 0.1);
        }
        .language-switcher__option {
          width: 100%;
          min-height: 40px;
          border: none;
          border-radius: 12px;
          padding: 10px 12px;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          cursor: pointer;
          font-weight: 600;
        }
        .language-switcher__option.is-active { background: #f3e4d3; }
      `}</style>
    </div>
  );
}
