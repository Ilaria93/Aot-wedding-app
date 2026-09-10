import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useI18n } from '@/contexts/I18nContext';
import './styles/ScreenBackButton.scss';

type ScreenBackButtonProps = {
  fallback?: string;
  // Skip browser history and always go to `fallback` — for screens reached
  // after a state change (e.g. auth/login after logout) where a history
  // entry may point to a now-protected route that just bounces back here.
  alwaysFallback?: boolean;
};

/** Header back control for nested routes. */
export function ScreenBackButton({ fallback = '/', alwaysFallback = false }: ScreenBackButtonProps) {
  const navigate = useNavigate();
  const { t } = useI18n();

  function handleBack() {
    if (!alwaysFallback && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallback);
  }

  return (
    <button type="button" className="screen-back" onClick={handleBack}>
      <ChevronLeft size={18} aria-hidden />
      <span>{t('common.back')}</span>
    </button>
  );
}
