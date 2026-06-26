export type LanguageSwitcherProps = {
  compact?: boolean;
  /** Inline locale grid for menus and panels (no separate dropdown). */
  embedded?: boolean;
  onLocaleChange?: () => void;
};
